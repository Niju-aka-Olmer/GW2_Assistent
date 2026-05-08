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
    search_items_by_name,
)
from api.deepseek_client import analyze as deepseek_analyze
from services.build_analyzer import analyze_build_text
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
    """Clean up item data by stripping GW2 markup tags and extracting attributes."""
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
    for bag in inv_data.get("bags", []):
        for slot in (bag.get("inventory", []) if isinstance(bag, dict) else []):
            if slot and slot.get("id"):
                item_ids.append(slot["id"])

    items_info = {}
    if item_ids:
        items_raw = await get_item_details(list(set(item_ids)))
        for item in items_raw:
            items_info[item["id"]] = _sanitize_item(item)

    bags = []
    for bag in inv_data.get("bags", []):
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
    authorization: Optional[str] = Header(None),
):
    _get_api_key(authorization)
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
        item_ids = []
        for bag in inv_data.get("bags", []):
            for slot in (bag.get("inventory", []) if isinstance(bag, dict) else []):
                if slot and slot.get("id"):
                    item_ids.append(slot["id"])

        items_info = {}
        if item_ids:
            items_raw = await get_item_details(list(set(item_ids)))
            for item in items_raw:
                items_info[item["id"]] = _sanitize_item(item)

        bags = []
        for bag in inv_data.get("bags", []):
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

    item_details = await get_item_details(item_ids)
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
