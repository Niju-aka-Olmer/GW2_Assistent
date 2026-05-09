import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 300000,
});

apiClient.interceptors.request.use((config) => {
  const apiKey = sessionStorage.getItem('gw2_api_key') || localStorage.getItem('gw2_api_key_saved');
  if (apiKey) {
    config.headers.Authorization = `Bearer ${apiKey}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('gw2_api_key');
    }
    return Promise.reject(error);
  },
);
