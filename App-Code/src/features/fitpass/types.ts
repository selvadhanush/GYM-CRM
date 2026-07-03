// FitPass member feature types
// AGENTS.md §4 — feature folder types file

export interface SessionStatus {
  sessionsRemaining: number;
  sessionsTotal: number;
  currentSessionEndsAt: string | null;
  currentSessionGymId: string | null;
  cooldownEndsAt: string | null;
  planName: string | null;
  expiryDate: string | null;
  planStatus: 'Active' | 'Expired' | 'Inactive';
}

export interface CheckInHistoryItem {
  id: string;
  gymId: string;
  gymName: string;
  branchId: string | null;
  branchName: string | null;
  startedAt: string;
  endedAt: string | null;
  status: 'Active' | 'Completed' | 'Expired';
  sessionsDeducted: number;
}

export interface PartnerGym {
  id: string;
  name: string;
  address?: string;
  city?: string;
  branches?: PartnerGymBranch[];
}

export interface PartnerGymBranch {
  id: string;
  name: string;
  address?: string;
  fitPassEnabled: boolean;
}

export interface FitPassDashboardData {
  sessionStatus: SessionStatus;
  recentHistory: CheckInHistoryItem[];
  partnerGymsCount: number;
}
