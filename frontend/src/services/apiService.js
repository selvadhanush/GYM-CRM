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
