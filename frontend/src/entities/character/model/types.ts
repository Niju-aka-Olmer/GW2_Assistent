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

export interface WalletCurrency {
  id: number;
  value: number;
  name?: string;
  icon?: string;
  description?: string;
  order?: number;
}

export interface WalletResponse {
  wallet: WalletCurrency[];
}

export interface CharacterListResponse {
  characters: CharacterSummary[];
}

export interface CharacterFullResponse {
  name: string;
  race: string;
  gender: string;
  profession: string;
  level: number;
  age: number;
  created: string;
  deaths: number;
  title: number | null;
  wallet: WalletCurrency[];
  specializations: FullSpecialization[];
  skills: Record<string, FullSkill>;
  equipment: FullEquipmentItem[];
  crafting: CraftingDiscipline[];
  attributes: Record<string, number>;
}

export interface FullSpecialization {
  id: number;
  name: string;
  icon: string;
  background: string;
  traits: FullTrait[];
  selected_traits: (number | null)[];
}

export interface FullTrait {
  id: number;
  name: string;
  icon: string;
  description: string;
  tier: number;
  slot: string;
}

export interface FullSkill {
  id: number;
  name: string;
  icon: string;
  description: string;
  type: string;
  weapon_type: string | null;
  slot: string;
  facts: SkillFact[];
  categories: string[];
}

export interface SkillFact {
  text: string;
  type: string;
  icon: string;
  value?: number | string;
  target?: string;
}

export interface FullEquipmentItem {
  id: number;
  name: string;
  icon: string;
  slot: string;
  rarity: string;
  level: number;
  stats: Record<string, number> | null;
  infusions: number[];
  upgrades: number[];
  details: Record<string, unknown> | null;
}

export interface CraftingDiscipline {
  discipline: string;
  rating: number;
  active: boolean;
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
