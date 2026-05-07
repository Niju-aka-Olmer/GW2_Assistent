import httpx
from typing import Any, Optional
from utils.errors import GW2APIError
from cache.memory_cache import character_cache, item_cache, price_cache, token_cache

GW2_API_BASE = "https://api.guildwars2.com/v2"
BATCH_SIZE = 200
REQUEST_TIMEOUT = 15.0


async def _get(
    path: str,
    api_key: Optional[str] = None,
    params: Optional[dict] = None,
) -> Any:
    headers = {}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    request_params = {"lang": "ru", **(params or {})}

    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        try:
            response = await client.get(
                f"{GW2_API_BASE}/{path}",
                headers=headers,
                params=request_params,
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            status = e.response.status_code
            detail = f"GW2 API error: {e.response.text}"
            if status == 401:
                detail = "Invalid API key"
            elif status == 403:
                detail = "Insufficient permissions"
            elif status == 404:
                detail = "Resource not found"
            elif status == 429:
                detail = "Rate limit exceeded"
            raise GW2APIError(detail=detail, status_code=status)
        except httpx.RequestError as e:
            raise GW2APIError(detail=str(e))


async def _get_batch(
    path: str,
    ids: list[int],
    api_key: Optional[str] = None,
) -> list[Any]:
    results = []
    for i in range(0, len(ids), BATCH_SIZE):
        batch = ids[i : i + BATCH_SIZE]
        batch_data = await _get(
            path,
            api_key=api_key,
            params={"ids": ",".join(str(id_) for id_ in batch)},
        )
        results.extend(batch_data if isinstance(batch_data, list) else [batch_data])
    return results


async def validate_token(api_key: str) -> dict:
    cache_key = f"token:{api_key}"
    cached = token_cache.get(cache_key)
    if cached:
        return cached

    data = await _get("tokeninfo", api_key=api_key)
    token_cache.set(cache_key, data)
    return data


async def get_characters(api_key: str) -> list[str]:
    cache_key = f"characters:{api_key}"
    cached = character_cache.get(cache_key)
    if cached:
        return cached

    names = await _get("characters", api_key=api_key)
    character_cache.set(cache_key, names)
    return names


async def get_character_core(api_key: str, name: str) -> dict:
    from urllib.parse import quote
    cache_key = f"character_core:{api_key}:{name}"
    cached = character_cache.get(cache_key)
    if cached:
        return cached

    data = await _get(f"characters/{quote(name)}/core", api_key=api_key)
    character_cache.set(cache_key, data)
    return data


async def get_character_build_tab(api_key: str, name: str) -> dict:
    from urllib.parse import quote
    cache_key = f"character_build:{api_key}:{name}"
    cached = character_cache.get(cache_key)
    if cached:
        return cached

    data = await _get(f"characters/{quote(name)}/buildtabs/active", api_key=api_key)
    character_cache.set(cache_key, data)
    return data


async def get_character_equipment(api_key: str, name: str) -> dict:
    from urllib.parse import quote
    cache_key = f"character_equipment:{api_key}:{name}"
    cached = character_cache.get(cache_key)
    if cached:
        return cached

    data = await _get(f"characters/{quote(name)}/equipment", api_key=api_key)
    character_cache.set(cache_key, data)
    return data


async def get_character_inventory(api_key: str, name: str) -> list:
    from urllib.parse import quote
    cache_key = f"character_inventory:{api_key}:{name}"
    cached = character_cache.get(cache_key)
    if cached:
        return cached

    data = await _get(f"characters/{quote(name)}/inventory", api_key=api_key)
    character_cache.set(cache_key, data)
    return data


async def get_bank(api_key: str) -> list:
    cache_key = f"bank:{api_key}"
    cached = character_cache.get(cache_key)
    if cached:
        return cached

    data = await _get("account/bank", api_key=api_key)
    character_cache.set(cache_key, data)
    return data


async def get_item_details(item_ids: list[int]) -> list[dict]:
    missing_ids = []
    items_map = {}
    for id_ in item_ids:
        cached = item_cache.get(f"item:{id_}")
        if cached is not None:
            items_map[id_] = cached
        else:
            missing_ids.append(id_)

    if missing_ids:
        fetched = await _get_batch("items", missing_ids)
        for item in fetched:
            item_cache.set(f"item:{item['id']}", item)
            items_map[item["id"]] = item

    return [items_map[id_] for id_ in item_ids if id_ in items_map]


async def get_item_prices(item_ids: list[int]) -> list[dict]:
    missing_ids = []
    prices_map = {}
    for id_ in item_ids:
        cached = price_cache.get(f"price:{id_}")
        if cached is not None:
            prices_map[id_] = cached
        else:
            missing_ids.append(id_)

    if missing_ids:
        fetched = await _get_batch("prices", missing_ids)
        for price in fetched:
            price_cache.set(f"price:{price['id']}", price)
            prices_map[price["id"]] = price

    return [prices_map[id_] for id_ in item_ids if id_ in prices_map]


async def get_skill_details(skill_ids: list[int]) -> list[dict]:
    return await _get_batch("skills", skill_ids)


async def get_trait_details(trait_ids: list[int]) -> list[dict]:
    return await _get_batch("traits", trait_ids)


async def get_specialization_details(spec_ids: list[int]) -> list[dict]:
    return await _get_batch("specializations", spec_ids)


async def get_character_render(api_key: str, name: str) -> bytes:
    from urllib.parse import quote
    headers = {"Authorization": f"Bearer {api_key}"}
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        try:
            response = await client.get(
                f"{GW2_API_BASE}/characters/{quote(name)}/render",
                headers=headers,
            )
            response.raise_for_status()
            return response.content
        except httpx.HTTPStatusError as e:
            status = e.response.status_code
            detail = f"GW2 API render error: {e.response.text}"
            if status == 401:
                detail = "Invalid API key"
            elif status == 404:
                detail = "Character not found"
            raise GW2APIError(detail=detail, status_code=status)
        except httpx.RequestError as e:
            raise GW2APIError(detail=str(e))
