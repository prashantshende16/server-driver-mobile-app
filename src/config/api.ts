import axios from 'axios';
import { Platform } from 'react-native';

// In development:
// Android Emulator uses 10.0.2.2 to reach host machine localhost.
// iOS Simulator and Web use localhost / 127.0.0.1.
// Physical devices can configure their local LAN IP here.
const DEFAULT_HOST = Platform.select({
  android: 'http://10.0.2.2:8000',
  ios: 'http://127.0.0.1:8000',
  default: 'http://127.0.0.1:8000',
});

export const BASE_URL = DEFAULT_HOST;
export const API_BASE = `${BASE_URL}/api/v1`;

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const MobileAPI = {
  getConfig: async () => {
    const res = await apiClient.get('/mobile/config');
    return res.data.data;
  },
  getNavigation: async () => {
    const res = await apiClient.get('/mobile/navigation');
    return res.data.data;
  },
  getPage: async (slug: string) => {
    const res = await apiClient.get(`/mobile/pages/${slug}`);
    return res.data.data;
  },
  getForm: async (slug: string) => {
    const res = await apiClient.get(`/mobile/forms/${slug}`);
    return res.data.data;
  },
  getModel: async (slug: string) => {
    const res = await apiClient.get(`/mobile/models/${slug}`);
    return res.data.data;
  },
  submitAction: async (endpoint: string, method: string = 'POST', data: any = {}) => {
    const cleanEndpoint = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
    return axios({
      method,
      url: cleanEndpoint,
      data,
    });
  },
};
