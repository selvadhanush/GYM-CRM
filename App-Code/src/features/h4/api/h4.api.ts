// H4 Member API layer — TanStack Query hooks
// Consumes existing backend: /api/member-portal/*
// AGENTS.md §4, §12 — server data via TanStack Query

import { useQuery } from '@tanstack/react-query';
import { API_CLIENT } from '@/lib/api-client';
import type { H4Plan, H4AttendanceRecord, H4PaymentRecord, H4DashboardData } from '../types';

// ─── Query Keys ─────────────────────────────────────────────────────────────
export const H4_KEYS = {
  dashboard: ['h4', 'dashboard'] as const,
  plan: ['h4', 'plan'] as const,
  attendance: ['h4', 'attendance'] as const,
  payments: ['h4', 'payments'] as const,
};

// ─── Hooks ───────────────────────────────────────────────────────────────────
export const useH4Dashboard = () =>
  useQuery<H4DashboardData>({
    queryKey: H4_KEYS.dashboard,
    queryFn: async () => {
      const { data } = await API_CLIENT.get('/member-portal/dashboard');
      return data;
    },
    staleTime: 30_000,
  });

export const useH4Plan = () =>
  useQuery<H4Plan>({
    queryKey: H4_KEYS.plan,
    queryFn: async () => {
      const { data } = await API_CLIENT.get('/member-portal/plan');
      return data;
    },
    staleTime: 60_000,
  });

export const useH4Attendance = () =>
  useQuery<{ data: H4AttendanceRecord[]; total: number }>({
    queryKey: H4_KEYS.attendance,
    queryFn: async () => {
      const { data } = await API_CLIENT.get('/member-portal/attendance');
      return data;
    },
    staleTime: 60_000,
  });

export const useH4Payments = () =>
  useQuery<{ data: H4PaymentRecord[]; total: number }>({
    queryKey: H4_KEYS.payments,
    queryFn: async () => {
      const { data } = await API_CLIENT.get('/member-portal/payments');
      return data;
    },
    staleTime: 60_000,
  });
