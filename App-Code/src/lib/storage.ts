import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const isWeb = Platform.OS === 'web';

const webStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {}
  }
};

// In-memory cache to avoid repeated slow bridge reads from SecureStore/localStorage
const cache = new Map<string, string | null>();

export const storage = {
  async setToken(token: string): Promise<void> {
    try {
      cache.set('token', token);
      if (isWeb) {
        webStorage.setItem('token', token);
      } else {
        await SecureStore.setItemAsync('token', token);
      }
    } catch (error) {
      console.error('Failed to set secure token', error);
    }
  },

  async getToken(): Promise<string | null> {
    try {
      if (cache.has('token')) {
        return cache.get('token') || null;
      }
      let val: string | null = null;
      if (isWeb) {
        val = webStorage.getItem('token');
      } else {
        val = await SecureStore.getItemAsync('token');
      }
      cache.set('token', val);
      return val;
    } catch (error) {
      console.error('Failed to get secure token', error);
      return null;
    }
  },

  async removeToken(): Promise<void> {
    try {
      cache.delete('token');
      if (isWeb) {
        webStorage.removeItem('token');
      } else {
        await SecureStore.deleteItemAsync('token');
      }
    } catch (error) {
      console.error('Failed to delete secure token', error);
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      cache.set(key, value);
      if (isWeb) {
        webStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.error(`Failed to set item ${key}`, error);
    }
  },

  async getItem(key: string): Promise<string | null> {
    try {
      if (cache.has(key)) {
        return cache.get(key) || null;
      }
      let val: string | null = null;
      if (isWeb) {
        val = webStorage.getItem(key);
      } else {
        val = await SecureStore.getItemAsync(key);
      }
      cache.set(key, val);
      return val;
    } catch (error) {
      console.error(`Failed to get item ${key}`, error);
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      cache.delete(key);
      if (isWeb) {
        webStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error(`Failed to remove item ${key}`, error);
    }
  },
};

