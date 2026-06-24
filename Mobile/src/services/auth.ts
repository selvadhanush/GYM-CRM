import { api } from './api';
import type { User } from '@/types';

export const authService = {
  login: (email: string, password: string) =>
    api.post<User>('/auth/login', { email, password }, false),

  checkUser: (email: string) =>
    api.post<{ status: 'new' | 'exists', message: string, role?: string }>('/auth/check-user', { email }, false),

  register: (name: string, email: string, password: string, phone: string) =>
    api.post<{ message: string, email: string }>('/auth/register', { name, email, password, phone }, false),

  verifyOTP: (email: string, otp: string) =>
    api.post<User>('/auth/verify-otp', { email, otp }, false),

  healthCheck: () =>
    api.get<{ success: boolean; status: string }>('/health', false),
};
