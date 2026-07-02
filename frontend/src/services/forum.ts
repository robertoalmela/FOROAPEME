import api from './api';
import type { Category, Thread, Reply } from '../types';

export const forumService = {
  async getCategories() {
    const { data } = await api.get<Category[]>('/forum/categories');
    return data;
  },

  async getThreads(params?: {
    categoryId?: string;
    limit?: number;
    offset?: number;
    search?: string;
    sortBy?: string;
  }) {
    const { data } = await api.get<Thread[]>('/forum/threads', { params });
    return data;
  },

  async getThread(id: string) {
    const { data } = await api.get<Thread>(`/forum/threads/${id}`);
    return data;
  },

  async createThread(thread: {
    title: string;
    content: string;
    categoryId: string;
    tags?: string[];
  }) {
    const { data } = await api.post<Thread>('/forum/threads', thread);
    return data;
  },

  async updateThread(id: string, thread: {
    title?: string;
    content?: string;
    categoryId?: string;
    tags?: string[];
  }) {
    const { data } = await api.put<Thread>(`/forum/threads/${id}`, thread);
    return data;
  },

  async deleteThread(id: string) {
    const { data } = await api.delete(`/forum/threads/${id}`);
    return data;
  },

  async togglePin(id: string) {
    const { data } = await api.post(`/forum/threads/${id}/pin`);
    return data;
  },

  async toggleLock(id: string) {
    const { data } = await api.post(`/forum/threads/${id}/lock`);
    return data;
  },

  async toggleResolve(id: string) {
    const { data } = await api.post(`/forum/threads/${id}/resolve`);
    return data;
  },

  async getReplies(threadId: string, params?: { limit?: number; offset?: number }) {
    const { data } = await api.get<Reply[]>(`/forum/threads/${threadId}/replies`, { params });
    return data;
  },

  async createReply(threadId: string, reply: {
    content: string;
    parentId?: string;
  }) {
    const { data } = await api.post<Reply>(`/forum/threads/${threadId}/replies`, reply);
    return data;
  },

  async updateReply(id: string, content: string) {
    const { data } = await api.put<Reply>(`/forum/replies/${id}`, { content });
    return data;
  },

  async deleteReply(id: string) {
    const { data } = await api.delete(`/forum/replies/${id}`);
    return data;
  },

  async search(q: string, params?: { limit?: number; offset?: number }) {
    const { data } = await api.get<Thread[]>('/forum/search', { params: { q, ...params } });
    return data;
  },

  async getTags() {
    const { data } = await api.get('/forum/tags');
    return data;
  },
};
