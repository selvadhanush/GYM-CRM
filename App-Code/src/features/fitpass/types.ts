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
  _id?: string;
  gymId: string;
  gymName: string;
  branchId?: string | null;
  branchName?: string | null;
  startedAt: string;
  endedAt?: string | null;
  status: 'Active' | 'Completed' | 'Expired';
  sessionsDeducted?: number;
  date?: string;
  checkInTime?: string;
}

export interface PartnerGymBranch {
  id: string;
  _id?: string;
  name: string;
  address?: string;
  phone?: string;
  fitPassEnabled?: boolean;
}

export interface GymReview {
  id: string;
  gymId: string;
  memberId: string;
  memberName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface PartnerGym {
  id: string;
  _id?: string;
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  images?: string[];
  rating?: number;
  averageRating?: number;
  totalReviews?: number;
  reviews?: GymReview[];
  amenities?: string[];
  operatingHours?: string;
  description?: string;
  activeSessions?: number;
  defaultSessionDurationMinutes?: number;
  status?: string;
  isBranch?: boolean;
  branchId?: string;
  gymId?: string;
  parentGymName?: string;
  branches?: PartnerGymBranch[];
}

export interface FitPassPlan {
  id: string;
  _id?: string;
  name: string;
  duration: number;
  durationUnit: string;
  sessions: number;
  price: number;
  gymId: string;
}

export interface FitPassDashboardData {
  sessionStatus: SessionStatus;
  recentHistory: CheckInHistoryItem[];
  partnerGymsCount: number;
}
