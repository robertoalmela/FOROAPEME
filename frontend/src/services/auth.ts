import api from './api';

export const authService = {
  async sendOTP(phoneNumber: string) {
    const { data } = await api.post('/auth/send-otp', { phoneNumber });
    return data;
  },

  async verifyOTP(phoneNumber: string, code: string) {
    const { data } = await api.post('/auth/verify-otp', { phoneNumber, code });
    return data;
  },

  async register(tempToken: string, dni: string, firstName: string, lastName: string) {
    const { data } = await api.post('/auth/register', { tempToken, dni, firstName, lastName });
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    return data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
  },

  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token');
    const { data } = await api.post('/auth/refresh', { refreshToken });
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    return data;
  },
};
