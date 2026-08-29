import { api } from './api';
import { EmailJob, QueueStats, ScheduleEmailPayload } from '../types';

export const emailService = {
  async getScheduledEmails(search?: string): Promise<EmailJob[]> {
    const res = await api.get('/emails/scheduled', {
      params: { search },
    });
    return res.data.emails;
  },

  async getSentEmails(search?: string): Promise<EmailJob[]> {
    const res = await api.get('/emails/sent', {
      params: { search },
    });
    return res.data.emails;
  },

  async scheduleEmails(payload: ScheduleEmailPayload): Promise<{ success: boolean; count: number; message?: string; jobs: EmailJob[] }> {
    const res = await api.post('/emails/schedule', payload);
    return res.data;
  },

  async toggleStar(id: string): Promise<boolean> {
    const res = await api.post(`/emails/star/${id}`);
    return res.data.isStarred;
  },

  async deleteEmail(id: string): Promise<boolean> {
    const res = await api.delete(`/emails/${id}`);
    return res.data.success;
  },

  async getStats(): Promise<QueueStats> {
    const res = await api.get('/emails/stats');
    return res.data.stats;
  },

  async parseCsv(content: string): Promise<{ count: number; emails: string[] }> {
    const res = await api.post('/emails/parse-csv', { content });
    return res.data;
  },
};
