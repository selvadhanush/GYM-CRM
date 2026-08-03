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
  _id?: string;
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  branches?: PartnerGymBranch[];
}

export interface GymDiscoveryProfile {
  id: string;
  gymId: string;
  shortDescription?: string;
  description?: string;
  coverImageUrl?: string;
  logoUrl?: string;
  ownerName?: string;
  contactNumber?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  googleMapsUrl?: string;
  latitude?: number;
  longitude?: number;
  landmarks?: string[];
  openingTime?: string;
  closingTime?: string;
  workingDays?: string[];
  hasParking?: boolean;
  hasLockers?: boolean;
  hasShowers?: boolean;
  hasPersonalTraining?: boolean;
  hasGroupClasses?: boolean;
  isWomenFriendly?: boolean;
  isAc?: boolean;
  amenities?: string[];
  equipments?: string[];
  instagram?: string;
  facebook?: string;
  youtube?: string;
  status?: string;
  rejectionReason?: string;
  isVerified?: boolean;
  rating?: number;
  reviewCount?: number;
  viewCount?: number;
  isOpenNow?: boolean;
  distanceKm?: number | null;
  totalVisits?: number;
}

export interface GymPost {
  id: string;
  gymId: string;
  title: string;
  caption?: string;
  description?: string;
  images?: string[];
  videoUrl?: string;
  status?: string;
  viewsCount?: number;
  createdByName?: string;
  createdAt: string;
  gym?: {
    id: string;
    name: string;
    discoveryProfile?: {
      logoUrl?: string;
      coverImageUrl?: string;
      city?: string;
      isVerified?: boolean;
    };
  };
}

export interface DiscoveryGymItem {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  status?: string;
  discoveryProfile: GymDiscoveryProfile;
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
