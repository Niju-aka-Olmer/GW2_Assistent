export interface InfusionSlot {
  flags: string[];
}

export interface UpgradeComponent {
  name: string;
  description: string;
}

export interface ItemDetails {
  id: number;
  name: string;
  icon: string;
  description: string | null;
  type: string;
  rarity: string;
  level: number;
  vendor_value: number | null;
  flags: string[];
  chat_link: string;
  attributes?: Record<string, number> | null;
  defense?: number | null;
  weight_class?: string | null;
  item_type?: string | null;
  default_skin?: number;
  armor_class?: string;
  armor_type?: string;
  armor_defense?: number | null;
  weapon_type?: string;
  weapon_damage_type?: string;
  weapon_min_power?: number | null;
  weapon_max_power?: number | null;
  trinket_type?: string;
  container_type?: string;
  bag_size?: number | null;
  gathering_tool_type?: string;
  consumable_type?: string;
  gizmo_type?: string;
  suffix_item_id?: number | null;
  suffix?: string;
  infusion_slots?: InfusionSlot[];
  upgrade_component?: UpgradeComponent | null;
  details_suffix?: string;
}

export interface ItemDetailsListResponse {
  items: ItemDetails[];
}
