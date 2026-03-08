import { create } from 'zustand';
import { authAPI } from '../lib/api';

const useAuthStore = create((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,

    login: async (credentials) => {
        const response = await authAPI.login(credentials);
        const { access_token, refresh_token } = response.data;

        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);

        const userResponse = await authAPI.getCurrentUser();
        set({ user: userResponse.data, isAuthenticated: true });

        return userResponse.data;
    },

    register: async (userData) => {
        const response = await authAPI.register(userData);
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, isAuthenticated: false });
    },

    checkAuth: async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            set({ isLoading: false, isAuthenticated: false });
            return;
        }

        try {
            const response = await authAPI.getCurrentUser();
            set({ user: response.data, isAuthenticated: true, isLoading: false });
        } catch (error) {
            localStorage.clear();
            set({ user: null, isAuthenticated: false, isLoading: false });
        }
    },

    updateUser: (userData) => {
        set({ user: userData });
    },
}));

export default useAuthStore;
