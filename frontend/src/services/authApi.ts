import { apiClient } from '@/lib/apiClient';
import type { User } from '@/types';

export interface SignupData {
  email: string;
  full_name: string;
  is_host: boolean;
  avatar_url?: string;
}

export const authApi = {
  login: (email: string) =>
    apiClient<User>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  signup: (data: SignupData) =>
    apiClient<User>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMe: () => apiClient<User>('/api/auth/me'),

  getDemoUsers: () => apiClient<User[]>('/api/auth/demo-users'),

  becomeHost: () =>
    apiClient<User>('/api/auth/become-host', {
      method: 'POST',
    }),
};
