import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

const client = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

class ApiService {
  async getUserByTelegram(telegramId: string) {
    const { data } = await client.post('/auth/telegram-user', { telegramId });
    return data.user || null;
  }

  async loginAsBot(userId: string) {
    const { data } = await client.post('/auth/bot-login', {
      userId,
      botSecret: process.env.BOT_SECRET,
    });
    return data.token;
  }

  async generateLinkCode(telegramId: string) {
    const { data } = await client.post('/auth/generate-link-code', { telegramId });
    return data;
  }

  async getActivePolls() {
    const { data } = await client.get('/polls/active');
    return Array.isArray(data) ? data : data.polls || [];
  }

  async getPollResults(pollId: string, userId: string) {
    const token = await this.loginAsBot(userId);
    const { data } = await client.get(`/polls/${pollId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  }

  async castVote(pollId: string, optionIds: string[], token: string) {
    const { data } = await client.post(
      `/polls/${pollId}/vote`,
      { optionIds },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data;
  }

  async getLatestThreads() {
    const { data } = await client.get('/forum/threads', {
      params: { limit: 10, sortBy: 'newest' },
    });
    return Array.isArray(data) ? data : data.threads || [];
  }

  async getCategories() {
    const { data } = await client.get('/forum/categories');
    return Array.isArray(data) ? data : data.categories || [];
  }

  async createThread(thread: { title: string; content: string; categoryId: string }, token: string) {
    const { data } = await client.post('/forum/threads', thread, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  }

  async getUserStats(userId: string, isAdmin: boolean) {
    try {
      if (isAdmin) {
        const { data } = await client.get('/users/me/stats');
        return data;
      }
      const { data } = await client.get('/users/me/stats');
      return data;
    } catch {
      return null;
    }
  }
}

export const api = new ApiService();
