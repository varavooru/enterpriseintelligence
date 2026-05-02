import { create } from 'zustand';
import type { User, Tenant } from '../types';
import { api } from '../services/api';

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, fullName: string, password: string, tenantName?: string) => Promise<void>;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tenant: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.login(email, password);
      api.setToken(response.access_token);
      localStorage.setItem('auth', JSON.stringify({
        token: response.access_token,
        refreshToken: response.refresh_token,
        user: response.user,
        tenant: response.tenant,
      }));
      set({
        user: response.user, tenant: response.tenant,
        token: response.access_token, refreshToken: response.refresh_token,
        isAuthenticated: true, isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  register: async (email, fullName, password, tenantName) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.register(email, fullName, password, tenantName);
      api.setToken(response.access_token);
      localStorage.setItem('auth', JSON.stringify({
        token: response.access_token,
        refreshToken: response.refresh_token,
        user: response.user,
        tenant: response.tenant,
      }));
      set({
        user: response.user, tenant: response.tenant,
        token: response.access_token, refreshToken: response.refresh_token,
        isAuthenticated: true, isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  logout: () => {
    api.setToken(null);
    localStorage.removeItem('auth');
    set({ user: null, tenant: null, token: null, refreshToken: null, isAuthenticated: false, isLoading: false });
  },

  initialize: () => {
    const stored = localStorage.getItem('auth');
    if (stored) {
      try {
        const { token, refreshToken, user, tenant } = JSON.parse(stored);
        api.setToken(token);
        set({ user, tenant, token, refreshToken, isAuthenticated: true, isLoading: false });
      } catch {
        set({ isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },
}));
