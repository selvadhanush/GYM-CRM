import API from './api';

export const getStats = async () => {
    const { data } = await API.get('/dashboard/stats');
    return data;
};

export const getPlans = async () => {
    const { data } = await API.get('/plans');
    return data;
};

export const createPlan = async (planData) => {
    const { data } = await API.post('/plans', planData);
    return data;
};

export const updatePlan = async (id, planData) => {
    const { data } = await API.put(`/plans/${id}`, planData);
    return data;
};

export const deletePlan = async (id) => {
    const { data } = await API.delete(`/plans/${id}`);
    return data;
};

export const getMembers = async (status = '', page = 1, search = '') => {
    let url = `/members?page=${page}`;
    if (status) url += `&status=${status}`;
    if (search) url += `&search=${search}`;
    const { data } = await API.get(url);
    return data;
};

export const createMember = async (memberData) => {
    const { data } = await API.post('/members', memberData);
    return data;
};

export const updateMember = async (id, memberData) => {
    const { data } = await API.put(`/members/${id}`, memberData);
    return data;
};

export const deleteMember = async (id) => {
    const { data } = await API.delete(`/members/${id}`);
    return data;
};

export const getMemberAuditTrail = async (id) => {
    const { data } = await API.get(`/members/${id}/audit`);
    return data;
};

export const getPayments = async () => {
    const { data } = await API.get('/payments');
    return data;
};

export const getMemberPayments = async (memberId) => {
    const { data } = await API.get(`/payments/member/${memberId}`);
    return data;
};

export const createPayment = async (paymentData) => {
    const { data } = await API.post('/payments', paymentData);
    return data;
};

export const markAttendance = async (attendanceData) => {
    const { data } = await API.post('/attendance', attendanceData);
    return data;
};

export const getTodayAttendance = async () => {
    const { data } = await API.get('/attendance/today');
    return data;
};

export const getMemberAttendance = async (memberId) => {
    const { data } = await API.get(`/attendance/member/${memberId}`);
    return data;
};

export const getStaff = async () => {
    const { data } = await API.get('/staff');
    return data;
};

export const createStaff = async (staffData) => {
    const { data } = await API.post('/staff', staffData);
    return data;
};

export const updateStaff = async (id, staffData) => {
    const { data } = await API.put(`/staff/${id}`, staffData);
    return data;
};

export const deleteStaff = async (id) => {
    const { data } = await API.delete(`/staff/${id}`);
    return data;
};

export const getBodyAssessments = async (memberId = '') => {
    const url = memberId ? `/body-assessments?memberId=${memberId}` : '/body-assessments';
    const { data } = await API.get(url);
    return data;
};

export const createBodyAssessment = async (assessmentData) => {
    const { data } = await API.post('/body-assessments', assessmentData);
    return data;
};

export const updateBodyAssessment = async (id, assessmentData) => {
    const { data } = await API.put(`/body-assessments/${id}`, assessmentData);
    return data;
};

export const deleteBodyAssessment = async (id) => {
    const { data } = await API.delete(`/body-assessments/${id}`);
    return data;
};

// Trainer Attendance
export const getTrainerAttendance = async (trainerId = '') => {
    const url = trainerId ? `/trainer-attendance?trainerId=${trainerId}` : '/trainer-attendance';
    const { data } = await API.get(url);
    return data;
};

export const trainerCheckIn = async (trainerId = '') => {
    const { data } = await API.post('/trainer-attendance/checkin', trainerId ? { trainerId } : {});
    return data;
};

export const trainerCheckOut = async (trainerId = '') => {
    const { data } = await API.post('/trainer-attendance/checkout', trainerId ? { trainerId } : {});
    return data;
};

// Payroll
export const getSalaryStructure = async (trainerId) => {
    const { data } = await API.get(`/payroll/salary-structure/${trainerId}`);
    return data;
};

export const upsertSalaryStructure = async (salaryData) => {
    const { data } = await API.post('/payroll/salary-structure', salaryData);
    return data;
};

export const getPayrolls = async (params = {}) => {
    let url = '/payroll';
    const query = [];
    if (params.trainerId) query.push(`trainerId=${params.trainerId}`);
    if (params.month) query.push(`month=${params.month}`);
    if (params.year) query.push(`year=${params.year}`);
    if (query.length > 0) url += `?${query.join('&')}`;
    
    const { data } = await API.get(url);
    return data;
};

export const generatePayroll = async (payrollData) => {
    const { data } = await API.post('/payroll/generate', payrollData);
    return data;
};

export const updatePayroll = async (id, payrollData) => {
    const { data } = await API.put(`/payroll/${id}`, payrollData);
    return data;
};

export const addCommission = async (commissionData) => {
    const { data } = await API.post('/payroll/commission', commissionData);
    return data;
};


