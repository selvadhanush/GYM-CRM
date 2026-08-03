import API from './api';

export const discoveryService = {
    // Public / Member Endpoints
    getPublicGyms: (params = {}) => API.get('/discovery/gyms', { params }),
    getPublicGymDetails: (gymId, params = {}) => API.get(`/discovery/gyms/${gymId}`, { params }),
    getPublicPostsFeed: () => API.get('/discovery/posts'),

    // Gym Admin Profile & Post Management
    getMyGymProfile: () => API.get('/discovery/my-profile'),
    updateMyGymProfile: (data) => API.put('/discovery/my-profile', data),

    getMyGymPosts: () => API.get('/discovery/my-posts'),
    createMyGymPost: (data) => API.post('/discovery/my-posts', data),
    updateMyGymPost: (postId, data) => API.put(`/discovery/my-posts/${postId}`, data),
    deleteMyGymPost: (postId) => API.delete(`/discovery/my-posts/${postId}`),

    // Admin Approval Workflow
    getAdminApprovalQueue: () => API.get('/discovery/admin/approval-queue'),
    reviewProfileStatus: (gymId, status, rejectionReason = '') => API.patch(`/discovery/admin/profiles/${gymId}/status`, { status, rejectionReason }),
    reviewPostStatus: (postId, status, rejectionReason = '') => API.patch(`/discovery/admin/posts/${postId}/status`, { status, rejectionReason }),

    // Analytics
    getAnalytics: () => API.get('/discovery/analytics')
};
