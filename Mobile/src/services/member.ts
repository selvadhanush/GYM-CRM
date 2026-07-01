import { api } from './api';
import type {
  Member,
  Attendance,
  Payment,
  GymClass,
  RazorpayOrder,
  PaymentVerification,
  Plan,
  SessionCheckIn,
} from '@/types';

export const memberService = {
  getDashboardData: () =>
    api.get<{
      success: boolean;
      member: Member;
      attendance: Attendance[];
      partnerGyms: any[];
      sessionStatus: {
        active: boolean;
        sessionEndsAt: string | null;
        currentSessionGymId: string | null;
        inCooldown: boolean;
        cooldownEndsAt: string | null;
        lastCheckInAt: string | null;
      };
      lastVisitedGym?: any;
    }>('/member-portal/dashboard'),

  getMyPlan: () =>
    api.get<Member>('/member-portal/plan'),

  getFitPrimePlans: () =>
    api.get<Plan[]>('/member-portal/fitprime-plans'),

  getPartnerGyms: () =>
    api.get<any[]>('/member-portal/gyms'),

  getMyAttendance: () =>
    api.get<Attendance[]>('/member-portal/attendance'),

  getMyPayments: () =>
    api.get<Payment[]>('/member-portal/payments'),

  getClasses: () =>
    api.get<GymClass[]>('/member-portal/classes'),

  bookClass: (classId: string) =>
    api.post<{ message: string; seatsAvailable: number }>(`/member-portal/classes/${classId}/book`),

  cancelClassBooking: (classId: string) =>
    api.delete<{ message: string; seatsAvailable: number }>(`/member-portal/classes/${classId}/book`),

  createPaymentOrder: (amount?: number) =>
    api.post<RazorpayOrder>('/member-portal/payment/create-order', amount ? { amount } : {}),

  verifyPayment: (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    amount_paid: number;
  }) =>
    api.post<PaymentVerification>('/member-portal/payment/verify', data as unknown as Record<string, unknown>),

  purchasePlanOrder: (planId: string) =>
    api.post<RazorpayOrder>('/member-portal/purchase-plan/create-order', { planId }),

  verifyPlanPurchase: (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    planId: string;
  }) =>
    api.post<{ success: boolean; message: string; plan: Plan }>('/member-portal/purchase-plan/verify', data as unknown as Record<string, unknown>),

  cancelPlan: () =>
    api.post<{ success: boolean; message: string }>('/member-portal/plan/cancel', {}),

  // --- FitPrime session check-in ---

  // Scan a gym QR -> deduct 1 session instantly. Body is the parsed QR payload's gymId.
  checkIn: (gymId: string, branchId?: string, deviceInfo?: string) =>
    api.post<{
      success: boolean;
      message: string;
      sessionsRemaining: number;
      sessionStartsAt: string;
      sessionEndsAt: string;
      cooldownEndsAt: string;
      gym: { id: string; name: string };
      branch?: { id: string; name: string };
    }>('/member-portal/sessions/check-in', { gymId, branchId, deviceInfo }),

  // Current session state (active session, cooldown, sessions remaining).
  getSessionStatus: () =>
    api.get<{
      success: boolean;
      sessionsRemaining: number;
      active: boolean;
      sessionEndsAt: string | null;
      currentSessionGymId: string | null;
      inCooldown: boolean;
      cooldownEndsAt: string | null;
      lastCheckInAt: string | null;
    }>('/member-portal/sessions/status'),

  // Member's check-in history.
  getSessionHistory: () =>
    api.get<{ success: boolean; history: SessionCheckIn[] }>('/member-portal/sessions/history'),
};
