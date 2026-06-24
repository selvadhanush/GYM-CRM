export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  gymId: string;
  gymName: string;
  memberId?: string;
  token: string;
  createdAt?: string;
}

export interface Plan {
  _id: string;
  id: string;
  name: string;
  duration: number;
  durationUnit?: string;
  // FitPrime (SYSTEM) plans grant a number of sessions.
  sessions?: number;
  price: number;
  gymId: string;
}

export interface Member {
  _id: string;
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  planId: Plan | null;
  planPrice: number;
  paidAmount: number;
  joinDate: string;
  expiryDate: string;
  gymId: string;
  freezeHistory: FreezeEntry[];
  // --- FitPrime session fields ---
  sessionsRemaining?: number;
  sessionsTotal?: number;
  lastCheckInAt?: string | null;
  currentSessionEndsAt?: string | null;
  currentSessionGymId?: string | null;
  cooldownEndsAt?: string | null;
}

export interface SessionCheckIn {
  id: string;
  memberId: string;
  gymId: string;
  gymName: string;
  startedAt: string;
  expiresAt: string;
  status: 'active' | 'expired';
}

export interface FreezeEntry {
  startDate: string;
  endDate: string;
  reason: string;
}

export interface Attendance {
  _id: string;
  id: string;
  memberId: string;
  date: string;
  checkInTime: string;
  gymId: string;
}

export interface Payment {
  _id: string;
  id: string;
  memberId: string;
  gymId: string;
  amount: number;
  method: string;
  date: string;
  transactionId?: string;
}

export interface GymClass {
  _id: string;
  id: string;
  name: string;
  type: string;
  description?: string;
  trainerName?: string;
  scheduleDate: string;
  startTime: string;
  endTime: string;
  maxSeats: number;
  gymId: string;
  bookings: ClassBooking[];
  seatsAvailable: number;
  isBooked: boolean;
}

export interface ClassBooking {
  memberId: string;
  memberName: string;
  bookedAt: string;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
  is_mock?: boolean;
}

export interface PaymentVerification {
  success: boolean;
  message: string;
  amountPaid: number;
  remainingDue: number;
}

export interface ApiError {
  message: string;
  error?: string;
  details?: string;
}

export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  expiredMembers: number;
  expiringSoonCount: number;
  newMembersThisMonth: number;
  todayAttendanceCount: number;
  todaySessionsCount: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyProfit: number;
  inactiveMembersCount: number;
  recentCheckins?: {
    id: string;
    memberId: string;
    date: string;
    checkInTime: string;
    memberName: string;
    memberPhone: string;
  }[];
  activeLiveSessions?: {
    id: string;
    memberName: string;
    memberPhone: string;
    expiresAt: string;
  }[];
}

export interface PaginatedMembers {
  members: Member[];
  page: number;
  pages: number;
  total: number;
}
