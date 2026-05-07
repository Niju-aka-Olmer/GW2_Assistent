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
}

export interface ItemDetailsListResponse {
  items: ItemDetails[];
}
