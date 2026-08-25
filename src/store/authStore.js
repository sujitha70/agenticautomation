import { create } from 'zustand';
import api from '../lib/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  initAuth: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('agentflow_token');
      const userStr = localStorage.getItem('agentflow_user');
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          set({ user, token, isAuthenticated: true, isLoading: false });
          // Fetch fresh profile in background
          get().fetchMe();
          return;
        } catch (_) {}
      }
    }
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  fetchMe: async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data.success && res.data.user) {
        set({ user: res.data.user });
        localStorage.setItem('agentflow_user', JSON.stringify(res.data.user));
      }
    } catch (_) {
      // If token expired, clear
      get().logout();
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user, token } = res.data;
      localStorage.setItem('agentflow_token', token);
      localStorage.setItem('agentflow_user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true, isLoading: false, error: null });
      return { success: true, user };
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Login failed';
      set({ error: errorMsg, isLoading: false });
      return { success: false, error: errorMsg };
    }
  },

  register: async (name, email, password, role = 'operator') => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/register', { name, email, password, role });
      const { user, token } = res.data;
      localStorage.setItem('agentflow_token', token);
      localStorage.setItem('agentflow_user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true, isLoading: false, error: null });
      return { success: true, user };
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Registration failed';
      set({ error: errorMsg, isLoading: false });
      return { success: false, error: errorMsg };
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('agentflow_token');
      localStorage.removeItem('agentflow_user');
    }
    set({ user: null, token: null, isAuthenticated: false, error: null, isLoading: false });
  },
}));
