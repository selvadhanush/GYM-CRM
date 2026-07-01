import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Add a request interceptor to include the JWT token
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    const selectedGymId = localStorage.getItem('selectedGymId');
    if (selectedGymId) {
        config.headers['x-gym-id'] = selectedGymId;
    }
    const selectedBranchId = localStorage.getItem('selectedBranchId');
    if (selectedBranchId) {
        config.headers['x-branch-id'] = selectedBranchId;
    }
    return config;
});

// Add a response interceptor to handle 401 Unauthorized errors globally
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default API;
