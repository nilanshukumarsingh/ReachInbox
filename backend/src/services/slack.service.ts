import axios from 'axios';
import { prisma } from '../lib/prisma';
import { config } from '../config';

interface SlackAlertParams {
  userId?: string | null;
  senderEmail: string;
  hourlyLimit: number;
  currentCount: number;
  rescheduledCount?: number;
  nextAvailableWindow?: string;
}

class SlackService {
  public async sendRateLimitAlert(params: SlackAlertParams): Promise<boolean> {
    try {
      let webhookUrl = config.slackWebhookUrl;

      // Check if user has a custom Slack webhook configured
      if (params.userId) {
        const user = await prisma.user.findUnique({
          where: { id: params.userId },
        });
        if (user?.slackWebhookUrl) {
          webhookUrl = user.slackWebhookUrl;
        }
      }

      if (!webhookUrl) {
        console.log(`ℹ️ [Slack] No Slack webhook configured for user/system. Alert skipped for ${params.senderEmail}.`);
        return false;
      }

      const payload = {
        text: `⚠️ *Rate Limit Warning - ReachInbox Email Scheduler*`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🚨 Sender Hourly Rate Limit Reached',
              emoji: true,
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Sender:*\n\`${params.senderEmail}\``,
              },
              {
                type: 'mrkdwn',
                text: `*Hourly Limit:*\n\`${params.hourlyLimit} emails/hr\``,
              },
              {
                type: 'mrkdwn',
                text: `*Sent in Window:*\n\`${params.currentCount} emails\``,
              },
              {
                type: 'mrkdwn',
                text: `*Rescheduled to:*\n\`Next hour window\``,
              },
            ],
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `⚡ *System Status:* Queue jobs are delayed safely to prevent spam flag. No jobs were dropped. • ${new Date().toLocaleTimeString()}`,
              },
            ],
          },
        ],
      };

      await axios.post(webhookUrl, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
      });

      console.log(`📣 [Slack Notification] Rate limit alert successfully dispatched for ${params.senderEmail}!`);
      return true;
    } catch (error: any) {
      console.error(`❌ [Slack Error] Failed to send Slack alert: ${error.message}`);
      return false;
    }
  }

  public async sendTestNotification(webhookUrl: string): Promise<boolean> {
    try {
      const payload = {
        text: '✅ *ReachInbox Slack Integration Connected!*',
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🎉 Slack Notifications Connected',
              emoji: true,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: 'Your ReachInbox Email Scheduler is now linked to this Slack channel. You will receive immediate real-time alerts whenever a sender reaches their hourly rate limit.',
            },
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `🕒 Connected on ${new Date().toLocaleString()}`,
              },
            ],
          },
        ],
      };

      await axios.post(webhookUrl, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
      });

      return true;
    } catch (error: any) {
      console.error(`❌ [Slack Test Error] Failed to send test notification: ${error.message}`);
      throw new Error(`Slack test notification failed: ${error.message}`);
    }
  }
}

export const slackService = new SlackService();
