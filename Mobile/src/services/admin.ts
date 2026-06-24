import { api } from './api';
import type { DashboardStats, PaginatedMembers, Attendance } from '@/types';

export const adminService = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    return await api.get('/dashboard/stats');
  },

  getHistory: async (period: string, date?: string): Promise<{ success: boolean, data: any[] }> => {
    let url = `/dashboard/history?period=${period}`;
    if (date) url += `&date=${date}`;
    return await api.get(url);
  },

  getMembers: async (page = 1, limit = 20, search = ''): Promise<PaginatedMembers> => {
    return await api.get(`/members?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
  },

  getTodayAttendance: async (): Promise<Attendance[]> => {
    return await api.get('/attendance/today');
  },

  getPlans: async (): Promise<any[]> => {
    return await api.get('/plans');
  },

  getPartneredGyms: async (): Promise<any[]> => {
    return await api.get('/gyms/partnered');
  },

  uploadGymImages: async (assets: { uri: string, name: string, type: string }[]): Promise<{ message: string, images: string[] }> => {
    const FileSystem = require('expo-file-system/legacy');
    const { useAuthStore } = require('@/stores/auth');
    const { Platform } = require('react-native');
    
    const token = useAuthStore.getState().token;
    if (!token) throw new Error('Authentication required');

    const API_URL = process.env.EXPO_PUBLIC_API_URL;
    const BASE_URL = API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api');

    let finalImages: string[] = [];
    let finalMessage = 'Images uploaded successfully';

    // Upload sequentially to avoid backend race conditions and bypass RN FormData bugs
    for (const asset of assets) {
      const response = await FileSystem.uploadAsync(`${BASE_URL}/gyms/images`, asset.uri, {
        httpMethod: 'POST',
        uploadType: 1, // FileSystemUploadType.MULTIPART
        fieldName: 'images',
        mimeType: asset.type,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status >= 200 && response.status < 300) {
        const body = JSON.parse(response.body);
        finalImages = body.images;
        finalMessage = body.message || finalMessage;
      } else {
        let msg = 'Upload failed';
        try {
          msg = JSON.parse(response.body).message || msg;
        } catch {}
        throw new Error(msg);
      }
    }

    return { message: finalMessage, images: finalImages };
  },

  updateGymImages: async (images: string[]): Promise<{ message: string, images: string[] }> => {
    return await api.put('/gyms/images', { images });
  },
};
