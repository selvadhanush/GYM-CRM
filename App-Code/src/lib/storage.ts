import * as SecureStore from 'expo-secure-store';

export const storage = {
  async setToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync('token', token);
    } catch (error) {
      console.error('Failed to set secure token', error);
    }
  },

  async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('token');
    } catch (error) {
      console.error('Failed to get secure token', error);
      return null;
    }
  },

  async removeToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('token');
    } catch (error) {
      console.error('Failed to delete secure token', error);
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error(`Failed to set item ${key}`, error);
    }
  },

  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`Failed to get item ${key}`, error);
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`Failed to remove item ${key}`, error);
    }
  },
};
