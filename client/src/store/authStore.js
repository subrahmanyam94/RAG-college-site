import { create } from 'zustand';
import api from '../lib/api';

const getInitialUser = () => {
  try {
    const raw = localStorage.getItem('campusrag_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const initialToken = localStorage.getItem('campusrag_token') || null;

export const useAuthStore = create((set, get) => ({
  user: getInitialUser(),
  token: initialToken,
  isAuthenticated: !!initialToken,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user, token } = res.data.data;

      localStorage.setItem('campusrag_token', token);
      localStorage.setItem('campusrag_user', JSON.stringify(user));

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return { success: true, user };
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.details?.[0] ||
        'Failed to log in. Please check your credentials.';
      set({ isLoading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  register: async (formData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/register', formData);
      const { user, token } = res.data.data;

      localStorage.setItem('campusrag_token', token);
      localStorage.setItem('campusrag_user', JSON.stringify(user));

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return { success: true, user };
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.details?.[0] ||
        'Registration failed. Please check form values.';
      set({ isLoading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  fetchMe: async () => {
    if (!get().token) return;
    try {
      const res = await api.get('/auth/me');
      const user = res.data.data;
      localStorage.setItem('campusrag_user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
    } catch {
      get().logout();
    }
  },

  logout: () => {
    localStorage.removeItem('campusrag_token');
    localStorage.removeItem('campusrag_user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));

// Listen for global unauthorized event
if (typeof window !== 'undefined') {
  window.addEventListener('auth:unauthorized', () => {
    useAuthStore.getState().logout();
  });
}
