from cachetools import TTLCache
from typing import Any, Optional


class MemoryCache:
    def __init__(self, maxsize: int = 512, ttl: int = 300):
        self.cache: TTLCache = TTLCache(maxsize=maxsize, ttl=ttl)

    def get(self, key: str) -> Optional[Any]:
        return self.cache.get(key)

    def set(self, key: str, value: Any) -> None:
        self.cache[key] = value

    def delete(self, key: str) -> None:
        if key in self.cache:
            del self.cache[key]

    def clear(self) -> None:
        self.cache.clear()

    def contains(self, key: str) -> bool:
        return key in self.cache


character_cache = MemoryCache(maxsize=128, ttl=600)
item_cache = MemoryCache(maxsize=1024, ttl=3600)
price_cache = MemoryCache(maxsize=512, ttl=300)
token_cache = MemoryCache(maxsize=64, ttl=60)
item_name_cache = MemoryCache(maxsize=1, ttl=3600)  # Stores the item ID->name mapping
item_id_list_cache = MemoryCache(maxsize=1, ttl=3600)  # Stores all item IDs
