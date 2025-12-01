import { create } from 'zustand';
import { Profile } from '../../shared/types';
import { login as apiLogin, register as apiRegister, getAuthToken, getProfile } from '../lib/api';

interface AuthState {
  user: Profile | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, profile_type: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiLogin(email, password);
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      set({ user: response.user, token: response.token, isLoading: false, error: null });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Erro ao fazer login. Verifique suas credenciais.' 
      });
      throw error;
    }
  },

  register: async (email: string, password: string, profile_type: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiRegister(email, password, profile_type as any);
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      set({ user: response.user, token: response.token, isLoading: false, error: null });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Erro ao criar conta. Tente novamente.' 
      });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    set({ user: null, token: null, error: null });
  },

  clearError: () => {
    set({ error: null });
  },

  checkAuth: () => {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ user, token });
      } catch (error) {
        // Invalid user data, clear it
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      }
    }
  },
}));
