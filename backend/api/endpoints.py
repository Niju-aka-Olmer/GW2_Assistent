from fastapi import APIRouter, Header, HTTPException, Query
from fastapi.responses import Response
from typing import Optional

from services.auth_service import verify_api_key
from api.gw2_client import (
    get_characters,
    get_character_core,
    get_character_build_tab,
    get_character_equipment,
    get_character_inventory,
    get_character_render,
    get_bank,
    get_item_details,
    get_item_prices,
    get_skill_details,
    get_trait_details,
    get_specialization_details,
    get_commerce_prices,
    get_commerce_listings,
    get_commerce_exchange,
    get_account_wallet,
    get_currencies,
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
)
from api.deepseek_client import analyze as deepseek_analyze
from services.build_analyzer import analyze_build_text, fetch_metabattle_build, get_metabattle_build_name
from services.inventory_analyzer import analyze_inventory_text, INVENTORY_INSTRUCTIONS
from services.trading_post_analyzer import analyze_trading_post_prompt
from cache.memory_cache import character_cache, item_cache, price_cache
from models.character import CharacterSummary
from utils.errors import AuthError

router = APIRouter(prefix="/api")


def _strip_gw2_tags(text: Optional[str]) -> Optional[str]:
    """Remove GW2 chat markup tags like <c=@flavor>...</c> from text."""
    if not text:
        return text
    import re
    text = re.sub(r'<c?=@?\w*>[^<]*</c>', '', text)
    text = re.sub(r'<c?=@?\w*/>', '', text)
    text = re.sub(r'<br[^>]*>', '\n', text)
    text = text.strip()
    return text


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

    spec_ids = [s["id"] for s in build_data.get("specializations", [])]
    specs_info = {}
    if spec_ids:
        specs_raw = await get_specialization_details(spec_ids)
        for s in specs_raw:
            specs_info[s["id"]] = s

    skill_ids = list(build_data.get("skills", {}).values())
    skills_info = {}
    if skill_ids:
        skills_raw = await get_skill_details(skill_ids)
        for s in skills_raw:
            skills_info[s["id"]] = s

    specializations = []
    for spec in build_data.get("specializations", []):
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
    core = await get_character_core(api_key, name)
    build_data = await get_character_build_tab(api_key, name)
    equipment_data = await get_character_equipment(api_key, name)
    wallet_data = await get_account_wallet(api_key)

    # Currency info for wallet
    currency_ids = [w["id"] for w in wallet_data]
    currency_map = {}
    if currency_ids:
        currencies = await get_currencies(currency_ids)
        for c in currencies:
            currency_map[c["id"]] = c

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

    # Specializations with details
    spec_ids = [s["id"] for s in build_data.get("specializations", [])]
    specs_info = {}
    if spec_ids:
        specs_raw = await get_specialization_details(spec_ids)
        for s in specs_raw:
            specs_info[s["id"]] = s

    specializations = []
    for spec in build_data.get("specializations", []):
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
            "all_traits": trait_details,
            "selected_traits": spec.get("traits", []),
        })

    # Skills with details
    skill_ids = list(build_data.get("skills", {}).values())
    skills_info = {}
    if skill_ids:
        skills_raw = await get_skill_details(skill_ids)
        for s in skills_raw:
            skills_info[s["id"]] = s
    skill_slots = build_data.get("skills", {})
    skills = {}
    for slot_name, skill_id in skill_slots.items():
        info = skills_info.get(skill_id, {})
        skills[slot_name] = {
            "id": skill_id,
            "name": info.get("name", f"Skill {skill_id}"),
            "icon": info.get("icon", ""),
            "description": _strip_gw2_tags(info.get("description", "")),
            "type": info.get("type", ""),
            "weapon_type": info.get("weapon_type", ""),
            "slot": slot_name,
        }

    # Equipment with full details
    equipment_item_ids = [
        eq["id"] for eq in equipment_data.get("equipment", []) if eq
    ]
    equipment_details = {}
    if equipment_item_ids:
        items_raw = await get_item_details(equipment_item_ids)
        for item in items_raw:
            equipment_details[item["id"]] = _sanitize_item(item)

    # Calculate combined stats from equipment (flatting GW2 format)
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
        elif isinstance(raw_stats, dict):
            for k, v in raw_stats.items():
                if k != "id" and isinstance(v, (int, float)):
                    combined_stats[k] = combined_stats.get(k, 0) + v

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

    # Crafting info
    crafting = core.get("crafting", [])

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

    spec_ids = [s["id"] for s in build_data.get("specializations", [])]
    specs_info = {}
    if spec_ids:
        specs_raw = await get_specialization_details(spec_ids)
        for s in specs_raw:
            specs_info[s["id"]] = s

    specializations = []
    for spec in build_data.get("specializations", []):
        spec_id = spec["id"]
        info = specs_info.get(spec_id, {})
        specializations.append({
            "id": spec_id,
            "name": info.get("name", f"Specialization {spec_id}"),
            "icon": info.get("icon", ""),
            "selected_traits": spec.get("traits", []),
        })

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
        equipment.append({
            "id": eq["id"],
            "name": item_info.get("name", f"Item {eq['id']}"),
            "icon": item_info.get("icon", ""),
            "slot": eq.get("slot", ""),
            "rarity": item_info.get("rarity", "Basic"),
            "level": item_info.get("level", 0),
            "stats": eq.get("stats"),
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
        prompt = "[АНАЛИЗ БАНКА]\n\nСодержимое банка:\n"
        bank_has_items = False
        for slot in bank_data:
            if slot and slot.get("id"):
                bank_has_items = True
                item_name = slot.get("name", f"ID:{slot['id']}")
                item_count = slot.get("count", 1)
                item_rarity = slot.get("rarity", "N/A")
                item_level = slot.get("level", 0)
                prompt += f"  - {item_name} (x{item_count}, редкость: {item_rarity}, уровень: {item_level})\n"
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
    return {"masteries": masteries}


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
    dye_ids, skin_ids, mini_ids = await asyncio.gather(
        get_account_dyes(api_key),
        get_account_skins(api_key),
        get_account_minis(api_key),
    )
    # Fetch finishers, gliders, mailcarriers
    finishers_raw, glider_ids, mailcarrier_ids = await asyncio.gather(
        get_account_finishers(api_key),
        get_account_gliders(api_key),
        get_account_mailcarriers(api_key),
    )

    # Fetch details in batch
    skin_details_map = {}
    mini_details_map = {}
    finisher_details_map = {}
    glider_details_map = {}
    mailcarrier_details_map = {}

    if skin_ids:
        skins = await get_skin_details(skin_ids)
        for s in skins:
            skin_details_map[s["id"]] = {"name": s.get("name", ""), "icon": s.get("icon", ""), "rarity": s.get("rarity", ""), "type": s.get("type", "")}
    if mini_ids:
        minis = await get_mini_details(mini_ids)
        for m in minis:
            mini_details_map[m["id"]] = {"name": m.get("name", ""), "icon": m.get("icon", "")}
    if finishers_raw:
        fin_ids = [f.get("id") for f in finishers_raw if f.get("id")]
        if fin_ids:
            finishers = await get_finisher_details(fin_ids)
            for f in finishers:
                finisher_details_map[f["id"]] = {"name": f.get("name", ""), "icon": f.get("icon", "")}
    if glider_ids:
        gliders = await get_glider_details(glider_ids)
        for g in gliders:
            glider_details_map[g["id"]] = {"name": g.get("name", ""), "icon": g.get("icon", "")}
    if mailcarrier_ids:
        carriers = await get_mailcarrier_details(mailcarrier_ids)
        for c in carriers:
            mailcarrier_details_map[c["id"]] = {"name": c.get("name", ""), "icon": c.get("icon", "")}

    return {
        "dye_count": len(dye_ids),
        "skins": [{"id": sid, **skin_details_map.get(sid, {"name": f"Skin {sid}", "icon": ""})} for sid in skin_ids[:500]],
        "minis": [{"id": mid, **mini_details_map.get(mid, {"name": f"Mini {mid}", "icon": ""})} for mid in mini_ids[:500]],
        "finishers": [{"id": f.get("id"), **finisher_details_map.get(f.get("id"), {"name": f.get("name", f"Finisher {f.get('id')}"), "icon": ""})} for f in finishers_raw[:200]],
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
