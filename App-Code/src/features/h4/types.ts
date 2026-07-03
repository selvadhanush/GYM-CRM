// H4 Member feature types
// AGENTS.md §4 — feature-level types file

export interface H4Plan {
  planName: string | null;
  expiryDate: string | null;
  status: 'Active' | 'Expired' | 'Inactive';
  startDate: string | null;
  price: number | null;
}

export interface H4AttendanceRecord {
  id: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
}

export interface H4PaymentRecord {
  id: string;
  date: string;
  amount: number;
  method: string;
  planName?: string;
  status: string;
}

export interface H4DashboardData {
  plan: H4Plan;
  attendanceCount: number;
  recentAttendance: H4AttendanceRecord[];
  recentPayments: H4PaymentRecord[];
}
