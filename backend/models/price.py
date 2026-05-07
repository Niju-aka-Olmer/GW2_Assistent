from pydantic import BaseModel
from typing import Optional


class PriceData(BaseModel):
    id: int
    buys: Optional[dict] = None
    sells: Optional[dict] = None


class PriceResponse(BaseModel):
    prices: list[PriceData]
