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
}

export interface ItemDetailsListResponse {
  items: ItemDetails[];
}
