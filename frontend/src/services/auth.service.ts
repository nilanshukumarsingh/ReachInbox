import { api } from './api';
import { User } from '../types';

export const authService = {
  async login(email?: string, password?: string): Promise<{ token: string; user: User }> {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.token) {
      localStorage.setItem('reachinbox_token', res.data.token);
      localStorage.setItem('reachinbox_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async googleLogin(userData: {
    email: string;
    name: string;
    avatar?: string;
    googleId?: string;
  }): Promise<{ token: string; user: User }> {
    const res = await api.post('/auth/google', userData);
    if (res.data.token) {
      localStorage.setItem('reachinbox_token', res.data.token);
      localStorage.setItem('reachinbox_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async getMe(): Promise<User> {
    const res = await api.get('/auth/me');
    return res.data.user;
  },

  logout() {
    localStorage.removeItem('reachinbox_token');
    localStorage.removeItem('reachinbox_user');
  },

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('reachinbox_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },
};
