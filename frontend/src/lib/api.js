import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
});

// Add token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Handle 401 errors - redirect to login
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.clear();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;

// Auth API
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getCurrentUser: () => api.get('/users/me'),
};

// User API
export const userAPI = {
    getProfile: () => api.get('/users/me'),
    updateProfile: (data) => api.put('/users/me', data),
    getUserById: (id) => api.get(`/users/${id}`),
    listUsers: (params) => api.get('/users', { params }),
};

// Skills API
export const skillsAPI = {
    getCategories: () => api.get('/skills/categories'),
    getSkills: (params) => api.get('/skills', { params }),
};

// Services API
export const servicesAPI = {
    listServices: (params) => api.get('/services', { params }),
    getService: (id) => api.get(`/services/${id}`),
    createService: (data) => api.post('/services', data),
    updateService: (id, data) => api.put(`/services/${id}`, data),
    deleteService: (id) => api.delete(`/services/${id}`),
    getMyServices: (params) => api.get('/services/my-services', { params }),
};

// Orders API
export const ordersAPI = {
    listOrders: (params) => api.get('/orders', { params }),
    getOrder: (id) => api.get(`/orders/${id}`),
    createOrder: (data) => api.post('/orders', data),
    updateOrderStatus: (id, data) => api.put(`/orders/${id}/status`, data),
    updatePayment: (id, data) => api.put(`/orders/${id}/payment`, data),
};

// Reviews API
export const reviewsAPI = {
    getServiceReviews: (serviceId, params) => api.get(`/reviews/service/${serviceId}`, { params }),
    getUserReviews: (userId, params) => api.get(`/reviews/user/${userId}`, { params }),
    createReview: (data) => api.post('/reviews', data),
    addResponse: (id, data) => api.post(`/reviews/${id}/response`, data),
};

// Admin API
export const adminAPI = {
    getStats: () => api.get('/admin/stats'),
    listUsers: (params) => api.get('/admin/users', { params }),
    updateUserStatus: (id, status) => api.put(`/admin/users/${id}/status`, null, { params: { new_status: status } }),
    updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, null, { params: { new_role: role } }),
    deleteUser: (id) => api.delete(`/admin/users/${id}`),
    listServices: (params) => api.get('/admin/services', { params }),
    deleteService: (id) => api.delete(`/admin/services/${id}`),
};

// Chat API
export const chatAPI = {
    listConversations: () => api.get('/chat/conversations'),
    createConversation: (data) => api.post('/chat/conversations', data),
    getMessages: (conversationId, params) => api.get(`/chat/conversations/${conversationId}/messages`, { params }),
    sendMessage: (conversationId, data) => api.post(`/chat/conversations/${conversationId}/messages`, data),
    markAsRead: (conversationId) => api.put(`/chat/conversations/${conversationId}/read`),
    getUnreadCount: () => api.get('/chat/unread-count'),
};

// Portfolio API
export const portfolioAPI = {
    getUserPortfolio: (userId) => api.get(`/portfolio/user/${userId}`),
    addProject: (data) => api.post('/portfolio', data),
    deleteProject: (id) => api.delete(`/portfolio/${id}`),
};

// Upload API
export const uploadAPI = {
    uploadFile: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
};

