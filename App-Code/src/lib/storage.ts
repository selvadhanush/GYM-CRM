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

export const storage = {
  async setToken(token: string): Promise<void> {
    try {
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
      if (isWeb) {
        return webStorage.getItem('token');
      }
      return await SecureStore.getItemAsync('token');
    } catch (error) {
      console.error('Failed to get secure token', error);
      return null;
    }
  },

  async removeToken(): Promise<void> {
    try {
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
      if (isWeb) {
        return webStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`Failed to get item ${key}`, error);
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
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
