import { useAuthStore } from '@/stores/auth';
import { Platform } from 'react-native';

// Allow overriding API URL for physical device testing
const API_URL = process.env.EXPO_PUBLIC_API_URL;
const BASE_URL = API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api');

/**
 * API error with the HTTP status code and parsed response body attached, so
 * callers can branch on specific codes (e.g. the check-in 402/409/429 gates).
 */
export class ApiError extends Error {
  status: number;
  body: Record<string, unknown> | null;
  constructor(status: number, message: string, body: Record<string, unknown> | null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, unknown>;
  requiresAuth?: boolean;
}

async function request<T>(endpoint: string, config: RequestConfig): Promise<T> {
  const { method, body, requiresAuth = true } = config;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (requiresAuth) {
    const token = useAuthStore.getState().token;
    if (!token) {
      throw new Error('Authentication required');
    }
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    let parsedBody: Record<string, unknown> | null = null;
    try {
      parsedBody = await response.json();
      errorMessage = (parsedBody as any)?.message || errorMessage;
    } catch {
      // non-JSON error body; keep the generic message
    }
    // Surface the status so callers can react to 402/409/429 specifically.
    throw new ApiError(response.status, errorMessage, parsedBody);
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string, requiresAuth = true) =>
    request<T>(endpoint, { method: 'GET', requiresAuth }),

  post: <T>(endpoint: string, body?: Record<string, unknown>, requiresAuth = true) =>
    request<T>(endpoint, { method: 'POST', body, requiresAuth }),

  put: <T>(endpoint: string, body?: Record<string, unknown>, requiresAuth = true) =>
    request<T>(endpoint, { method: 'PUT', body, requiresAuth }),

  delete: <T>(endpoint: string, requiresAuth = true) =>
    request<T>(endpoint, { method: 'DELETE', requiresAuth }),

  upload: async <T>(endpoint: string, formData: FormData, requiresAuth = true): Promise<T> => {
    const headers: Record<string, string> = {
      'Content-Type': 'multipart/form-data',
    };
    if (requiresAuth) {
      const token = useAuthStore.getState().token;
      if (!token) throw new Error('Authentication required');
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = `Upload failed with status ${response.status}`;
      let parsedBody: Record<string, unknown> | null = null;
      try {
        parsedBody = await response.json();
        errorMessage = (parsedBody as any)?.message || errorMessage;
      } catch {}
      throw new ApiError(response.status, errorMessage, parsedBody);
    }
    return response.json();
  },
};
