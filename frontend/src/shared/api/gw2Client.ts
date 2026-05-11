import { apiClient } from './apiClient';
import type { CharacterListResponse, CharacterFullResponse } from '../../entities/character/model/types';
import type { WalletResponse } from '../../entities/character/model/types';
import type { ItemDetailsListResponse } from '../../entities/item/model/types';
import type { PriceResponse } from '../../entities/price/model/types';

interface AuthResponse {
  status: string;
  name?: string;
  permissions?: string[];
}

interface BuildResponse {
  name: string;
  profession: string;
  specializations: {
    id: number;
    name: string;
    icon: string;
    background: string;
    traits: number[];
    selected_traits: (number | null)[];
  }[];
  equipment: {
    id: number;
    name: string;
    icon: string;
    slot: string;
    rarity: string;
    level: number;
    stats: Record<string, unknown> | null;
    infusions: number[];
    upgrades: number[];
  }[];
}

interface InventoryResponse {
  name: string;
  bags: ({
    id: number;
    name: string;
    icon: string;
    rarity: string;
    level: number;
    count: number;
    binding: string | null;
  } | null)[][];
}

interface BankResponse {
  bank: ({
    id: number;
    name: string;
    icon: string;
    rarity: string;
    level: number;
    count: number;
    binding: string | null;
  } | null)[];
}

interface MaterialItem {
  id: number;
  name: string;
  icon: string;
  rarity: string;
  level: number;
  type: string;
  count: number;
  category_id: number;
  category_name: string;
  vendor_value: number;
  flags: string[];
  tp_buy: number;
  tp_sell: number;
}

interface MaterialsResponse {
  materials: MaterialItem[];
}

interface CacheClearResponse {
  status: string;
  message: string;
}

interface LegendaryArmoryItem {
  id: number;
  name: string;
  icon: string;
  rarity: string;
  level: number;
  type: string;
  subtype: string;
  count: number;
  flags: string[];
}

interface LegendaryArmoryResponse {
  items: LegendaryArmoryItem[];
}

interface DungeonPath {
  id: string;
  name: string;
  type: string;
  completed: boolean;
}

interface Dungeon {
  id: string;
  name: string;
  icon: string;
  paths: DungeonPath[];
  completed_count: number;
  total_count: number;
}

interface DungeonsResponse {
  dungeons: Dungeon[];
}

interface DailyCraftingItem {
  id: string;
  name: string;
  completed: boolean;
}

interface DailyCraftingResponse {
  items: DailyCraftingItem[];
}

interface WorldBoss {
  id: string;
  name: string;
  icon: string;
  map: string;
  defeated: boolean;
}

interface WorldBossesResponse {
  bosses: WorldBoss[];
}

interface AccountValueItem {
  id: number;
  count: number;
  unit_price: number;
  total: number;
  name?: string;
  icon?: string;
}

interface AccountValueCategory {
  total_coins: number;
  total_gold: number;
  items: AccountValueItem[];
}

interface AccountValueResponse {
  total_value_coins: number;
  total_value_gold: number;
  wallet: { coins: number; gold: number };
  materials: AccountValueCategory;
  bank: AccountValueCategory;
}

export const gw2Client = {
  auth: async () => {
    const { data } = await apiClient.post<AuthResponse>('/auth');
    return data;
  },

  getCharacters: async () => {
    const { data } = await apiClient.get<CharacterListResponse>('/characters');
    return data;
  },

  getCharacterBuild: async (name: string) => {
    const { data } = await apiClient.get<BuildResponse>(`/characters/${encodeURIComponent(name)}/build`);
    return data;
  },

  getCharacterFull: async (name: string) => {
    const { data } = await apiClient.get<CharacterFullResponse>(`/characters/${encodeURIComponent(name)}/full`);
    return data;
  },

  getCurrencies: async () => {
    const { data } = await apiClient.get('/currencies');
    return data;
  },

  getCharacterInventory: async (name: string) => {
    const { data } = await apiClient.get<InventoryResponse>(`/characters/${encodeURIComponent(name)}/inventory`);
    return data;
  },

  getBank: async () => {
    const { data } = await apiClient.get<BankResponse>('/account/bank');
    return data;
  },

  getMaterials: async () => {
    const { data } = await apiClient.get<MaterialsResponse>('/account/materials');
    return data;
  },

  getLegendaryArmory: async () => {
    const { data } = await apiClient.get<LegendaryArmoryResponse>('/account/legendary-armory');
    return data;
  },

  getItemPrices: async (itemIds: number[]) => {
    const { data } = await apiClient.get<PriceResponse>('/items/prices', {
      params: { item_ids: itemIds.join(',') },
    });
    return data;
  },

  getItemDetails: async (itemIds: number[]) => {
    const { data } = await apiClient.get<ItemDetailsListResponse>('/items/details', {
      params: { item_ids: itemIds.join(',') },
    });
    return data.items;
  },

  clearCache: async () => {
    const { data } = await apiClient.post<CacheClearResponse>('/cache/clear');
    return data;
  },

  getWallet: async () => {
    const { data } = await apiClient.get<WalletResponse>('/account/wallet');
    return data;
  },

  getAccountInfo: async () => {
    const { data } = await apiClient.get('/account/info');
    return data;
  },

  getAchievementGroups: async () => {
    const { data } = await apiClient.get('/achievements/groups');
    return data;
  },

  getAchievementCategories: async () => {
    const { data } = await apiClient.get('/achievements/categories');
    return data;
  },

  getDailyAchievements: async () => {
    const { data } = await apiClient.get('/achievements/daily');
    return data;
  },

  getAchievements: async (ids: number[]) => {
    const { data } = await apiClient.get('/achievements', {
      params: { ids: ids.join(',') },
    });
    return data;
  },

  getAccountAchievements: async () => {
    const { data } = await apiClient.get('/account/achievements');
    return data;
  },

  getRaids: async () => {
    const { data } = await apiClient.get('/raids');
    return data;
  },

  getAccountRaids: async () => {
    const { data } = await apiClient.get('/account/raids');
    return data;
  },

  getMasteries: async () => {
    const { data } = await apiClient.get('/masteries');
    return data;
  },

  getAccountMasteries: async () => {
    const { data } = await apiClient.get('/account/masteries');
    return data;
  },

  getAccountMasteryPoints: async () => {
    const { data } = await apiClient.get('/account/mastery-points');
    return data;
  },

  getAccountCollections: async () => {
    const { data } = await apiClient.get('/account/collections');
    return data;
  },

  getProfessions: async () => {
    const { data } = await apiClient.get('/professions');
    return data;
  },

  getProfessionDetails: async (ids: string[]) => {
    const { data } = await apiClient.get('/professions/details', {
      params: { ids: ids.join(',') },
    });
    return data;
  },

  getRecipes: async (ids: number[]) => {
    const { data } = await apiClient.get('/recipes', {
      params: { ids: ids.join(',') },
    });
    return data.recipes;
  },

  searchItems: async (query: string) => {
    const { data } = await apiClient.get('/commerce/search', {
      params: { q: query, page: 0, page_size: 50 },
    });
    return data;
  },

  getWizardsVaultDaily: async () => {
    const { data } = await apiClient.get('/wizardsvault/daily');
    return data;
  },

  getWizardsVaultWeekly: async () => {
    const { data } = await apiClient.get('/wizardsvault/weekly');
    return data;
  },

  getWizardsVaultSpecial: async () => {
    const { data } = await apiClient.get('/wizardsvault/special');
    return data;
  },

  getWizardsVaultListings: async () => {
    const { data } = await apiClient.get('/wizardsvault/listings');
    return data;
  },

  getDungeons: async () => {
    const { data } = await apiClient.get<DungeonsResponse>('/account/dungeons');
    return data;
  },

  getDailyCrafting: async () => {
    const { data } = await apiClient.get<DailyCraftingResponse>('/account/dailycrafting');
    return data;
  },

  getWorldBosses: async () => {
    const { data } = await apiClient.get<WorldBossesResponse>('/account/world-bosses');
    return data;
  },

  getAccountValue: async () => {
    const { data } = await apiClient.get<AccountValueResponse>('/account/value');
    return data;
  },
};
