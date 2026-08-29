import { api } from './api';

export const slackService = {
  async connectSlack(webhookUrl: string): Promise<{ success: boolean; message: string }> {
    const res = await api.post('/slack/connect', { webhookUrl });
    return res.data;
  },

  async triggerTestAlert(senderEmail?: string): Promise<{ success: boolean; message: string }> {
    const res = await api.post('/slack/test', { senderEmail });
    return res.data;
  },

  async disconnectSlack(): Promise<{ success: boolean; message: string }> {
    const res = await api.post('/slack/disconnect');
    return res.data;
  },

  async getStatus(): Promise<{ connected: boolean }> {
    const res = await api.get('/slack/status');
    return res.data;
  },
};
