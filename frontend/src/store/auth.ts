import { create } from 'zustand';
import type { User } from '../types';
import api from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,

  login: (token: string, user: User) => {
    localStorage.setItem('token', token);
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    set({ user: null, token: null, isAuthenticated: false });
  },

  fetchUser: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get<User>('/users/me');
      set({ user: data });
    } catch (error) {
      set({ user: null, token: null, isAuthenticated: false });
      localStorage.removeItem('token');
    } finally {
      set({ isLoading: false });
    }
  },

  updateUser: (data: Partial<User>) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...data } : null,
    }));
  },
}));
