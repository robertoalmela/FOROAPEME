import api from './api';
import type { Poll, PollResults } from '../types';

export const pollService = {
  async getPolls(params?: { status?: string; limit?: number; offset?: number }) {
    const { data } = await api.get<Poll[]>('/polls', { params });
    return data;
  },

  async getActivePolls() {
    const { data } = await api.get<Poll[]>('/polls/active');
    return data;
  },

  async getPoll(id: string) {
    const { data } = await api.get<PollResults>(`/polls/${id}`);
    return data;
  },

  async createPoll(poll: {
    title: string;
    description: string;
    pollType: string;
    options: string[];
    isAnonymous?: boolean;
    allowMultiple?: boolean;
    maxChoices?: number;
    startDate?: string;
    endDate?: string;
  }) {
    const { data } = await api.post<Poll>('/polls', poll);
    return data;
  },

  async publishPoll(id: string) {
    const { data } = await api.post<Poll>(`/polls/${id}/publish`);
    return data;
  },

  async closePoll(id: string) {
    const { data } = await api.post<Poll>(`/polls/${id}/close`);
    return data;
  },

  async deletePoll(id: string) {
    const { data } = await api.delete(`/polls/${id}`);
    return data;
  },

  async vote(pollId: string, optionIds: string[]) {
    const { data } = await api.post(`/polls/${pollId}/vote`, { optionIds });
    return data;
  },

  async getResults(id: string) {
    const { data } = await api.get<PollResults>(`/polls/${id}/results`);
    return data;
  },

  async getReport(id: string) {
    const { data } = await api.get(`/polls/${id}/report`);
    return data;
  },
};
