import asyncio
import logging
import re
import httpx
from fastapi import APIRouter, Header, HTTPException, Query
from fastapi.responses import Response
from typing import Optional

logger = logging.getLogger(__name__)

from services.auth_service import verify_api_key
from api.gw2_client import (
    get_characters,
    get_character_core,
    get_character_build_tab,
    get_character_equipment,
    get_character_inventory,
    get_character_crafting,
    get_character_render,
    get_bank,
    get_item_details,
    get_item_prices,
    get_item_names,
    get_skill_details,
    get_trait_details,
    get_specialization_details,
    get_commerce_prices,
    get_commerce_listings,
    get_commerce_exchange,
    get_account_wallet,
    get_currencies,
    get_materials,
    get_material_categories,
    search_items_by_name,
    get_account,
    get_achievement_groups,
    get_achievement_categories,
    get_achievements,
    get_daily_achievements,
    get_account_achievements,
    get_raids,
    get_account_raids,
    get_masteries,
    get_account_masteries,
    get_account_mastery_points,
    get_account_dyes,
    get_account_skins,
    get_account_minis,
    get_account_finishers,
    get_account_gliders,
    get_account_mailcarriers,
    get_skin_details,
    get_mini_details,
    get_color_details,
    get_finisher_details,
    get_glider_details,
    get_mailcarrier_details,
    get_professions,
    get_profession_details,
    get_recipe_details,
    get_wizardsvault_daily,
    get_wizardsvault_weekly,
    get_wizardsvault_special,
    get_wizardsvault_listings,
    get_wizardsvault_season,
    get_wizardsvault_all_objectives,
    get_wizardsvault_all_listings,
    get_legendary_armory,
    get_dungeons,
    get_account_dungeons,
    get_dailycrafting,
    get_account_dailycrafting,
    get_worldbosses,
    get_account_worldbosses,
)
from api.deepseek_client import analyze as deepseek_analyze
from services.build_analyzer import analyze_build_text, fetch_metabattle_build, get_metabattle_build_name
from services.inventory_analyzer import analyze_inventory_text, INVENTORY_INSTRUCTIONS
from services.trading_post_analyzer import analyze_trading_post_prompt
from cache.memory_cache import MemoryCache, character_cache, item_cache, price_cache
from models.character import CharacterSummary
from utils.errors import AuthError

translate_cache = MemoryCache(maxsize=2048, ttl=86400)  # 24h TTL for translations

router = APIRouter(prefix="/api")


def _strip_gw2_tags(text: Optional[str]) -> Optional[str]:
    """Remove GW2 chat markup tags like <c=@flavor>...</c> from text."""
    if not text:
        return text
    text = re.sub(r'<c?=@?\w*>[^<]*</c>', '', text)
    text = re.sub(r'<c?=@?\w*/>', '', text)
    text = re.sub(r'<br[^>]*>', '\n', text)
    text = text.strip()
    return text


_translate_semaphore = asyncio.Semaphore(3)

async def _translate_single(text: str, client: httpx.AsyncClient) -> str:
    """Translate a single text from English to Russian via Google Translate."""
    async with _translate_semaphore:
        try:
            params = {"client": "gtx", "sl": "en", "tl": "ru", "dt": "t", "q": text}
            resp = await client.get(
                "https://translate.googleapis.com/translate_a/single",
                params=params,
                timeout=5.0,
            )
            if resp.status_code == 200 and resp.text:
                data = resp.json()
                if isinstance(data, list) and len(data) > 0 and isinstance(data[0], list) and len(data[0]) > 0:
                    entry = data[0][0]
                    if isinstance(entry, list) and len(entry) > 0:
                        trans = str(entry[0])
                        if trans and trans.strip() and any(ord(c) > 127 for c in trans):
                            return trans
        except Exception as e:
            logger.warning(f"Translation failed for '{text[:50]}': {e}")
    return text


async def _translate_texts(texts: list[str]) -> list[str]:
    """Translate multiple texts from English to Russian via Google Translate (free, no API key).
    Max 15 texts per call to avoid timeouts."""
    if not texts:
        return texts

    results = []
    uncached_indices = []
    uncached_texts = []

    for i, t in enumerate(texts):
        if not t or not t.strip():
            results.append(t)
        else:
            cached = translate_cache.get(t)
            if cached is not None:
                results.append(cached)
            else:
                results.append(None)
                uncached_indices.append(i)
                uncached_texts.append(t)

    if not uncached_texts:
        return results

    # Limit to 15 texts to avoid timeouts
    to_translate = uncached_texts[:15]
    to_translate_indices = uncached_indices[:15]

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            tasks = [_translate_single(t, client) for t in to_translate]
            translated_batch = await asyncio.gather(*tasks, return_exceptions=True)
            for j, idx in enumerate(to_translate_indices):
                trans = translated_batch[j]
                if isinstance(trans, str):
                    results[idx] = trans
                    translate_cache.set(uncached_texts[idx], trans)
                else:
                    results[idx] = uncached_texts[idx]
    except Exception as e:
        logger.warning(f"Translation batch failed: {e}")

    # Fill any remaining uncached texts with originals
    for i in range(len(uncached_texts)):
        idx = uncached_indices[i]
        if results[idx] is None:
            results[idx] = uncached_texts[i]

    return results


def _get_build_specs(build_data: dict) -> list:
    """Extract specializations from build data (handles buildtabs/active nested format)."""
    inner = build_data.get("build", {})
    if inner:
        return inner.get("specializations", [])
    return build_data.get("specializations", [])


def _get_build_skills(build_data: dict) -> dict:
    """Extract skills from build data (handles buildtabs/active nested format)."""
    inner = build_data.get("build", {})
    if inner:
        return inner.get("skills", {})
    return build_data.get("skills", {})


def _sanitize_item(item: dict) -> dict:
    """Clean up item data by stripping GW2 markup tags and extracting all possible attributes."""
    if "description" in item:
        item["description"] = _strip_gw2_tags(item.get("description"))
    details = item.get("details") or {}
    infix = details.get("infix_upgrade") or {}
    attrs_list = infix.get("attributes") or []
    if attrs_list:
        item["attributes"] = {a["attribute"]: a["modifier"] for a in attrs_list}
    item["defense"] = details.get("defense")
    item["weight_class"] = details.get("weight_class")
    item["item_type"] = details.get("type")

    # Full item details extraction
    item["rarity"] = item.get("rarity", "")
    item["level"] = item.get("level", 0)
    item["vendor_value"] = item.get("vendor_value", 0)
    item["default_skin"] = item.get("default_skin", 0)
    item["flags"] = item.get("flags", [])

    # Extract details sub-fields
    item["armor_class"] = details.get("weight_class", "")
    item["armor_type"] = details.get("type", "")
    item["armor_defense"] = details.get("defense")
    item["weapon_type"] = details.get("type", "")
    item["weapon_damage_type"] = details.get("damage_type", "")
    item["weapon_min_power"] = details.get("min_power")
    item["weapon_max_power"] = details.get("max_power")
    item["trinket_type"] = details.get("type", "")
    item["container_type"] = details.get("type", "")
    item["bag_size"] = details.get("size")
    item["gathering_tool_type"] = details.get("type", "")
    item["consumable_type"] = details.get("type", "")
    item["gizmo_type"] = details.get("type", "")
    item["suffix_item_id"] = details.get("suffix_item_id")

    # Suffix / upgrade (may be a string or dict)
    suffix = details.get("suffix")
    if isinstance(suffix, dict):
        item["suffix"] = suffix.get("name", "")
    elif isinstance(suffix, str):
        item["suffix"] = suffix
    else:
        item["suffix"] = ""

    # Infusion slots
    infusion_slots = details.get("infusion_slots") or []
    item["infusion_slots"] = [s.get("flags", []) for s in infusion_slots]

    # Upgrade component
    upgrade = details.get("upgrade_component") or {}
    if upgrade:
        item["upgrade_component"] = {
            "name": upgrade.get("name", ""),
            "description": _strip_gw2_tags(upgrade.get("description", "")),
        }

    return item


@router.get("/health")
async def api_health():
    return {"status": "ok", "version": "1.0.0"}


def _get_api_key(authorization: Optional[str] = None) -> str:
    if not authorization:
        raise AuthError(detail="Missing Authorization header")
    scheme, _, key = authorization.partition(" ")
    if scheme.lower() != "bearer" or not key:
        raise AuthError(detail="Invalid Authorization header. Use: Bearer <api_key>")
    return key


@router.get("/account/wallet")
async def account_wallet(authorization: Optional[str] = Header(None)):
    api_key = _get_api_key(authorization)
    wallet = await get_account_wallet(api_key)

    currency_ids = [w["id"] for w in wallet]
    currency_map = {}
    if currency_ids:
        currencies = await get_currencies(currency_ids)
        for c in currencies:
            currency_map[c["id"]] = c

    enriched = []
    for w in wallet:
        cid = w["id"]
        info = currency_map.get(cid, {})
        enriched.append({
            "id": cid,
            "name": info.get("name", f"Currency {cid}"),
            "icon": info.get("icon", ""),
            "value": w.get("value", 0),
            "description": info.get("description", ""),
            "order": info.get("order", 999),
        })
    enriched.sort(key=lambda x: x["order"])
    return {"wallet": enriched}


@router.get("/currencies")
async def currencies_endpoint(
    currency_ids: str = Query("all"),
):
    if currency_ids == "all":
        import httpx
        async with httpx.AsyncClient() as client:
            resp = await client.get("https://api.guildwars2.com/v2/currencies?ids=all&page=0&page_size=200")
            if resp.status_code == 200:
                all_currencies = resp.json()
                return {"currencies": [{"id": c["id"], "name": c["name"], "icon": c["icon"], "description": c.get("description", ""), "order": c.get("order", 999)} for c in all_currencies]}
        return {"currencies": []}
    ids = [int(x.strip()) for x in currency_ids.split(",") if x.strip()]
    if not ids:
        return {"currencies": []}
    currencies = await get_currencies(ids)
    return {"currencies": [{"id": c["id"], "name": c["name"], "icon": c["icon"], "description": c.get("description", ""), "order": c.get("order", 999)} for c in currencies]}


@router.post("/auth")
async def auth(authorization: Optional[str] = Header(None)):
    api_key = _get_api_key(authorization)
    result = await verify_api_key(api_key)
    return {"status": "ok", **result}


@router.get("/characters")
async def characters_endpoint(authorization: Optional[str] = Header(None)):
    api_key = _get_api_key(authorization)
    names = await get_characters(api_key)

    result = []
    for name in names:
        core = await get_character_core(api_key, name)
        result.append(
            CharacterSummary(
                name=core["name"],
                race=core.get("race", ""),
                gender=core.get("gender", ""),
                profession=core.get("profession", ""),
                level=core.get("level", 0),
                age=core.get("age", 0),
                created=core.get("created", ""),
                coins=core.get("coins", 0),
            )
        )

    return {"characters": result}


@router.get("/characters/{name}/build")
async def character_build(
    name: str,
    authorization: Optional[str] = Header(None),
):
    api_key = _get_api_key(authorization)
    build_data = await get_character_build_tab(api_key, name)
    core = await get_character_core(api_key, name)
    equipment_data = await get_character_equipment(api_key, name)

    spec_ids = [s["id"] for s in _get_build_specs(build_data)]
    specs_info = {}
    if spec_ids:
        specs_raw = await get_specialization_details(spec_ids)
        for s in specs_raw:
            specs_info[s["id"]] = s

    raw_skills = _get_build_skills(build_data)
    flat_skill_ids = []
    skill_entries = []
    for slot_name, skill_id_or_list in raw_skills.items():
        if isinstance(skill_id_or_list, list):
            for sid in skill_id_or_list:
                flat_skill_ids.append(sid)
                skill_entries.append((slot_name, sid))
        else:
            flat_skill_ids.append(skill_id_or_list)
            skill_entries.append((slot_name, skill_id_or_list))

    skills_info = {}
    if flat_skill_ids:
        skills_raw = await get_skill_details(flat_skill_ids)
        for s in skills_raw:
            skills_info[s["id"]] = s

    specializations = []
    for spec in _get_build_specs(build_data):
        spec_id = spec["id"]
        info = specs_info.get(spec_id, {})
        specializations.append(
            {
                "id": spec_id,
                "name": info.get("name", f"Specialization {spec_id}"),
                "icon": info.get("icon", ""),
                "background": info.get("background", ""),
                "traits": info.get("traits", []),
                "selected_traits": spec.get("traits", []),
            }
        )

    equipment_item_ids = [
        eq["id"] for eq in equipment_data.get("equipment", []) if eq
    ]
    equipment_details = {}
    if equipment_item_ids:
        items_raw = await get_item_details(equipment_item_ids)
        for item in items_raw:
            equipment_details[item["id"]] = _sanitize_item(item)

    equipment = []
    for eq in equipment_data.get("equipment", []):
        item_info = equipment_details.get(eq["id"], {})
        raw_stats = eq.get("stats") or {}
        attrs_raw = raw_stats.get("attributes") if isinstance(raw_stats, dict) else None
        flat_stats = {}
        if attrs_raw and isinstance(attrs_raw, dict):
            for attr_name, value in attrs_raw.items():
                if isinstance(value, (int, float)):
                    flat_stats[attr_name] = value
        elif attrs_raw and isinstance(attrs_raw, list):
            for a in attrs_raw:
                if isinstance(a, dict) and "attribute" in a and "modifier" in a:
                    flat_stats[a["attribute"]] = a["modifier"]
        elif isinstance(raw_stats, dict):
            for k, v in raw_stats.items():
                if k != "id" and isinstance(v, (int, float)):
                    flat_stats[k] = v
        equipment.append(
            {
                "id": eq["id"],
                "name": item_info.get("name", f"Item {eq['id']}"),
                "icon": item_info.get("icon", ""),
                "slot": eq.get("slot", ""),
                "rarity": item_info.get("rarity", "Basic"),
                "level": item_info.get("level", 0),
                "stats": flat_stats if flat_stats else None,
                "infusions": eq.get("infusions", []),
                "upgrades": eq.get("upgrades", []),
            }
        )

    return {
        "name": core["name"],
        "profession": core.get("profession", ""),
        "specializations": specializations,
        "equipment": equipment,
    }


@router.get("/characters/{name}/full")
async def character_full(
    name: str,
    authorization: Optional[str] = Header(None),
):
    api_key = _get_api_key(authorization)

    # Batch 1: Independent API calls (parallel)
    core_task = get_character_core(api_key, name)
    build_task = get_character_build_tab(api_key, name)
    equip_task = get_character_equipment(api_key, name)
    wallet_task = get_account_wallet(api_key)
    crafting_task = get_character_crafting(api_key, name)

    core, build_data, equipment_data, wallet_data, crafting_data = await asyncio.gather(
        core_task, build_task, equip_task, wallet_task, crafting_task,
    )

    # Batch 2: Dependent API calls (parallel)
    currency_ids = [w["id"] for w in wallet_data]
    currency_task = get_currencies(currency_ids) if currency_ids else None

    spec_ids = [s["id"] for s in _get_build_specs(build_data)]
    spec_task = get_specialization_details(spec_ids) if spec_ids else None

    raw_skills = _get_build_skills(build_data)
    flat_skill_ids = []
    skill_entries = []
    for slot_name, skill_id_or_list in raw_skills.items():
        if isinstance(skill_id_or_list, list):
            for sid in skill_id_or_list:
                flat_skill_ids.append(sid)
                skill_entries.append((slot_name, sid))
        else:
            flat_skill_ids.append(skill_id_or_list)
            skill_entries.append((slot_name, skill_id_or_list))
    skill_task = get_skill_details(flat_skill_ids) if flat_skill_ids else None

    equipment_item_ids = [
        eq["id"] for eq in equipment_data.get("equipment", []) if eq
    ]
    item_task = get_item_details(equipment_item_ids) if equipment_item_ids else None

    gather_tasks = [t for t in [currency_task, spec_task, skill_task, item_task] if t is not None]
    gather_results = await asyncio.gather(*gather_tasks) if gather_tasks else []

    # Unpack results
    result_idx = 0
    currency_map = {}
    if currency_task is not None:
        currencies = gather_results[result_idx]
        for c in currencies:
            currency_map[c["id"]] = c
        result_idx += 1

    specs_info = {}
    if spec_task is not None:
        specs_raw = gather_results[result_idx]
        for s in specs_raw:
            specs_info[s["id"]] = s
        result_idx += 1

    skills_info = {}
    if skill_task is not None:
        skills_raw = gather_results[result_idx]
        for s in skills_raw:
            skills_info[s["id"]] = s
        result_idx += 1

    equipment_details = {}
    if item_task is not None:
        items_raw = gather_results[result_idx]
        for item in items_raw:
            equipment_details[item["id"]] = _sanitize_item(item)
        result_idx += 1

    # Enrich wallet
    wallet_enriched = []
    for w in wallet_data:
        cid = w["id"]
        info = currency_map.get(cid, {})
        wallet_enriched.append({
            "id": cid,
            "name": info.get("name", f"Currency {cid}"),
            "icon": info.get("icon", ""),
            "value": w.get("value", 0),
            "description": info.get("description", ""),
            "order": info.get("order", 999),
        })
    wallet_enriched.sort(key=lambda x: x["order"])

    # Build specializations
    specializations = []
    for spec in _get_build_specs(build_data):
        spec_id = spec["id"]
        info = specs_info.get(spec_id, {})
        trait_details = []
        for t in info.get("traits", []):
            trait_details.append({
                "id": t.get("id"),
                "name": t.get("name"),
                "icon": t.get("icon"),
                "description": _strip_gw2_tags(t.get("description", "")),
                "tier": t.get("tier"),
                "order": t.get("order"),
                "slot": t.get("slot"),
            })
        specializations.append({
            "id": spec_id,
            "name": info.get("name", f"Specialization {spec_id}"),
            "icon": info.get("icon", ""),
            "background": info.get("background", ""),
            "traits": trait_details,
            "selected_traits": spec.get("traits", []),
        })

    # Build skills
    skills = {}
    for slot_name, skill_id in skill_entries:
        info = skills_info.get(skill_id, {})
        key = f"{slot_name}_{skill_id}"
        skills[key] = {
            "id": skill_id,
            "name": info.get("name", f"Skill {skill_id}"),
            "icon": info.get("icon", ""),
            "description": _strip_gw2_tags(info.get("description", "")),
            "type": info.get("type", ""),
            "weapon_type": info.get("weapon_type", ""),
            "slot": slot_name,
        }

    # Base stats for level 80 characters (same for all professions)
    BASE_CHAR_STATS = {
        "Power": 1000,
        "Precision": 1000,
        "Toughness": 1000,
        "Vitality": 1000,
        "Ferocity": 0,
        "ConditionDamage": 0,
        "Expertise": 0,
        "Concentration": 0,
        "HealingPower": 0,
        "AgonyResistance": 0,
    }

    PROFESSION_BASE_HEALTH = {
        "Guardian": 2125, "Warrior": 1920, "Revenant": 2250,
        "Engineer": 1646, "Ranger": 1735, "Thief": 1145,
        "Elementalist": 1165, "Mesmer": 1285, "Necromancer": 1944,
    }

    # Combined stats with per-item source tracking
    combined_stats = {}
    attribute_sources: dict[str, list[dict]] = {}
    for eq in equipment_data.get("equipment", []):
        item_info = equipment_details.get(eq["id"], {})
        raw_stats = eq.get("stats") or {}
        attrs_raw = raw_stats.get("attributes") if isinstance(raw_stats, dict) else None
        if attrs_raw and isinstance(attrs_raw, dict):
            for attr_name, value in attrs_raw.items():
                if isinstance(value, (int, float)):
                    combined_stats[attr_name] = combined_stats.get(attr_name, 0) + value
                    if attr_name not in attribute_sources:
                        attribute_sources[attr_name] = []
                    attribute_sources[attr_name].append({
                        "id": eq["id"],
                        "name": item_info.get("name", f"Item {eq['id']}"),
                        "icon": item_info.get("icon", ""),
                        "slot": eq.get("slot", ""),
                        "value": value,
                    })
        elif attrs_raw and isinstance(attrs_raw, list):
            for a in attrs_raw:
                if isinstance(a, dict) and "attribute" in a and "modifier" in a:
                    attr_name = a["attribute"]
                    combined_stats[attr_name] = combined_stats.get(attr_name, 0) + a["modifier"]
                    if attr_name not in attribute_sources:
                        attribute_sources[attr_name] = []
                    attribute_sources[attr_name].append({
                        "id": eq["id"],
                        "name": item_info.get("name", f"Item {eq['id']}"),
                        "icon": item_info.get("icon", ""),
                        "slot": eq.get("slot", ""),
                        "value": a["modifier"],
                    })
        elif isinstance(raw_stats, dict):
            found_any = False
            for k, v in raw_stats.items():
                if k != "id" and isinstance(v, (int, float)):
                    found_any = True
                    combined_stats[k] = combined_stats.get(k, 0) + v
                    if k not in attribute_sources:
                        attribute_sources[k] = []
                    attribute_sources[k].append({
                        "id": eq["id"],
                        "name": item_info.get("name", f"Item {eq['id']}"),
                        "icon": item_info.get("icon", ""),
                        "slot": eq.get("slot", ""),
                        "value": v,
                    })
            if not found_any:
                item_attrs = item_info.get("attributes", {})
                if isinstance(item_attrs, dict):
                    for attr_name, value in item_attrs.items():
                        if isinstance(value, (int, float)):
                            combined_stats[attr_name] = combined_stats.get(attr_name, 0) + value
                            if attr_name not in attribute_sources:
                                attribute_sources[attr_name] = []
                            attribute_sources[attr_name].append({
                                "id": eq["id"],
                                "name": item_info.get("name", f"Item {eq['id']}"),
                                "icon": item_info.get("icon", ""),
                                "slot": eq.get("slot", ""),
                                "value": value,
                            })

    # Build per-attribute breakdown
    profession = core.get("profession", "Guardian")
    base_health = PROFESSION_BASE_HEALTH.get(profession, 2125)
    base_vitality = BASE_CHAR_STATS.get("Vitality", 1000)
    base_toughness = BASE_CHAR_STATS.get("Toughness", 1000)

    attribute_breakdown: dict[str, dict] = {}
    all_attr_names = set(BASE_CHAR_STATS.keys()) | set(combined_stats.keys())
    for attr_name in all_attr_names:
        base = BASE_CHAR_STATS.get(attr_name, 0)
        if attr_name == "Health":
            bonus = combined_stats.get("Health", 0)
            base = base_health + base_vitality * 10
            total = base + bonus
        elif attr_name == "Armor":
            bonus = combined_stats.get("Armor", 0)
            base = base_toughness  # base defense from weight class is only on gear
            total = base + bonus
        else:
            bonus = combined_stats.get(attr_name, 0)
            total = base + bonus

        sources = sorted(attribute_sources.get(attr_name, []), key=lambda s: s.get("slot", ""))
        attribute_breakdown[attr_name] = {
            "base": base,
            "bonus": bonus,
            "total": total,
            "sources": sources,
        }

    equipment = []
    for eq in equipment_data.get("equipment", []):
        item_info = equipment_details.get(eq["id"], {})
        equipment.append({
            "id": eq["id"],
            "name": item_info.get("name", f"Item {eq['id']}"),
            "icon": item_info.get("icon", ""),
            "slot": eq.get("slot", ""),
            "rarity": item_info.get("rarity", "Basic"),
            "level": item_info.get("level", 0),
            "stats": eq.get("stats"),
            "infusions": eq.get("infusions", []),
            "upgrades": eq.get("upgrades", []),
            "details": {
                k: item_info.get(k) for k in [
                    "item_type", "weight_class", "defense", "description",
                    "armor_type", "weapon_type", "trinket_type",
                    "suffix", "flags",
                ]
            } if any(item_info.get(k) for k in ["item_type", "weight_class", "defense"]) else None,
        })

    crafting = crafting_data.get("crafting", []) if isinstance(crafting_data, dict) else crafting_data

    return {
        "name": core.get("name", name),
        "race": core.get("race", ""),
        "gender": core.get("gender", ""),
        "profession": core.get("profession", ""),
        "level": core.get("level", 0),
        "age": core.get("age", 0),
        "created": core.get("created", ""),
        "deaths": core.get("deaths", 0),
        "title": core.get("title"),
        "wallet": wallet_enriched,
        "combined_stats": combined_stats,
        "attribute_breakdown": attribute_breakdown,
        "specializations": specializations,
        "skills": skills,
        "equipment": equipment,
        "crafting": crafting,
    }


@router.get("/characters/{name}/inventory")
async def character_inventory(
    name: str,
    authorization: Optional[str] = Header(None),
):
    api_key = _get_api_key(authorization)
    inv_data = await get_character_inventory(api_key, name)

    # GW2 API returns a list of bags directly (not a dict with "bags" key)
    bags_raw = inv_data if isinstance(inv_data, list) else inv_data.get("bags", [])

    item_ids = []
    for bag in bags_raw:
        for slot in (bag.get("inventory", []) if isinstance(bag, dict) else []):
            if slot and slot.get("id"):
                item_ids.append(slot["id"])

    items_info = {}
    if item_ids:
        items_raw = await get_item_details(list(set(item_ids)))
        for item in items_raw:
            items_info[item["id"]] = _sanitize_item(item)

    bags = []
    for bag in bags_raw:
        bag_items = []
        for slot in (bag.get("inventory", []) if isinstance(bag, dict) else []):
            if not slot:
                bag_items.append(None)
                continue
            item_info = items_info.get(slot["id"], {})
            bag_items.append(
                {
                    "id": slot["id"],
                    "name": item_info.get("name", f"Item {slot['id']}"),
                    "icon": item_info.get("icon", ""),
                    "rarity": item_info.get("rarity", "Basic"),
                    "level": item_info.get("level", 0),
                    "count": slot.get("count", 1),
                    "binding": slot.get("binding"),
                }
            )
        bags.append(bag_items)

    return {"name": name, "bags": bags}


@router.get("/account/bank")
async def account_bank(authorization: Optional[str] = Header(None)):
    api_key = _get_api_key(authorization)
    bank_data = await get_bank(api_key)

    item_ids = [slot["id"] for slot in bank_data if slot]
    items_info = {}
    if item_ids:
        items_raw = await get_item_details(list(set(item_ids)))
        for item in items_raw:
            items_info[item["id"]] = _sanitize_item(item)

    bank_slots = []
    for slot in bank_data:
        if not slot:
            bank_slots.append(None)
            continue
        item_info = items_info.get(slot["id"], {})
        bank_slots.append(
            {
                "id": slot["id"],
                "name": item_info.get("name", f"Item {slot['id']}"),
                "icon": item_info.get("icon", ""),
                "rarity": item_info.get("rarity", "Basic"),
                "level": item_info.get("level", 0),
                "count": slot.get("count", 1),
                "binding": slot.get("binding"),
            }
        )

    return {"bank": bank_slots}


_material_categories_cache: list[dict] | None = None


async def _get_material_categories() -> dict[int, str]:
    """Get material categories mapping (ID -> name), cached."""
    global _material_categories_cache
    if _material_categories_cache is None:
        try:
            _material_categories_cache = await get_material_categories()
        except Exception as e:
            logger.warning(f"Failed to fetch material categories: {e}")
            _material_categories_cache = []
    return {c["id"]: c.get("name", "Other") for c in _material_categories_cache}


@router.get("/account/materials")
async def account_materials(authorization: Optional[str] = Header(None)):
    api_key = _get_api_key(authorization)
    materials_data = await get_materials(api_key)

    if not materials_data:
        return {"materials": []}

    item_ids = list(set(m["id"] for m in materials_data))

    items_info = {}
    if item_ids:
        items_raw = await get_item_details(item_ids)
        for item in items_raw:
            items_info[item["id"]] = item

    prices_map = {}
    if item_ids:
        prices = await get_commerce_prices(item_ids)
        for p in prices:
            prices_map[p["id"]] = p

    categories_map = await _get_material_categories()

    enriched = []
    for mat in materials_data:
        item_id = mat["id"]
        item_info = items_info.get(item_id, {})
        price_info = prices_map.get(item_id, {})

        enriched.append({
            "id": item_id,
            "name": item_info.get("name", f"Item {item_id}"),
            "icon": item_info.get("icon", ""),
            "rarity": item_info.get("rarity", "Basic"),
            "level": item_info.get("level", 0),
            "type": item_info.get("type", ""),
            "count": mat.get("count", 0),
            "category_id": mat.get("category", 0),
            "category_name": categories_map.get(mat.get("category", 0), "Other"),
            "vendor_value": item_info.get("vendor_value", 0),
            "flags": item_info.get("flags", []),
            "tp_buy": price_info.get("buys", {}).get("unit_price", 0) if price_info else 0,
            "tp_sell": price_info.get("sells", {}).get("unit_price", 0) if price_info else 0,
        })

    enriched.sort(key=lambda x: (x["category_name"], x["name"]))
    return {"materials": enriched}


@router.get("/account/legendary-armory")
async def account_legendary_armory(authorization: Optional[str] = Header(None)):
    api_key = _get_api_key(authorization)
    armory_data = await get_legendary_armory(api_key)

    if not armory_data:
        return {"items": []}

    item_ids = list(set(m["id"] for m in armory_data))

    items_info = {}
    if item_ids:
        items_raw = await get_item_details(item_ids)
        for item in items_raw:
            items_info[item["id"]] = item

    enriched = []
    for entry in armory_data:
        item_id = entry["id"]
        item_info = items_info.get(item_id, {})

        enriched.append({
            "id": item_id,
            "name": item_info.get("name", f"Item {item_id}"),
            "icon": item_info.get("icon", ""),
            "rarity": item_info.get("rarity", "Legendary"),
            "level": item_info.get("level", 0),
            "type": item_info.get("type", ""),
            "subtype": item_info.get("details", {}).get("type", ""),
            "count": entry.get("count", 0),
            "flags": item_info.get("flags", []),
        })

    enriched.sort(key=lambda x: (x["type"], x["subtype"], x["name"]))
    return {"items": enriched}


DUNGEON_NAMES: dict[str, str] = {
    "ascalonian_catacombs": "Катакомбы Аскалона",
    "caudecus_manor": "Поместье Кодекус",
    "twilight_arbor": "Сумеречная беседка",
    "sorrows_embrace": "Объятия скорби",
    "citadel_of_flame": "Цитадель пламени",
    "honor_of_the_waves": "Честь волн",
    "crucible_of_eternity": "Горнило вечности",
    "ruined_city_of_arah": "Разрушенный город Арах",
}

DUNGEON_PATH_NAMES: dict[str, str] = {
    "ac_story": "Сюжет", "hodgins": "Ходжинс", "detha": "Дета", "tzark": "Царк",
    "cm_story": "Сюжет", "asura": "Асура", "seraph": "Серафим", "butler": "Дворецкий",
    "ta_story": "Сюжет", "leurent": "Лерент", "vevina": "Вевина", "aetherpath": "Эфирный путь",
    "se_story": "Сюжет", "fergg": "Фергг", "rasalov": "Расалов", "koptev": "Коптев",
    "cof_story": "Сюжет", "ferrah": "Ферра", "magg": "Мэгг", "rhiannon": "Рианнон",
    "hotw_story": "Сюжет", "butcher": "Мясник", "plunderer": "Грабитель", "zealot": "Фанатик",
    "coe_story": "Сюжет", "submarine": "Субмарина", "teleporter": "Телепорт", "front_door": "Парадный вход",
    "arah_story": "Сюжет", "jotun": "Йотун", "mursaat": "Мурсаат", "forgotten": "Забытые", "seer": "Провидец",
}

DUNGEON_ICONS: dict[str, str] = {
    "ascalonian_catacombs": "https://wiki.guildwars2.com/images/5/5a/Ascalonian_Catacombs_%28dungeon%29.png",
    "caudecus_manor": "https://wiki.guildwars2.com/images/c/cf/Caudecus_Manor_%28dungeon%29.png",
    "twilight_arbor": "https://wiki.guildwars2.com/images/2/2f/Twilight_Arbor_%28dungeon%29.png",
    "sorrows_embrace": "https://wiki.guildwars2.com/images/4/46/Sorrow%27s_Embrace_%28dungeon%29.png",
    "citadel_of_flame": "https://wiki.guildwars2.com/images/e/e4/Citadel_of_Flame_%28dungeon%29.png",
    "honor_of_the_waves": "https://wiki.guildwars2.com/images/9/9c/Honor_of_the_Waves_%28dungeon%29.png",
    "crucible_of_eternity": "https://wiki.guildwars2.com/images/4/46/Crucible_of_Eternity_%28dungeon%29.png",
    "ruined_city_of_arah": "https://wiki.guildwars2.com/images/1/17/Ruined_City_of_Arah_%28dungeon%29.png",
}

DAILYCRAFTING_NAMES: dict[str, str] = {
    "charged_quartz_crystal": "Заряженный кварцевый кристалл",
    "glob_of_elder_spirit_residue": "Сгусток остатков духов старейшин",
    "lump_of_mithrilium": "Кусок мифрилиума",
    "spool_of_silk_weaving_thread": "Катушка шёлковой нити",
    "spool_of_thick_elonian_cord": "Катушка толстого элонского шнура",
}

DAILYCRAFTING_ICONS: dict[str, str] = {
    "charged_quartz_crystal": "https://render.guildwars2.com/file/1A0A0F5E0A0F5E0A0F5E0A0F5E0A0F5E0A0F5E0/000000.png",
    "glob_of_elder_spirit_residue": "https://render.guildwars2.com/file/1B0B0F5E0A0F5E0A0F5E0A0F5E0A0F5E0A0F5E0/000000.png",
    "lump_of_mithrilium": "https://render.guildwars2.com/file/1C0C0F5E0A0F5E0A0F5E0A0F5E0A0F5E0A0F5E0/000000.png",
    "spool_of_silk_weaving_thread": "https://render.guildwars2.com/file/1D0D0F5E0A0F5E0A0F5E0A0F5E0A0F5E0A0F5E0/000000.png",
    "spool_of_thick_elonian_cord": "https://render.guildwars2.com/file/1E0E0F5E0A0F5E0A0F5E0A0F5E0A0F5E0A0F5E0/000000.png",
}

MASTERY_NAMES: dict[str, str] = {
    "1": "Знания экзальтов",
    "2": "Знания ицелей",
    "3": "Знания нухоков",
    "4": "Командующий Союза",
    "5": "Настройка на фракталы",
    "6": "Создание легендарных предметов",
    "8": "Планирование",
    "12": "Рейды",
    "13": "Древняя магия",
    "14": "Ездовой раптор",
    "16": "Ездовой грифон",
    "17": "Ездовой прыгун",
    "18": "Ездовой шакал",
    "19": "Чемпион кристалла",
    "20": "Ездовой жук-каток",
    "21": "Ездовой небочешуй",
    "22": "Управление эссенцией стойкости",
    "23": "Настройка ворона",
    "24": "Управление эссенцией бдительности",
    "25": "Управление эссенцией доблести",
    "26": "Синхронизация станции Объединенных легионов",
    "27": "Убийца драконов",
    "29": "Управление лодкой",
    "30": "Ездовой черепах",
    "31": "Рыбалка",
    "32": "Восстановление Древокамня",
    "33": "Нефритовые боты",
    "36": "Тренировка полёта",
    "37": "Астральный дозор",
    "38": "Исследования сердца тайны",
    "39": "Внутренний Найос",
    "40": "Обустройство усадьбы",
    "42": "Коданы низовий",
    "43": "Ездовой боекоть",
    "44": "Теневые ремёсла мурсаатов",
    "45": "Выживальщик Кастора",
    "46": "Дикая магия Кастора",
    "47": "Адаптация скакуна",
}


@router.get("/account/dungeons")
async def account_dungeons(authorization: Optional[str] = Header(None)):
    api_key = _get_api_key(authorization)
    all_dungeons = await get_dungeons()
    completed = await get_account_dungeons(api_key)
    completed_set = set(completed)

    enriched = []
    for dungeon in all_dungeons:
        did = dungeon["id"]
        paths = []
        for path in dungeon["paths"]:
            pid = path["id"]
            paths.append({
                "id": pid,
                "name": DUNGEON_PATH_NAMES.get(pid, pid),
                "type": path["type"],
                "completed": pid in completed_set,
            })

        enriched.append({
            "id": did,
            "name": DUNGEON_NAMES.get(did, did),
            "icon": DUNGEON_ICONS.get(did, ""),
            "paths": paths,
            "completed_count": sum(1 for p in paths if p["completed"]),
            "total_count": len(paths),
        })

    return {"dungeons": enriched}


@router.get("/account/dailycrafting")
async def account_dailycrafting(authorization: Optional[str] = Header(None)):
    api_key = _get_api_key(authorization)
    all_crafting = await get_dailycrafting()
    completed = await get_account_dailycrafting(api_key)
    completed_set = set(completed)

    enriched = []
    for item_id in all_crafting:
        enriched.append({
            "id": item_id,
            "name": DAILYCRAFTING_NAMES.get(item_id, item_id),
            "completed": item_id in completed_set,
        })

    return {"items": enriched}


WORLD_BOSS_NAMES: dict[str, str] = {
    "amalgamate": "Амальгама",
    "ancient_dragon_root": "Древний драконий корень",
    "anomaly": "Аномалия",
    "archdiviner": "Архипрорицатель",
    "shatterer": "Крушитель",
    "shadow_behemoth": "Теневой бегемот",
    "taidha_covington": "Тайда Ковингтон",
    "tequatl_the_sunless": "Текватл Бессолнечный",
    "the_bishop": "Епископ",
    "the_blazing_king": "Пылающий король",
    "the_breaker": "Разрушитель",
    "the_demigod_kodan": "Полубог-кодам",
    "the_dragon_of_north_rend": "Дракон Северной расщелины",
    "the_dragonspawn": "Драконород",
    "the_eye_of_balthazar": "Око Бальтазара",
    "the_frozen_depths_finfish": "Глубинный плавник",
    "the_giant_wurm": "Гигантский червь",
    "the_great_boar": "Великий вепрь",
    "the_great_jungle_wurm": "Великий джунглевый червь",
    "the_hex": "Гекс",
    "the_ice_maw": "Ледяная пасть",
    "the_mauler": "Молотильщик",
    "the_megadestroyer": "Мегаразрушитель",
    "the_mossman": "Мшистик",
    "the_shatterer": "Крушитель",
    "the_shattered_rift_raider": "Разломный рейдер",
    "the_sloth": "Ленивец",
    "the_spider_queen": "Королева пауков",
    "the_taker_of_souls": "Забирающий души",
    "the_unstable_cosmic_abomination": "Нестабильное космическое мерзость",
    "triple_trouble_wurms": "Тройные черви",
    "svanir_chieftain": "Сванирский вождь",
    "ulgo_the_consuming": "Ульго Пожирающий",
    "valley_spider_queen": "Долинная королева пауков",
    "wicked_warbeast": "Злобный зверь",
    "xunlai_mercenary": "Наёмник Сюньлай",
    "golem_mk2": "Голем МК2",
    "mark_ii_golem": "Голем Марк II",
    "molten_armageddon": "Расплавленный армагеддон",
    "molten_boss": "Расплавленный босс",
    "bloody_prince": "Кровавый принц",
    "commander_bria": "Командир Брия",
    "craft_apprentice": "Ученик ремесленника",
    "corpse_eater": "Плотоед",
    "executor_hadz": "Экзекутор Хадз",
    "fashion_scarlet": "Модница Скарлетт",
    "gunpowder_rouge": "Пороховой разбойник",
    "hologram_rouge": "Голограммный разбойник",
    "mad_king_thorn": "Безумный король Торн",
    "might_maker": "Создатель силы",
    "polar_bear_boss": "Полярный медведь",
    "queen_beetle": "Королева жуков",
    "the_skelk_boss": "Скельк-босс",
    "tribulation_daughter": "Дочь испытаний",
    "tribulation_son": "Сын испытаний",
    "veteran_creature": "Ветеран-создание",
    "veteran_wyvern": "Ветеран-виверна",
    "corrupted_leader": "Осквернённый лидер",
    "dark_wurm": "Тёмный червь",
    "destroyer_golem": "Голем-разрушитель",
    "digital_shield_operator": "Оператор цифрового щита",
    "fire_elemental": "Огненный элементаль",
    "forged_fire_effigy": "Кованый огненный идол",
    "gate_crasher": "Крушитель врат",
    "giant_shaman": "Гигантский шаман",
    "harpy_queen": "Королева гарпий",
    "hero_tribune_burnisher": "Трибун-герой Бёрнишер",
    "inquest_crasher": "Крушитель Инквест",
    "karka_queen": "Королева карка",
    "lord_of_the_fractals": "Владыка фракталов",
    "power_supply_operative": "Оператор энергоснабжения",
    "modnir_ul_maker": "Создатель Моднир Уль",
    "priest_of_balthazar": "Жрец Бальтазара",
    "priest_of_dwayna": "Жрец Дуэйны",
    "priest_of_grenth": "Жрец Грента",
    "priest_of_kormir": "Жрец Кормир",
    "priest_of_lyssa": "Жрец Лиссы",
    "priest_of_melandru": "Жрец Меландру",
    "toxic_ninja": "Токсичный ниндзя",
    "toxic_necromancer": "Токсичный некромант",
    "treasure_carrier": "Носитель сокровищ",
    "veteran_abomination": "Ветеран-мерзость",
    "veteran_elder_dragon": "Ветеран-старший дракон",
}

WORLD_BOSS_ICONS: dict[str, str] = {
    "shadow_behemoth": "https://wiki.guildwars2.com/images/6/6f/Shadow_Behemoth.png",
    "tequatl_the_sunless": "https://wiki.guildwars2.com/images/7/78/Tequatl_the_Sunless_%28boss%29.png",
    "great_jungle_wurm": "https://wiki.guildwars2.com/images/c/ca/Great_Jungle_Wurm.png",
    "the_shatterer": "https://wiki.guildwars2.com/images/8/8a/The_Shatterer.png",
    "claw_of_jormag": "https://wiki.guildwars2.com/images/0/08/Claw_of_Jormag_%28NPC%29.png",
    "ancient_dragon_root": "https://wiki.guildwars2.com/images/b/b7/Ancient_Dragon_Root.png",
    "fire_elemental": "https://wiki.guildwars2.com/images/0/09/Fire_Elemental.png",
    "karka_queen": "https://wiki.guildwars2.com/images/a/a9/Karka_Queen.png",
    "ulgo_the_consuming": "https://wiki.guildwars2.com/images/6/6e/Ulgo_the_Consuming.png",
    "modnir_ul_maker": "https://wiki.guildwars2.com/images/9/9b/Modniir_Ulgar.png",
    "triple_trouble_wurms": "https://wiki.guildwars2.com/images/5/57/Triple_Trouble_Wyverns.png",
    "taidha_covington": "https://wiki.guildwars2.com/images/1/18/Taidha_Covington.png",
    "the_megadestroyer": "https://wiki.guildwars2.com/images/5/5e/Megadestroyer.png",
    "wicked_warbeast": "https://wiki.guildwars2.com/images/8/82/Wicked_Warbeast.png",
}

WORLD_BOSS_MAPS: dict[str, str] = {
    "shadow_behemoth": "Болото Квайтана",
    "tequatl_the_sunless": "Устье Спаркфлай",
    "great_jungle_wurm": "Колыбель Кесси",
    "the_shatterer": "Пустошь Блазер",
    "claw_of_jormag": "Фростгордж",
    "ancient_dragon_root": "Железные утёсы",
    "fire_elemental": "Метрическая провинция",
    "karka_queen": "Южный берег",
    "ulgo_the_consuming": "Пустошь Блазер",
    "modnir_ul_maker": "Хартианские холмы",
    "triple_trouble_wurms": "Кровавый берег",
    "taidha_covington": "Кровавый берег",
    "the_megadestroyer": "Гора Мелхис",
    "wicked_warbeast": "Поля Руин",
    "golem_mk2": "Изрезанные острова",
    "mark_ii_golem": "Изрезанные острова",
}


@router.get("/account/world-bosses")
async def account_world_bosses(authorization: Optional[str] = Header(None)):
    api_key = _get_api_key(authorization)
    all_bosses = await get_worldbosses()
    defeated = await get_account_worldbosses(api_key)
    defeated_set = set(defeated)

    enriched = []
    for boss in all_bosses:
        bid = boss["id"]
        enriched.append({
            "id": bid,
            "name": WORLD_BOSS_NAMES.get(bid, bid),
            "icon": WORLD_BOSS_ICONS.get(bid, ""),
            "map": WORLD_BOSS_MAPS.get(bid, ""),
            "defeated": bid in defeated_set,
        })

    enriched.sort(key=lambda x: (x["defeated"], x["name"]))
    return {"bosses": enriched}


@router.get("/account/value")
async def account_value(authorization: Optional[str] = Header(None)):
    api_key = _get_api_key(authorization)

    # 1. Wallet (gold)
    wallet = await get_account_wallet(api_key)
    gold_value = 0
    wallet_breakdown = []
    for w in wallet:
        cid = w["id"]
        if cid == 1:  # Coins (gold)
            gold_value = w.get("value", 0)
        val = w.get("value", 0)
        if val > 0:
            wallet_breakdown.append({"id": cid, "value": val})

    # 2. Materials value
    materials = await get_materials(api_key)
    material_items = [m for m in materials if m.get("count", 0) > 0]
    material_item_ids = list(set(m["id"] for m in material_items))

    material_prices = {}
    if material_item_ids:
        prices_raw = await get_item_prices(material_item_ids)
        for p in prices_raw:
            pid = p["id"]
            buy = p.get("buys", {}).get("unit_price", 0)
            sell = p.get("sells", {}).get("unit_price", 0)
            material_prices[pid] = max(buy, sell) if buy or sell else 0

    total_material_value = 0
    material_breakdown = []
    for m in material_items:
        mid = m["id"]
        count = m.get("count", 0)
        price = material_prices.get(mid, 0)
        total = count * price
        total_material_value += total
        material_breakdown.append({"id": mid, "count": count, "unit_price": price, "total": total})

    all_material_ids = [x["id"] for x in material_breakdown]
    item_names = get_item_names(all_material_ids) if all_material_ids else {}
    for item in material_breakdown:
        info = item_names.get(item["id"], {})
        item["name"] = info.get("name", "")
        item["icon"] = info.get("icon", "")

    material_breakdown.sort(key=lambda x: (-x["total"], x["id"]))

    # 3. Bank value
    bank_items = await get_bank(api_key)
    bank_with_items = [b for b in bank_items if b is not None and b.get("count", 0) > 0 and b.get("id")]
    bank_item_ids = list(set(b["id"] for b in bank_with_items))

    bank_prices = {}
    if bank_item_ids:
        prices_raw = await get_item_prices(bank_item_ids)
        for p in prices_raw:
            pid = p["id"]
            buy = p.get("buys", {}).get("unit_price", 0)
            sell = p.get("sells", {}).get("unit_price", 0)
            bank_prices[pid] = max(buy, sell) if buy or sell else 0

    total_bank_value = 0
    bank_breakdown = []
    for b in bank_with_items:
        bid = b["id"]
        count = b.get("count", 0)
        price = bank_prices.get(bid, 0)
        total = count * price
        total_bank_value += total
        bank_breakdown.append({"id": bid, "count": count, "unit_price": price, "total": total})

    all_bank_ids = [x["id"] for x in bank_breakdown]
    bank_names = get_item_names(all_bank_ids) if all_bank_ids else {}
    for item in bank_breakdown:
        info = bank_names.get(item["id"], {})
        item["name"] = info.get("name", "")
        item["icon"] = info.get("icon", "")

    bank_breakdown.sort(key=lambda x: (-x["total"], x["id"]))

    total_value = gold_value + total_material_value + total_bank_value

    return {
        "total_value_coins": total_value,
        "total_value_gold": total_value / 10000,
        "wallet": {"coins": gold_value, "gold": gold_value / 10000},
        "materials": {
            "total_coins": total_material_value,
            "total_gold": total_material_value / 10000,
            "items": material_breakdown[:500],
        },
        "bank": {
            "total_coins": total_bank_value,
            "total_gold": total_bank_value / 10000,
            "items": bank_breakdown[:500],
        },
    }


@router.get("/items/prices")
async def item_prices(
    item_ids: str,
    authorization: Optional[str] = Header(None),
):
    _get_api_key(authorization)
    ids = [int(x.strip()) for x in item_ids.split(",") if x.strip()]
    if not ids:
        return {"prices": []}

    prices = await get_item_prices(ids)
    return {"prices": prices}


@router.get("/items/details")
async def item_details(
    item_ids: str,
    authorization: Optional[str] = Header(None),
):
    _get_api_key(authorization)
    ids = [int(x.strip()) for x in item_ids.split(",") if x.strip()]
    if not ids:
        return {"items": []}

    items = await get_item_details(ids)
    return {"items": [_sanitize_item(it) for it in items]}


@router.get("/commerce/prices")
async def commerce_prices(
    item_ids: str,
    authorization: Optional[str] = Header(None),
):
    _get_api_key(authorization)
    ids = [int(x.strip()) for x in item_ids.split(",") if x.strip()]
    if not ids:
        return {"prices": []}
    prices = await get_commerce_prices(ids)
    return {"prices": prices}


@router.get("/commerce/listings")
async def commerce_listings(
    item_ids: str,
    authorization: Optional[str] = Header(None),
):
    _get_api_key(authorization)
    ids = [int(x.strip()) for x in item_ids.split(",") if x.strip()]
    if not ids:
        return {"listings": []}
    listings = await get_commerce_listings(ids)
    return {"listings": listings}


@router.get("/commerce/exchange")
async def commerce_exchange(
    quantity: int = Query(..., description="Quantity of coins or gems"),
    type: str = Query("coins", description="'coins' or 'gems'"),
    authorization: Optional[str] = Header(None),
):
    _get_api_key(authorization)
    result = await get_commerce_exchange(quantity, type)
    return result


@router.get("/commerce/search")
async def commerce_search(
    q: str = Query(..., description="Search query"),
    page: int = Query(0, ge=0),
    page_size: int = Query(24, ge=1, le=100),
):
    result = await search_items_by_name(q, page=page, page_size=page_size)
    return result


@router.post("/deepseek/analyze-build")
async def deepseek_analyze_build(
    body: dict,
    authorization: Optional[str] = Header(None),
):
    api_key = _get_api_key(authorization)
    name = body.get("name", "")

    if not name:
        raise HTTPException(status_code=400, detail="Field 'name' is required")

    build_data = await get_character_build_tab(api_key, name)
    core = await get_character_core(api_key, name)
    equipment_data = await get_character_equipment(api_key, name)

    spec_ids = [s["id"] for s in _get_build_specs(build_data)]
    specs_info = {}
    if spec_ids:
        specs_raw = await get_specialization_details(spec_ids)
        for s in specs_raw:
            specs_info[s["id"]] = s

    # Collect all trait IDs across all specializations and fetch their details
    all_trait_ids = set()
    for spec in _get_build_specs(build_data):
        spec_id = spec["id"]
        info = specs_info.get(spec_id, {})
        for t in info.get("traits", []):
            all_trait_ids.add(t["id"])
    trait_details = {}
    if all_trait_ids:
        traits_raw = await get_trait_details(list(all_trait_ids))
        for t in traits_raw:
            trait_details[t["id"]] = t

    # Build a mapping from trait tier to readable name
    TIER_NAMES = {1: "Adept", 2: "Master", 3: "Grandmaster"}
    SLOT_NAMES = {1: "Левая колонка", 2: "Средняя колонка", 3: "Правая колонка"}

    specializations = []
    for spec in _get_build_specs(build_data):
        spec_id = spec["id"]
        info = specs_info.get(spec_id, {})
        selected_ids = spec.get("traits", [])
        selected_traits_info = []
        for tid in selected_ids:
            t = trait_details.get(tid, {})
            if t:
                selected_traits_info.append({
                    "id": tid,
                    "name": t.get("name", f"Trait {tid}"),
                    "icon": t.get("icon", ""),
                    "description": _strip_gw2_tags(t.get("description", "")),
                    "tier": TIER_NAMES.get(t.get("tier", 0), f"Tier {t.get('tier', 0)}"),
                    "slot": SLOT_NAMES.get(t.get("slot", 0), f"Slot {t.get('slot', 0)}"),
                })
        all_traits_info = []
        for t in info.get("traits", []):
            all_traits_info.append({
                "id": t["id"],
                "name": t.get("name", ""),
                "icon": t.get("icon", ""),
                "description": _strip_gw2_tags(t.get("description", "")),
                "tier": TIER_NAMES.get(t.get("tier", 0), f"Tier {t.get('tier', 0)}"),
                "slot": SLOT_NAMES.get(t.get("slot", 0), f"Slot {t.get('slot', 0)}"),
            })
        specializations.append({
            "id": spec_id,
            "name": info.get("name", f"Specialization {spec_id}"),
            "icon": info.get("icon", ""),
            "background": info.get("background", ""),
            "all_traits": all_traits_info,
            "selected_traits": selected_traits_info,
        })

    equipment_item_ids = [
        eq["id"] for eq in equipment_data.get("equipment", []) if eq
    ]
    equipment_details = {}
    if equipment_item_ids:
        items_raw = await get_item_details(equipment_item_ids)
        for item in items_raw:
            equipment_details[item["id"]] = _sanitize_item(item)

    # Calculate combined stats from all equipment
    combined_stats = {}
    for eq in equipment_data.get("equipment", []):
        raw_stats = eq.get("stats") or {}
        attrs_raw = raw_stats.get("attributes") if isinstance(raw_stats, dict) else None
        if attrs_raw and isinstance(attrs_raw, dict):
            for attr_name, value in attrs_raw.items():
                if isinstance(value, (int, float)):
                    combined_stats[attr_name] = combined_stats.get(attr_name, 0) + value
        elif attrs_raw and isinstance(attrs_raw, list):
            for a in attrs_raw:
                if isinstance(a, dict) and "attribute" in a and "modifier" in a:
                    attr_name = a["attribute"]
                    combined_stats[attr_name] = combined_stats.get(attr_name, 0) + a["modifier"]

    # Fetch upgrade (rune/sigil) names for equipment
    upgrade_ids = []
    for eq in equipment_data.get("equipment", []):
        upgrades = eq.get("upgrades", [])
        if upgrades:
            upgrade_ids.extend(upgrades)
    upgrade_details = {}
    if upgrade_ids:
        upgrades_raw = await get_item_details(list(set(upgrade_ids)))
        for u in upgrades_raw:
            upgrade_details[u["id"]] = _sanitize_item(u)

    equipment = []
    for eq in equipment_data.get("equipment", []):
        item_info = equipment_details.get(eq["id"], {})

        # Resolve upgrades (runes/sigils) to names
        upgrades = eq.get("upgrades", [])
        upgrade_names = []
        for uid in upgrades:
            u = upgrade_details.get(uid, {})
            if u:
                upgrade_names.append(u.get("name", f"Upgrade {uid}"))
            else:
                upgrade_names.append(None)

        equipment.append({
            "id": eq["id"],
            "name": item_info.get("name", f"Item {eq['id']}"),
            "icon": item_info.get("icon", ""),
            "slot": eq.get("slot", ""),
            "slot_name": item_info.get("details", {}).get("type", eq.get("slot", "")),
            "rarity": item_info.get("rarity", "Basic"),
            "level": item_info.get("level", 0),
            "stats": eq.get("stats"),
            "upgrades": upgrade_names,
            "infusions": eq.get("infusions", []),
            "suffix": item_info.get("suffix", ""),
            "defense": item_info.get("defense"),
            "weight_class": item_info.get("weight_class"),
        })

    # Try to fetch metabattle build info
    profession = core.get("profession", "")
    metabattle_content = ""
    try:
        build_name = get_metabattle_build_name(profession)
        build_url = f"https://metabattle.com/wiki/Build:{build_name}"
        metabattle_content = await fetch_metabattle_build(build_url)
    except Exception:
        metabattle_content = ""

    prompt = analyze_build_text(
        name=core.get("name", name),
        profession=profession,
        specializations=specializations,
        equipment=equipment,
        combined_stats=combined_stats,
        metabattle_content=metabattle_content,
    )

    deepseek_api_key = body.get("deepseek_api_key", "")
    analysis = await deepseek_analyze(prompt, api_key=deepseek_api_key)

    return {
        "character": core.get("name", name),
        "analysis": analysis,
    }


@router.post("/deepseek/analyze-inventory")
async def deepseek_analyze_inventory(
    body: dict,
    authorization: Optional[str] = Header(None),
):
    api_key = _get_api_key(authorization)
    name = body.get("name", "")
    target = body.get("target", "inventory")

    if not name:
        raise HTTPException(status_code=400, detail="Field 'name' is required")

    if target == "bank":
        bank_data = await get_bank(api_key)
        bank_item_ids = [slot["id"] for slot in bank_data if slot and slot.get("id")]
        bank_items_info = {}
        if bank_item_ids:
            items_raw = await get_item_details(list(set(bank_item_ids)))
            for item in items_raw:
                bank_items_info[item["id"]] = _sanitize_item(item)

        prompt = "[АНАЛИЗ БАНКА]\n\nСодержимое банка:\n"
        bank_has_items = False
        for slot in bank_data:
            if slot and slot.get("id"):
                bank_has_items = True
                item_info = bank_items_info.get(slot["id"], {})
                item_name = item_info.get("name", slot.get("name", f"ID:{slot['id']}"))
                item_count = slot.get("count", 1)
                item_rarity = item_info.get("rarity", slot.get("rarity", "N/A"))
                item_level = item_info.get("level", slot.get("level", 0))
                binding = slot.get("binding", "")
                vendor_value = item_info.get("vendor_value", 0)
                flags = item_info.get("flags", [])
                item_type = item_info.get("item_type", "")
                is_bound = ("AccountBound" in str(flags) or "SoulbindOnAcquire" in str(flags)
                            or binding in ("Account", "character"))
                prefix = ""
                if is_bound:
                    prefix = "[НЕЛЬЗЯ ПРОДАТЬ] "
                if binding:
                    prefix += f"({binding}) "
                attrs_str = ""
                if is_bound:
                    attrs_str = " ПРИВЯЗАН"
                if vendor_value:
                    attrs_str += f", вендор: {vendor_value}м."
                icon = item_info.get("icon", slot.get("icon", ""))
                wiki_url = f"https://wiki.guildwars2.com/wiki/{item_name.replace(' ', '_')}"
                if icon:
                    prompt += (
                        f"  - {prefix}![{item_name}]({icon}) [{item_name}]({wiki_url}) "
                        f"x{item_count}, {item_rarity}, ур.{item_level}, "
                        f"тип:{item_type}{attrs_str}\n"
                    )
                else:
                    prompt += (
                        f"  - {prefix}[{item_name}]({wiki_url}) "
                        f"x{item_count}, {item_rarity}, ур.{item_level}, "
                        f"тип:{item_type}{attrs_str}\n"
                    )
        if not bank_has_items:
            prompt += "  Банк пуст.\n"
        prompt += f"\n\n---\n\n{INVENTORY_INSTRUCTIONS}"
    else:
        inv_data = await get_character_inventory(api_key, name)
        bags_raw = inv_data if isinstance(inv_data, list) else inv_data.get("bags", [])
        item_ids = []
        for bag in bags_raw:
            for slot in (bag.get("inventory", []) if isinstance(bag, dict) else []):
                if slot and slot.get("id"):
                    item_ids.append(slot["id"])

        items_info = {}
        if item_ids:
            items_raw = await get_item_details(list(set(item_ids)))
            for item in items_raw:
                items_info[item["id"]] = _sanitize_item(item)

        bags = []
        for bag in bags_raw:
            bag_items = []
            for slot in (bag.get("inventory", []) if isinstance(bag, dict) else []):
                if not slot:
                    bag_items.append(None)
                    continue
                item_info = items_info.get(slot["id"], {})
                bag_items.append({
                    "id": slot["id"],
                    "name": item_info.get("name", f"Item {slot['id']}"),
                    "icon": item_info.get("icon", ""),
                    "rarity": item_info.get("rarity", "Basic"),
                    "level": item_info.get("level", 0),
                    "count": slot.get("count", 1),
                    "binding": slot.get("binding"),
                })
            bags.append(bag_items)

        prompt = analyze_inventory_text(name, bags)

    deepseek_api_key = body.get("deepseek_api_key", "")
    analysis = await deepseek_analyze(prompt, api_key=deepseek_api_key)

    return {
        "character": name,
        "target": target,
        "analysis": analysis,
    }


@router.post("/deepseek/analyze-trading-post")
async def deepseek_analyze_trading_post(
    body: dict,
    authorization: Optional[str] = Header(None),
):
    api_key = _get_api_key(authorization)
    item_ids = body.get("item_ids", [])
    exchange_data = body.get("exchange_data")

    if not item_ids:
        raise HTTPException(status_code=400, detail="Field 'item_ids' is required")

    items_data = []
    prices_data = await get_commerce_prices(item_ids)
    price_map = {p["id"]: p for p in prices_data}

    try:
        item_details = await get_item_details(item_ids)
    except Exception:
        item_details = []
    for item in item_details:
        item_id = item["id"]
        entry = _sanitize_item(item)
        price_info = price_map.get(item_id, {})
        buys = price_info.get("buys", {})
        sells = price_info.get("sells", {})
        entry["buy_price"] = buys.get("unit_price")
        entry["sell_price"] = sells.get("unit_price")
        entry["buy_quantity"] = buys.get("quantity", 0)
        entry["sell_quantity"] = sells.get("quantity", 0)
        items_data.append(entry)

    prompt = analyze_trading_post_prompt(items_data, exchange_data)

    deepseek_api_key = body.get("deepseek_api_key", "")
    analysis = await deepseek_analyze(prompt, api_key=deepseek_api_key)

    return {
        "analysis": analysis,
        "items_count": len(items_data),
    }


@router.post("/cache/clear")
async def clear_cache(authorization: Optional[str] = Header(None)):
    _get_api_key(authorization)
    character_cache.clear()
    item_cache.clear()
    price_cache.clear()
    return {"status": "ok", "message": "Cache cleared"}


# ============================================================
# NEW: Account & Achievements & Raids & Masteries & Collections
# ============================================================


@router.get("/account/info")
async def account_info(authorization: Optional[str] = Header(None)):
    api_key = _get_api_key(authorization)
    data = await get_account(api_key)
    return {
        "name": data.get("name", ""),
        "world": data.get("world", 0),
        "created": data.get("created", ""),
        "guilds": data.get("guilds", []),
        "access": data.get("access", []),
        "commander": data.get("commander", False),
        "fractal_level": data.get("fractal_level", 0),
        "daily_ap": data.get("daily_achievement_points", 0),
        "monthly_ap": data.get("monthly_achievement_points", 0),
        "wvw_rank": data.get("wvw_rank", 0),
        "build_storage_slots": data.get("build_storage_slots", 0),
        "age": data.get("age", 0),
    }


@router.get("/achievements/groups")
async def achievements_groups():
    groups = await get_achievement_groups()
    return {"groups": groups}


@router.get("/achievements/categories")
async def achievements_categories():
    categories = await get_achievement_categories()
    return {"categories": categories}


@router.get("/achievements")
async def achievements_list(
    ids: str = Query(""),
):
    if not ids:
        return {"achievements": []}
    id_list = [int(x.strip()) for x in ids.split(",") if x.strip()]
    achievements = await get_achievements(id_list)

    name_texts = []
    desc_texts = []
    name_indices = []
    desc_indices = []
    for i, ach in enumerate(achievements):
        name = ach.get("name", "")
        if name:
            name_indices.append(i)
            name_texts.append(name)
        desc = ach.get("description", "")
        if desc:
            desc_indices.append(i)
            desc_texts.append(desc)

    try:
        translated_names = await _translate_texts(name_texts) if name_texts else []
    except Exception:
        translated_names = []
    try:
        translated_descs = await _translate_texts(desc_texts) if desc_texts else []
    except Exception:
        translated_descs = []

    for j, idx in enumerate(name_indices):
        if j < len(translated_names) and translated_names[j]:
            achievements[idx]["name"] = translated_names[j]
    for j, idx in enumerate(desc_indices):
        if j < len(translated_descs) and translated_descs[j]:
            achievements[idx]["description"] = translated_descs[j]

    return {"achievements": achievements}


@router.get("/achievements/daily")
async def achievements_daily():
    daily = await get_daily_achievements()
    return daily


@router.get("/account/achievements")
async def account_achievements(authorization: Optional[str] = Header(None)):
    api_key = _get_api_key(authorization)
    data = await get_account_achievements(api_key)
    return {"achievements": data}


@router.get("/raids")
async def raids_list():
    raids = await get_raids()
    return {"raids": raids}


@router.get("/account/raids")
async def account_raids(authorization: Optional[str] = Header(None)):
    api_key = _get_api_key(authorization)
    data = await get_account_raids(api_key)
    return {"raids": data}


@router.get("/masteries")
async def masteries_list():
    masteries = await get_masteries()
    enriched = []
    for m in masteries:
        m["name"] = MASTERY_NAMES.get(str(m["id"]), m.get("name", f"Мастерство #{m['id']}"))
        enriched.append(m)
    return {"masteries": enriched}


@router.get("/account/masteries")
async def account_masteries(authorization: Optional[str] = Header(None)):
    api_key = _get_api_key(authorization)
    data = await get_account_masteries(api_key)
    return {"masteries": data}


@router.get("/account/mastery-points")
async def account_mastery_points(authorization: Optional[str] = Header(None)):
    api_key = _get_api_key(authorization)
    data = await get_account_mastery_points(api_key)
    return data


@router.get("/account/collections")
async def account_collections(authorization: Optional[str] = Header(None)):
    api_key = _get_api_key(authorization)

    def _safe_list(result, default=None):
        if isinstance(result, Exception):
            logger.warning(f"Collections request failed: {result}")
            return default if default is not None else []
        if not isinstance(result, list):
            logger.warning(f"Collections unexpected type: {type(result)}")
            return default if default is not None else []
        return result

    results1 = await asyncio.gather(
        get_account_dyes(api_key),
        get_account_skins(api_key),
        get_account_minis(api_key),
        return_exceptions=True,
    )
    dye_ids = _safe_list(results1[0], [])
    skin_ids = _safe_list(results1[1], [])
    mini_ids = _safe_list(results1[2], [])

    results2 = await asyncio.gather(
        get_account_finishers(api_key),
        get_account_gliders(api_key),
        get_account_mailcarriers(api_key),
        return_exceptions=True,
    )
    finishers_raw = _safe_list(results2[0], [])
    glider_ids = _safe_list(results2[1], [])
    mailcarrier_ids = _safe_list(results2[2], [])

    # Fetch details in batch
    skin_details_map = {}
    mini_details_map = {}
    finisher_details_map = {}
    glider_details_map = {}
    mailcarrier_details_map = {}

    if skin_ids:
        try:
            skins = await get_skin_details(skin_ids)
            for s in skins:
                skin_details_map[s["id"]] = {"name": s.get("name", ""), "icon": s.get("icon", ""), "rarity": s.get("rarity", ""), "type": s.get("type", "")}
        except Exception as e:
            logger.warning(f"Failed to fetch skin details: {e}")

    if mini_ids:
        try:
            minis = await get_mini_details(mini_ids)
            for m in minis:
                mini_details_map[m["id"]] = {"name": m.get("name", ""), "icon": m.get("icon", "")}
        except Exception as e:
            logger.warning(f"Failed to fetch mini details: {e}")

    if finishers_raw:
        fin_ids = [f.get("id") for f in finishers_raw if isinstance(f, dict) and f.get("id")]
        if fin_ids:
            try:
                finishers = await get_finisher_details(fin_ids)
                for f in finishers:
                    finisher_details_map[f["id"]] = {"name": f.get("name", ""), "icon": f.get("icon", "")}
            except Exception as e:
                logger.warning(f"Failed to fetch finisher details: {e}")

    if glider_ids:
        try:
            gliders = await get_glider_details(glider_ids)
            for g in gliders:
                glider_details_map[g["id"]] = {"name": g.get("name", ""), "icon": g.get("icon", "")}
        except Exception as e:
            logger.warning(f"Failed to fetch glider details: {e}")

    if mailcarrier_ids:
        try:
            carriers = await get_mailcarrier_details(mailcarrier_ids)
            for c in carriers:
                mailcarrier_details_map[c["id"]] = {"name": c.get("name", ""), "icon": c.get("icon", "")}
        except Exception as e:
            logger.warning(f"Failed to fetch mail carrier details: {e}")

    return {
        "dye_count": len(dye_ids),
        "skins": [{"id": sid, **skin_details_map.get(sid, {"name": f"Skin {sid}", "icon": ""})} for sid in skin_ids[:500]],
        "minis": [{"id": mid, **mini_details_map.get(mid, {"name": f"Mini {mid}", "icon": ""})} for mid in mini_ids[:500]],
        "finishers": [{"id": f.get("id"), **finisher_details_map.get(f.get("id"), {"name": f"Finisher {f.get('id')}", "icon": ""})} for f in finishers_raw[:200] if isinstance(f, dict)],
        "gliders": [{"id": gid, **glider_details_map.get(gid, {"name": f"Glider {gid}", "icon": ""})} for gid in glider_ids[:200]],
        "mailcarriers": [{"id": cid, **mailcarrier_details_map.get(cid, {"name": f"Mail Carrier {cid}", "icon": ""})} for cid in mailcarrier_ids[:200]],
    }


@router.get("/professions")
async def professions_list():
    professions = await get_professions()
    return {"professions": professions}


@router.get("/professions/details")
async def professions_details(
    ids: str = Query(""),
):
    if not ids:
        return {"professions": []}
    id_list = [x.strip() for x in ids.split(",") if x.strip()]
    data = await get_profession_details(id_list)
    return {"professions": data}


@router.get("/skins")
async def skins_list(
    ids: str = Query(""),
):
    if not ids:
        return {"skins": []}
    id_list = [int(x.strip()) for x in ids.split(",") if x.strip()]
    skins = await get_skin_details(id_list)
    return {"skins": skins}


@router.get("/minis")
async def minis_list(
    ids: str = Query(""),
):
    if not ids:
        return {"minis": []}
    id_list = [int(x.strip()) for x in ids.split(",") if x.strip()]
    minis = await get_mini_details(id_list)
    return {"minis": minis}


@router.get("/recipes")
async def recipes_list(
    ids: str = Query(""),
):
    if not ids:
        return {"recipes": []}
    id_list = [int(x.strip()) for x in ids.split(",") if x.strip()]
    recipes = await get_recipe_details(id_list)
    return {"recipes": recipes}


_TRANSLATE_PATTERNS = [
    (r"\bComplete (\d+) Events?\b", r"Завершите \1 событий"),
    (r"\bComplete (\d+) Group Events?\b", r"Завершите \1 групповых событий"),
    (r"\bComplete (\d+) Bounty Missions? in ([\w\s]+) or Group Events?\b", r"Завершите \1 заданий охоты в \2 или групповых событий"),
    (r"\bComplete the ([\w\s]+) Jumping Puzzle\b", r"Пройдите головоломку \1"),
    (r"\bDefeat (\d+) Veteran-Rank Enemies?\b", r"Убейте \1 врагов-ветеранов"),
    (r"\bDefeat (\d+) ([^bE][\w\s]+?) Enemies?\b", r"Убейте \1 противников: \2"),
    (r"\bDefeat (\d+) Enemies?\b", r"Убейте \1 врагов"),
    (r"\bDefeat the ([\w\s]+) World Boss\b", r"Убейте мирового босса: \1"),
    (r"\bDefeat the ([\w\s]+) World Boss or Complete Events in ([\w\s]+)\b", r"Убейте мирового босса \1 или завершите события в \2"),
    (r"\bComplete (\d+) Rift Hunts? in ([\w\s]+) or Group Events?\b", r"Завершите \1 разломов в \2 или групповых событий"),
    (r"\bComplete (\d+) Rift Hunt(?:ing)?s?\b", r"Завершите \1 разломов"),
    (r"\bGather (\d+) (?:[\w\s]+?) from ([\w\s]+) Logging Nodes?\b", r"Соберите \1 ед. с лесозаготовок в \2"),
    (r"\bGather (\d+) (?:[\w\s]+?) from ([\w\s]+) Mining Nodes?\b", r"Соберите \1 ед. с месторождений в \2"),
    (r"\bGather (\d+) (?:[\w\s]+?) from ([\w\s]+) Harvesting Nodes?\b", r"Соберите \1 ед. с растений в \2"),
    (r"\bGather (\d+) (?:[\w\s]+?) from ([\w\s]+)\b", r"Добудьте \1 ед. в \2"),
    (r"\bGather (\d+) (?:[\w\s]+?) by ([\w\s,]+)\b", r"Добудьте \1 ед. с помощью: \2"),
    (r"\bGather (\d+) Crafting Resources?\b", r"Соберите \1 ресурсов"),
    (r"\bKill (\d+) ([\w\s]+) in ([\w\s]+)\b", r"Убейте \1 \2 в \3"),
    (r"\bEarn (\d+) (?:[\w\s]+?) from ([\w\s]+)\b", r"Заработайте \1 ед. в \2"),
    (r"\bSalvage (\d+) Items?\b", r"Разберите \1 предметов"),
    (r"\bIdentify (\d+) (?:Pieces? of )?Unidentified Gears?\b", r"Опознайте \1 неопознанной экипировки"),
    (r"\bIdentify (\d+) (?:Pieces? of )?Unidentified [\w\s]+\b", r"Опознайте \1 неопознанных предметов"),
    (r"\bCraft (\d+) Items?\b", r"Создайте \1 предметов"),
    (r"\bView (\d+) Vist(?:a|as)\b", r"Посетите \1 точек обзора"),
    (r"\bCompete in (\d+) (?:Structured )?Player vs\.? Player ([\w\s]+)\b", r"Сыграйте \1 PvP-матч: \2"),
    (r"\bCompete in (\d+) (?:Structured )?Player vs\.? Player Matches?\b", r"Сыграйте \1 PvP-матчей"),
    (r"\bParticipate in (\d+) Defense Events? in World vs\.? World\b", r"Участвуйте в \1 оборонит. событий WvW"),
    (r"\bParticipate in (\d+) (?:Player vs\.? Player )?Tournament Match(?:es)?\b", r"Сыграйте \1 турнирных PvP-матчей"),
    (r"\bLoot (\d+) Defeated Enemies?\b", r"Обыщите \1 поверженных врагов"),
    (r"\bLoot (\d+) [\w\s]+\b", r"Соберите трофеи: \1"),
    (r"\bDodge (\d+) (?:Enemy )?Attacks? Using (?:a )?Dodge(?: Roll)?\b", r"Уклонитесь от \1 атак перекатом"),
    (r"\bDodge (\d+) [\w\s]+\b", r"Уклонитесь: \1"),
    (r"\bBreak (\d+) Defiance Bars?\b", r"Сломайте \1 полос непоколебимости"),
    (r"\bBreak (\d+) Enemy(?:'s)? Defiance Bar(?:s)?\b", r"Сломайте \1 полос непоколебимости врагов"),
    (r"\bApply (\d+) Boons? to Allies?\b", r"Наложите \1 благ на союзников"),
    (r"\bApply (\d+) Conditions? to Enemies?\b", r"Наложите \1 состояний на врагов"),
    (r"\bCombo (\d+) Finishers?\b", r"Выполните \1 комбо-приёмов"),
    (r"\bPerform (\d+) Combo(?: Skills?)? in Combat\b", r"Выполните \1 комбо в бою"),
    (r"\bComplete (\d+) Renown Hearts?\b", r"Завершите \1 сердец славы"),
    (r"\bComplete (\d+) Repeatable Renown Hearts? in ([\w\s]+)\b", r"Завершите \1 повторяемых сердец в \2"),
    (r"\bComplete (\d+) Dungeons?\b", r"Пройдите \1 подземелий"),
    (r"\bComplete (\d+) Fractals? in the Fractals of the Mists\b", r"Пройдите \1 фракталов в Мглистых фракталах"),
    (r"\bComplete (?:a|Any) Fractals? in the Fractals of the Mists\b", r"Пройдите фрактал в Мглистых фракталах"),
    (r"\bComplete (\d+) (?:Fractals?|Quickplay Fractals?)\b", r"Пройдите \1 фракталов"),
    (r"\bComplete (\d+) Strike Missions?\b", r"Пройдите \1 ударных миссий"),
    (r"\bComplete (?:Any|the) Raid Encounter\b", r"Пройдите любого рейдового босса"),
    (r"\bComplete (\d+) Quickplay Raids?\b", r"Пройдите \1 быстрых рейдов"),
    (r"\bComplete the ([\w\s]+) Raid or (\d+) Quickplay Raids?\b", r"Пройдите рейд \1 или \2 быстрых рейдов"),
    (r"\bComplete the ([\w\s]+) Meta-Event\b", r"Завершите мета-событие \1"),
    (r"\bComplete (?:a )?Meta-Event or Events in ([\w\s]+) or Events in ([\w\s]+)\b", r"Завершите мета-событие или события в \1 или в \2"),
    (r"\bComplete (\d+) (?:Meta-)?Events? in ([\w\s]+)\b", r"Завершите \1 событий в \2"),
    (r"\bComplete (\d+) Meta-Events? in ([\w\s]+)\b", r"Завершите \1 мета-событий в \2"),
    (r"\bRevive (\d+) Allies?\b", r"Воскресите \1 союзников"),
    (r"\bCatch (\d+) Fish\b", r"Поймайте \1 рыб"),
    (r"\bRestore ([\d,]+) Health to Yourself or Allied Players?\b", r"Восстановите \1 здоровья себе или союзникам"),
    (r"\bDeal ([\d,]+) Damage to Enemy Players?\b", r"Нанесите \1 урона вражеским игрокам"),
    (r"\bDeal ([\d,]+) Damage (?:to Enemy Players )?in (?:Structured )?Player vs\.? Player or World vs\.? World\b", r"Нанесите \1 урона в PvP или WvW"),
    (r"\bDeal ([\d,]+) Damage Using Siege Equipment\b", r"Нанесите \1 урона осадными орудиями"),
    (r"\bEarn (\d+) (?:PvP )?Rank Points? in (?:PvP|Structured Player vs\.? Player) Matches?\b", r"Заработайте \1 очков ранга в PvP"),
    (r"\bEarn (\d+) WvW Experience\b", r"Заработайте \1 опыта WvW"),
    (r"\bEarn (\d+) Reward(?:s)? from (?:a |Structured )?PvP Reward Tracks?\b", r"Получите \1 наград PvP"),
    (r"\bEarn (?:a )?Top Scoreboard Stat on Your Team in (?:a )?PvP Match (\d+) Times?\b", r"Займите топ-место в PvP \1 раз"),
    (r"\bEarn (?:a )?Top Scoreboard Stat on Your Team in (?:a )?PvP Match\b", r"Займите топ-место в PvP"),
    (r"\bWin (\d+) (?:Games? in |Structured )?Player vs\.? Player(?: Rated Games?)?\b", r"Победите в \1 PvP-матчах"),
    (r"\bWin (\d+) Game in Conquest Mode after Completing the Map(?:'s)? Secondary Objective\b", r"Победите в 1 Conquest-матче выполнив доп. цель"),
    (r"\bCapture (\d+) (?:World vs\.? World )?Objectives?\b", r"Захватите \1 целей WvW"),
    (r"\bCapture (\d+) (?:Camp(?: Objective)?|Camps?) in World vs\.? World\b", r"Захватите \1 лагерей в WvW"),
    (r"\bCapture (\d+) (?:Keep|Keeps) in World vs\.? World\b", r"Захватите \1 замков в WvW"),
    (r"\bCapture (\d+) (?:Tower|Towers) in World vs\.? World\b", r"Захватите \1 башен в WvW"),
    (r"\bCapture (\d+) (?:Ruin, Shrine, or Mercenary Camp )?Ru(?:in|ins?|ins, Shrine(?:s)?, or Mercenary Camps?) in World vs\.? World\b", r"Захватите \1 руин/святилищ/лагерей в WvW"),
    (r"\bCapture (\d+) Sentry Points? in World vs\.? World\b", r"Захватите \1 сторожевых точек в WvW"),
    (r"\bEscort (\d+) (?:Allied )?Supply Caravans? to (?:Their )?Destinations? in World vs\.? World\b", r"Проводите \1 караванов в WvW"),
    (r"\bDestroy (\d+) (?:Enemy )?Supply Caravans? in World vs\.? World\b", r"Уничтожьте \1 вражеских караванов в WvW"),
    (r"\bDefend (\d+) World vs\.? World Objectives?\b", r"Защитите \1 целей WvW"),
    (r"\bDefeat (\d+) (?:World vs\.? World )?Invaders? in World vs\.? World\b", r"Убейте \1 захватчиков в WvW"),
    (r"\bDefeat (\d+) Enemy (?:Supply Caravan(?:s)?|Guards?) in World vs\.? World\b", r"Убейте \1 вражеских стражей в WvW"),
    (r"\bNeutralize (\d+) Enemy Capture Points? in Rated (?:Player vs\.? Player )?Conquest Matches?\b", r"Нейтрализуйте \1 точек захвата в PvP"),
    (r"\bDefeat (\d+) Enemies? While Defending a Capture Point in Rated (?:Player vs\.? Player )?Conquest Matches?\b", r"Убейте \1 врагов защищая точку в PvP"),
    (r"\bDefeat (\d+) (?:Enemy )?Players? in (?:a )?Structured (?:Player vs\.? Player|PvP)(?: Match)?\b", r"Убейте \1 игроков в PvP"),
    (r"\bDefeat (\d+) Enemies? in the ([\w\s]+)\b", r"Убейте \1 врагов в \2"),
    (r"\bDefeat ([\w\s]+) or ([\w\s]+)\b", r"Убейте \1 или \2"),
    (r"\bDefeat (\d+) ([\w\s]+?) Enemies?\b", r"Убейте \1 противников: \2"),
    (r"\bLog In\b", r"Войдите в игру"),
    (r"\bCollect (\d+) Spears? from an Alliance Field Quartermaster\b", r"Соберите \1 копий у Альянсового квартирмейстера"),
    (r"\bCollect Any (\d+) [\w\s,]+\b", r"Соберите любых \1 миниатюр"),
    (r"\bCollect (\d+) Relics? from Visions of Eternity Set (\d+)\b", r"Соберите \1 реликвий из Visions of Eternity набора \2"),
    (r"\bUnlock Any (\d+) Item Skins?\b", r"Откройте любых \1 скинов предметов"),
    (r"\bSpeak with ([\w\s]+) about the ([\w\s]+) Legendary Ring\b", r"Поговорите с \1 о легендарном кольце \2"),
    (r"\bComplete (\d+) Events\b", r"Завершите \1 событий"),
    (r"\bComplete a Convergence or Fractal\b", r"Пройдите Конвергенцию или Фрактал"),
]



def _translate_title(title: str) -> str:
    for pattern, replacement in _TRANSLATE_PATTERNS:
        translated = re.sub(pattern, replacement, title)
        if translated != title:
            return translated
    return title


async def _enrich_wizardsvault(data: dict) -> dict:
    from api.gw2_client import get_wizardsvault_all_objectives
    all_obj = await get_wizardsvault_all_objectives()
    obj_map = {}
    for o in all_obj:
        obj_map[o["id"]] = o

    enriched_objectives = []
    for obj in data.get("objectives", []):
        meta = obj_map.get(obj["id"], {})
        enriched_objectives.append({
            "id": obj["id"],
            "title": _translate_title(meta.get("title", f"Задание #{obj['id']}")),
            "track": meta.get("track", "PvE"),
            "acclaim": meta.get("acclaim", 0),
            "progress_current": obj.get("progress_current", 0),
            "progress_complete": obj.get("progress_complete", 0),
            "claimed": obj.get("claimed", False),
        })

    return {"objectives": enriched_objectives}


@router.get("/wizardsvault/daily")
async def wizardsvault_daily(
    authorization: Optional[str] = Header(None),
    api_key: Optional[str] = Query(None),
):
    key = api_key or _get_api_key(authorization) if authorization or api_key else None
    if not key:
        raise HTTPException(status_code=401, detail="API key required")
    data = await get_wizardsvault_daily(key)
    return await _enrich_wizardsvault(data)


@router.get("/wizardsvault/weekly")
async def wizardsvault_weekly(
    authorization: Optional[str] = Header(None),
    api_key: Optional[str] = Query(None),
):
    key = api_key or _get_api_key(authorization) if authorization or api_key else None
    if not key:
        raise HTTPException(status_code=401, detail="API key required")
    data = await get_wizardsvault_weekly(key)
    return await _enrich_wizardsvault(data)


@router.get("/wizardsvault/special")
async def wizardsvault_special(
    authorization: Optional[str] = Header(None),
    api_key: Optional[str] = Query(None),
):
    key = api_key or _get_api_key(authorization) if authorization or api_key else None
    if not key:
        raise HTTPException(status_code=401, detail="API key required")
    data = await get_wizardsvault_special(key)
    return await _enrich_wizardsvault(data)


@router.get("/wizardsvault/listings")
async def wizardsvault_listings(
    authorization: Optional[str] = Header(None),
    api_key: Optional[str] = Query(None),
):
    key = api_key or _get_api_key(authorization) if authorization or api_key else None
    if not key:
        raise HTTPException(status_code=401, detail="API key required")
    data = await get_wizardsvault_listings(key)
    all_listings = await get_wizardsvault_all_listings()
    season = await get_wizardsvault_season()

    listings_map = {}
    for listing in all_listings:
        listings_map[listing["id"]] = listing

    enriched = []
    for purchased in data:
        lid = purchased["id"]
        info = listings_map.get(lid, {})
        enriched.append({
            **purchased,
            "item_id": info.get("item_id"),
            "item_count": info.get("item_count"),
            "price": info.get("price"),
            "type": info.get("type"),
        })

    return {
        "listings": enriched,
        "season": season,
    }


@router.get("/wizardsvault/objectives")
async def wizardsvault_objectives():
    objectives = await get_wizardsvault_all_objectives()
    return {"objectives": [{
        **o,
        "title": _translate_title(o.get("title", f"Задание #{o['id']}"))
    } for o in objectives]}


@router.get("/characters/{name}/render")
async def character_render(
    name: str,
    authorization: Optional[str] = Header(None),
    api_key: Optional[str] = Query(None),
):
    key = api_key or _get_api_key(authorization) if authorization or api_key else None
    if not key:
        raise HTTPException(status_code=401, detail="API key required")
    image_data = await get_character_render(key, name)
    return Response(content=image_data, media_type="image/png")
