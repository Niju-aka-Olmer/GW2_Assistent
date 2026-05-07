export interface CharacterSummary {
  name: string;
  race: string;
  gender: string;
  profession: string;
  level: number;
  age: number;
  created: string;
  coins: number;
}

export interface CharacterListResponse {
  characters: CharacterSummary[];
}

export interface Specialization {
  id: number;
  name: string;
  icon: string;
  background: string;
  traits: number[];
  selected_traits: (number | null)[];
}

export interface Skill {
  id: number;
  name: string;
  icon: string;
  description: string;
  type: string;
  weapon_type: string | null;
  slot: string;
}

export interface BuildResponse {
  name: string;
  profession: string;
  specializations: Specialization[];
  skills: Record<string, Skill>;
  legends: Record<string, unknown>[] | null;
}

export interface EquipmentItem {
  id: number;
  name: string;
  icon: string;
  slot: string;
  rarity: string;
  level: number;
  stats: Record<string, unknown> | null;
  infusions: number[];
  upgrades: number[];
}

export interface EquipmentResponse {
  name: string;
  equipment: EquipmentItem[];
}

export interface InventoryItem {
  id: number;
  name: string;
  icon: string;
  rarity: string;
  level: number;
  count: number;
  binding: string | null;
  value: number | null;
}

export interface InventoryResponse {
  name: string;
  bags: (InventoryItem | null)[][];
}
