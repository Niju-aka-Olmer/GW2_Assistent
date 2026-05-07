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


class ItemDetailsListResponse(BaseModel):
    items: list[ItemDetails]
