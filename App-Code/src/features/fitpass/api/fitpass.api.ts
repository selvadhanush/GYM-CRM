// FitPass API layer — TanStack Query hooks
// Consumes existing backend: /api/member-portal/*
// AGENTS.md §4, §12 — server data via TanStack Query, never duplicated

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_CLIENT } from '@/lib/api-client';
import type {
  SessionStatus,
  CheckInHistoryItem,
  PartnerGym,
  FitPassDashboardData,
} from '../types';

// ─── Query Keys ─────────────────────────────────────────────────────────────
export const FITPASS_KEYS = {
  dashboard: ['fitpass', 'dashboard'] as const,
  sessionStatus: ['fitpass', 'sessionStatus'] as const,
  history: (page = 1) => ['fitpass', 'history', page] as const,
  partnerGyms: ['fitpass', 'partnerGyms'] as const,
};

// ─── Hooks ───────────────────────────────────────────────────────────────────
export const useFitPassDashboard = () =>
  useQuery<FitPassDashboardData>({
    queryKey: FITPASS_KEYS.dashboard,
    queryFn: async () => {
      const { data } = await API_CLIENT.get('/member-portal/dashboard');
      return data;
    },
    staleTime: 30_000,
  });

export const useSessionStatus = () =>
  useQuery<SessionStatus>({
    queryKey: FITPASS_KEYS.sessionStatus,
    queryFn: async () => {
      const { data } = await API_CLIENT.get('/member-portal/sessions/status');
      return data;
    },
    staleTime: 15_000,
    refetchInterval: 30_000, // poll every 30s for live session countdown
  });

export const useSessionHistory = (page = 1) =>
  useQuery<{ data: CheckInHistoryItem[]; total: number }>({
    queryKey: FITPASS_KEYS.history(page),
    queryFn: async () => {
      const { data } = await API_CLIENT.get(`/member-portal/sessions/history?page=${page}&limit=20`);
      return data;
    },
    staleTime: 60_000,
  });

export const usePartnerGyms = () =>
  useQuery<PartnerGym[]>({
    queryKey: FITPASS_KEYS.partnerGyms,
    queryFn: async () => {
      const { data } = await API_CLIENT.get('/member-portal/gyms');
      return Array.isArray(data) ? data : data?.data ?? [];
    },
    staleTime: 5 * 60_000,
  });

// ─── Mutations ───────────────────────────────────────────────────────────────
export const useCheckIn = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { gymId: string; branchId?: string; qrCode: string }) => {
      const { data } = await API_CLIENT.post('/member-portal/sessions/check-in', payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FITPASS_KEYS.sessionStatus });
      qc.invalidateQueries({ queryKey: FITPASS_KEYS.dashboard });
      qc.invalidateQueries({ queryKey: ['fitpass', 'history'] });
    },
  });
};
