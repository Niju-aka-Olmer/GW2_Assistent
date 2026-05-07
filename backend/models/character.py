from pydantic import BaseModel
from typing import Optional


class CharacterSummary(BaseModel):
    name: str
    race: str
    gender: str
    profession: str
    level: int
    age: int
    created: str


class CharacterListResponse(BaseModel):
    characters: list[CharacterSummary]


class Specialization(BaseModel):
    id: int
    name: str
    icon: str
    background: str
    traits: list[int]
    selected_traits: list[Optional[int]]


class Skill(BaseModel):
    id: int
    name: str
    icon: str
    description: str
    type: str
    weapon_type: Optional[str] = None
    slot: str


class BuildResponse(BaseModel):
    name: str
    profession: str
    specializations: list[Specialization]
    skills: dict[str, Skill]
    legends: Optional[list[dict]] = None


class EquipmentItem(BaseModel):
    id: int
    name: str
    icon: str
    slot: str
    rarity: str
    level: int
    stats: Optional[dict] = None
    infusions: list[int] = []
    upgrades: list[int] = []


class EquipmentResponse(BaseModel):
    name: str
    equipment: list[EquipmentItem]


class InventoryItem(BaseModel):
    id: int
    name: str
    icon: str
    rarity: str
    level: int
    count: int
    binding: Optional[str] = None
    value: Optional[int] = None


class InventoryResponse(BaseModel):
    name: str
    bags: list[list[Optional[InventoryItem]]]
