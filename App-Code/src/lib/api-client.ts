import axios from 'axios';
import { Platform } from 'react-native';
import { storage } from './storage';

// In React Native development:
// - Android emulator maps host machine to 10.0.2.2
// - iOS simulator can use localhost
// For physical devices, you should replace this with your machine's LAN IP address.
const DEV_API_URL = Platform.select({
  android: 'http://127.0.0.1:5000/api',
  ios: 'http://172.20.9.144:5000/api',
  web: 'http://localhost:5000/api',
  default: 'http://localhost:5000/api',
});

export const API_CLIENT = axios.create({
  baseURL: DEV_API_URL,
  timeout: 10000,
});

// Interceptor to inject JWT token & headers from storage/auth state
API_CLIENT.interceptors.request.use(async (config) => {
  const token = await storage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const selectedGymId = await storage.getItem('selectedGymId');
  if (selectedGymId) {
    config.headers['x-gym-id'] = selectedGymId;
  }

  const selectedBranchId = await storage.getItem('selectedBranchId');
  if (selectedBranchId) {
    config.headers['x-branch-id'] = selectedBranchId;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Inject auth state cleaner dynamically to avoid circular dependencies
let onUnauthorizedCallback: (() => void) | null = null;

export const registerUnauthorizedHandler = (callback: () => void) => {
  onUnauthorizedCallback = callback;
};

// Response interceptor to handle global 401s
API_CLIENT.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      await storage.removeToken();
      await storage.removeItem('user');
      await storage.removeItem('selectedGymId');
      await storage.removeItem('selectedBranchId');
      
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }
    return Promise.reject(error);
  }
);
