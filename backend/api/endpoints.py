from fastapi import APIRouter, Header, HTTPException
from typing import Optional

from services.auth_service import verify_api_key
from api.gw2_client import (
    get_characters,
    get_character_core,
    get_character_build_tab,
    get_character_equipment,
    get_character_inventory,
    get_bank,
    get_item_details,
    get_item_prices,
    get_skill_details,
    get_trait_details,
    get_specialization_details,
)
from api.deepseek_client import analyze as deepseek_analyze
from services.build_analyzer import analyze_build_text
from services.inventory_analyzer import analyze_inventory_text, bank_analysis_prompt
from cache.memory_cache import character_cache, item_cache, price_cache
from models.character import CharacterSummary
from utils.errors import AuthError

router = APIRouter(prefix="/api")


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
            equipment_details[item["id"]] = item

    equipment = []
    for eq in equipment_data.get("equipment", []):
        item_info = equipment_details.get(eq["id"], {})
        equipment.append(
            {
                "id": eq["id"],
                "name": item_info.get("name", f"Item {eq['id']}"),
                "icon": item_info.get("icon", ""),
                "slot": eq.get("slot", ""),
                "rarity": item_info.get("rarity", "Basic"),
                "level": item_info.get("level", 0),
                "stats": eq.get("stats"),
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


@router.get("/characters/{name}/inventory")
async def character_inventory(
    name: str,
    authorization: Optional[str] = Header(None),
):
    api_key = _get_api_key(authorization)
    inv_data = await get_character_inventory(api_key, name)

    item_ids = []
    for bag in inv_data:
        for slot in (bag.get("inventory", []) if isinstance(bag, dict) else []):
            if slot and slot.get("id"):
                item_ids.append(slot["id"])

    items_info = {}
    if item_ids:
        items_raw = await get_item_details(list(set(item_ids)))
        for item in items_raw:
            items_info[item["id"]] = item

    bags = []
    for bag in inv_data:
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
            items_info[item["id"]] = item

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
    return {"items": items}


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
            equipment_details[item["id"]] = item

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

    prompt = analyze_build_text(
        name=core.get("name", name),
        profession=core.get("profession", ""),
        specializations=specializations,
        equipment=equipment,
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
        prompt = bank_analysis_prompt(bank_data)
    else:
        inv_data = await get_character_inventory(api_key, name)
        item_ids = []
        for bag in inv_data:
            for slot in (bag.get("inventory", []) if isinstance(bag, dict) else []):
                if slot and slot.get("id"):
                    item_ids.append(slot["id"])

        items_info = {}
        if item_ids:
            items_raw = await get_item_details(list(set(item_ids)))
            for item in items_raw:
                items_info[item["id"]] = item

        bags = []
        for bag in inv_data:
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


@router.post("/cache/clear")
async def clear_cache(authorization: Optional[str] = Header(None)):
    _get_api_key(authorization)
    character_cache.clear()
    item_cache.clear()
    price_cache.clear()
    return {"status": "ok", "message": "Cache cleared"}
