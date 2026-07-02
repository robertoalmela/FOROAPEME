import api from './api';
import type { Notification } from '../types';

export const notificationService = {
  async getNotifications(params?: { limit?: number; offset?: number; unreadOnly?: boolean }) {
    const { data } = await api.get<Notification[]>('/notifications', { params });
    return data;
  },

  async getUnreadCount() {
    const { data } = await api.get<{ count: number }>('/notifications/unread-count');
    return data;
  },

  async markAsRead(id: string) {
    const { data } = await api.post(`/notifications/${id}/read`);
    return data;
  },

  async markAllAsRead() {
    const { data } = await api.post('/notifications/read-all');
    return data;
  },

  async delete(id: string) {
    const { data } = await api.delete(`/notifications/${id}`);
    return data;
  },
};
