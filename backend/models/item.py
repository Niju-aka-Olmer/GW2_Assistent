from pydantic import BaseModel
from typing import Optional


class ItemDetails(BaseModel):
    id: int
    name: str
    icon: str
    description: Optional[str] = None
    type: str
    rarity: str
    level: int
    vendor_value: Optional[int] = None
    flags: list[str] = []
    chat_link: str = ""
    attributes: Optional[dict[str, int]] = None
    defense: Optional[int] = None
    weight_class: Optional[str] = None
    item_type: Optional[str] = None


class ItemDetailsListResponse(BaseModel):
    items: list[ItemDetails]
