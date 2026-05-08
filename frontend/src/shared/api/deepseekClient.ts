import { apiClient } from './apiClient';

interface DeepseekAnalyzeResponse {
  character: string;
  analysis: string;
}

interface DeepseekInventoryResponse {
  character: string;
  target: string;
  analysis: string;
}

interface DeepseekTradingPostResponse {
  analysis: string;
  items_count: number;
}

export const deepseekClient = {
  analyzeBuild: async (name: string, deepseekApiKey?: string) => {
    const { data } = await apiClient.post<DeepseekAnalyzeResponse>('/deepseek/analyze-build', {
      name,
      ...(deepseekApiKey ? { deepseek_api_key: deepseekApiKey } : {}),
    });
    return data;
  },

  analyzeInventory: async (name: string, target: 'inventory' | 'bank', deepseekApiKey?: string) => {
    const { data } = await apiClient.post<DeepseekInventoryResponse>('/deepseek/analyze-inventory', {
      name,
      target,
      ...(deepseekApiKey ? { deepseek_api_key: deepseekApiKey } : {}),
    });
    return data;
  },

  analyzeTradingPost: async (itemIds: number[], deepseekApiKey?: string, exchangeData?: any) => {
    const { data } = await apiClient.post<DeepseekTradingPostResponse>('/deepseek/analyze-trading-post', {
      item_ids: itemIds,
      ...(exchangeData ? { exchange_data: exchangeData } : {}),
      ...(deepseekApiKey ? { deepseek_api_key: deepseekApiKey } : {}),
    });
    return data;
  },
};
