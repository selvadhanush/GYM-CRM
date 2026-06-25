import { api } from './api';
import type { DashboardStats, PaginatedMembers, Attendance } from '@/types';

export const adminService = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    return await api.get('/dashboard/stats');
  },

  getHistory: async (period: string, date?: string): Promise<{ success: boolean, data: any[] }> => {
    let url = `/dashboard/history?period=${period}`;
    if (date) url += `&date=${date}`;
    return await api.get(url);
  },

  getMembers: async (page = 1, limit = 20, search = ''): Promise<PaginatedMembers> => {
    return await api.get(`/members?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
  },

  getTodayAttendance: async (): Promise<Attendance[]> => {
    return await api.get('/attendance/today');
  },

  getPlans: async (): Promise<any[]> => {
    return await api.get('/plans');
  },
  createPlan: async (planData: any): Promise<any> => {
    return await api.post('/plans', planData);
  },
  updatePlan: async (id: string, planData: any): Promise<any> => {
    return await api.put(`/plans/${id}`, planData);
  },
  deletePlan: async (id: string): Promise<any> => {
    return await api.delete(`/plans/${id}`);
  },

  getPartneredGyms: async (): Promise<any[]> => {
    return await api.get('/gyms/partnered');
  },

  uploadGymImages: async (assets: { uri: string, name: string, type: string }[]): Promise<{ message: string, images: string[] }> => {
    const FileSystem = require('expo-file-system/legacy');
    const { useAuthStore } = require('@/stores/auth');
    const { Platform } = require('react-native');
    
    const token = useAuthStore.getState().token;
    if (!token) throw new Error('Authentication required');

    const API_URL = process.env.EXPO_PUBLIC_API_URL;
    const BASE_URL = API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api');

    let finalImages: string[] = [];
    let finalMessage = 'Images uploaded successfully';

    // Upload sequentially to avoid backend race conditions and bypass RN FormData bugs
    for (const asset of assets) {
      const response = await FileSystem.uploadAsync(`${BASE_URL}/gyms/images`, asset.uri, {
        httpMethod: 'POST',
        uploadType: 1, // FileSystemUploadType.MULTIPART
        fieldName: 'images',
        mimeType: asset.type,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status >= 200 && response.status < 300) {
        const body = JSON.parse(response.body);
        finalImages = body.images;
        finalMessage = body.message || finalMessage;
      } else {
        let msg = 'Upload failed';
        try {
          msg = JSON.parse(response.body).message || msg;
        } catch {}
        throw new Error(msg);
      }
    }

    return { message: finalMessage, images: finalImages };
  },

  updateGymImages: async (images: string[]): Promise<{ message: string, images: string[] }> => {
    return await api.put('/gyms/images', { images });
  },

  // Attendance
  markAttendance: async (memberId: string): Promise<any> => {
    return await api.post('/attendance', { memberId });
  },
  getMemberAttendance: async (memberId: string): Promise<any[]> => {
    return await api.get(`/attendance/member/${memberId}`);
  },

  // Payments
  getPaymentsList: async (): Promise<any[]> => {
    return await api.get('/payments');
  },
  createPayment: async (paymentData: any): Promise<any> => {
    return await api.post('/payments', paymentData);
  },
  getMemberPayments: async (memberId: string): Promise<any[]> => {
    return await api.get(`/payments/member/${memberId}`);
  },

  // Expenses
  getExpenses: async (): Promise<any[]> => {
    return await api.get('/expenses');
  },
  createExpense: async (expenseData: any): Promise<any> => {
    return await api.post('/expenses', expenseData);
  },
  deleteExpense: async (id: string): Promise<any> => {
    return await api.delete(`/expenses/${id}`);
  },

  // Dues
  getDues: async (): Promise<any[]> => {
    return await api.get('/dues');
  },

  // Freeze requests
  getFreezeRequests: async (): Promise<any[]> => {
    return await api.get('/freeze');
  },
  approveFreeze: async (id: string): Promise<any> => {
    return await api.put(`/freeze/${id}/approve`);
  },
  rejectFreeze: async (id: string): Promise<any> => {
    return await api.put(`/freeze/${id}/reject`);
  },
  freezeMember: async (memberId: string, data: { reason?: string }): Promise<any> => {
    return await api.post(`/members/${memberId}/freeze`, data);
  },
  unfreezeMember: async (memberId: string): Promise<any> => {
    return await api.post(`/members/${memberId}/unfreeze`);
  },
  getFreezeHistory: async (memberId: string): Promise<any> => {
    return await api.get(`/members/${memberId}/freeze-history`);
  },

  // Classes
  getClasses: async (): Promise<any[]> => {
    return await api.get('/classes');
  },
  createClass: async (classData: any): Promise<any> => {
    return await api.post('/classes', classData);
  },
  updateClass: async (id: string, classData: any): Promise<any> => {
    return await api.put(`/classes/${id}`, classData);
  },
  deleteClass: async (id: string): Promise<any> => {
    return await api.delete(`/classes/${id}`);
  },

  // Leads
  getLeads: async (): Promise<any[]> => {
    return await api.get('/leads');
  },
  getLeadsSummary: async (): Promise<any> => {
    return await api.get('/leads/summary');
  },
  createLead: async (leadData: any): Promise<any> => {
    return await api.post('/leads', leadData);
  },
  updateLead: async (id: string, leadData: any): Promise<any> => {
    return await api.put(`/leads/${id}`, leadData);
  },
  deleteLead: async (id: string): Promise<any> => {
    return await api.delete(`/leads/${id}`);
  },

  // Branches
  getBranches: async (): Promise<any[]> => {
    return await api.get('/branches');
  },
  createBranch: async (branchData: any): Promise<any> => {
    return await api.post('/branches', branchData);
  },
  updateBranch: async (id: string, branchData: any): Promise<any> => {
    return await api.put(`/branches/${id}`, branchData);
  },
  deleteBranch: async (id: string): Promise<any> => {
    return await api.delete(`/branches/${id}`);
  },
  getBranchMembers: async (branchId: string): Promise<any[]> => {
    return await api.get(`/branches/${branchId}/members`);
  },

  // Staff
  getStaff: async (): Promise<any[]> => {
    return await api.get('/staff');
  },
  createStaff: async (staffData: any): Promise<any> => {
    return await api.post('/staff', staffData);
  },
  updateStaff: async (id: string, staffData: any): Promise<any> => {
    return await api.put(`/staff/${id}`, staffData);
  },
  deleteStaff: async (id: string): Promise<any> => {
    return await api.delete(`/staff/${id}`);
  },

  // Body Assessments
  getBodyAssessments: async (memberId = ''): Promise<any[]> => {
    const url = memberId ? `/body-assessments?memberId=${memberId}` : '/body-assessments';
    return await api.get(url);
  },
  createBodyAssessment: async (data: any): Promise<any> => {
    return await api.post('/body-assessments', data);
  },
  updateBodyAssessment: async (id: string, data: any): Promise<any> => {
    return await api.put(`/body-assessments/${id}`, data);
  },
  deleteBodyAssessment: async (id: string): Promise<any> => {
    return await api.delete(`/body-assessments/${id}`);
  },

  // Trainer Attendance
  getTrainerAttendance: async (trainerId = ''): Promise<any[]> => {
    const url = trainerId ? `/trainer-attendance?trainerId=${trainerId}` : '/trainer-attendance';
    return await api.get(url);
  },
  trainerCheckIn: async (trainerId = ''): Promise<any> => {
    return await api.post('/trainer-attendance/checkin', trainerId ? { trainerId } : {});
  },
  trainerCheckOut: async (trainerId = ''): Promise<any> => {
    return await api.post('/trainer-attendance/checkout', trainerId ? { trainerId } : {});
  },

  // Payroll
  getSalaryStructure: async (trainerId: string): Promise<any> => {
    return await api.get(`/payroll/salary-structure/${trainerId}`);
  },
  upsertSalaryStructure: async (salaryData: any): Promise<any> => {
    return await api.post('/payroll/salary-structure', salaryData);
  },
  getPayrolls: async (params: any = {}): Promise<any[]> => {
    let url = '/payroll';
    const query = [];
    if (params.trainerId) query.push(`trainerId=${params.trainerId}`);
    if (params.month) query.push(`month=${params.month}`);
    if (params.year) query.push(`year=${params.year}`);
    if (query.length > 0) url += `?${query.join('&')}`;
    return await api.get(url);
  },
  generatePayroll: async (payrollData: any): Promise<any> => {
    return await api.post('/payroll/generate', payrollData);
  },
  updatePayroll: async (id: string, payrollData: any): Promise<any> => {
    return await api.put(`/payroll/${id}`, payrollData);
  },
  addCommission: async (commissionData: any): Promise<any> => {
    return await api.post('/payroll/commission', commissionData);
  },

  // Equipments
  getEquipments: async (params: any = {}): Promise<any[]> => {
    let url = '/equipments';
    const query = [];
    if (params.status) query.push(`status=${params.status}`);
    if (params.type) query.push(`type=${params.type}`);
    if (query.length > 0) url += `?${query.join('&')}`;
    return await api.get(url);
  },
  createEquipment: async (data: any): Promise<any> => {
    return await api.post('/equipments', data);
  },
  updateEquipment: async (id: string, data: any): Promise<any> => {
    return await api.put(`/equipments/${id}`, data);
  },
  deleteEquipment: async (id: string): Promise<any> => {
    return await api.delete(`/equipments/${id}`);
  },
  getMaintenanceLogs: async (params: any = {}): Promise<any[]> => {
    let url = '/equipments/maintenance/logs';
    if (params.equipmentId) url += `?equipmentId=${params.equipmentId}`;
    return await api.get(url);
  },
  createMaintenanceLog: async (data: any): Promise<any> => {
    return await api.post('/equipments/maintenance', data);
  },
  deleteMaintenanceLog: async (id: string): Promise<any> => {
    return await api.delete(`/equipments/maintenance/${id}`);
  },

  // Analytics
  getAnalytics: async (): Promise<any> => {
    return await api.get('/analytics');
  },
};
