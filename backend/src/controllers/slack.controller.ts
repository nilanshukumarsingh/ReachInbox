import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { slackService } from '../services/slack.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { config } from '../config';

export class SlackController {
  /**
   * Connect Slack incoming webhook or OAuth token
   */
  public async connectSlack(req: AuthenticatedRequest, res: Response) {
    try {
      const { webhookUrl } = req.body;

      if (!webhookUrl) {
        return res.status(400).json({ error: 'Webhook URL is required' });
      }

      // Test webhook
      await slackService.sendTestNotification(webhookUrl);

      if (req.user?.id) {
        await prisma.user.update({
          where: { id: req.user.id },
          data: {
            slackWebhookUrl: webhookUrl,
            slackConnectedAt: new Date(),
          },
        });
      }

      // Also set system-level webhook
      config.slackWebhookUrl = webhookUrl;

      return res.json({
        success: true,
        message: 'Slack successfully connected! Test alert dispatched.',
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Failed to connect Slack' });
    }
  }

  /**
   * Send test rate-limit alert to Slack
   */
  public async triggerTestAlert(req: AuthenticatedRequest, res: Response) {
    try {
      const { senderEmail = 'oliver.brown@domain.io' } = req.body;
      const alertSent = await slackService.sendRateLimitAlert({
        userId: req.user?.id || null,
        senderEmail,
        hourlyLimit: 5,
        currentCount: 5,
        nextAvailableWindow: new Date(Date.now() + 3600000).toISOString(),
      });

      if (!alertSent) {
        return res.status(400).json({
          success: false,
          message: 'No Slack webhook configured. Connect a webhook first!',
        });
      }

      return res.json({
        success: true,
        message: 'Live Rate-Limit Alert sent to your Slack channel!',
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Disconnect Slack
   */
  public async disconnectSlack(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user?.id) {
        await prisma.user.update({
          where: { id: req.user.id },
          data: {
            slackWebhookUrl: null,
            slackConnectedAt: null,
          },
        });
      }
      config.slackWebhookUrl = '';

      return res.json({ success: true, message: 'Slack disconnected' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get Slack connection status
   */
  public async getStatus(req: AuthenticatedRequest, res: Response) {
    try {
      let isConnected = !!config.slackWebhookUrl;

      if (req.user?.id) {
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        isConnected = !!user?.slackWebhookUrl || isConnected;
      }

      return res.json({
        connected: isConnected,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}

export const slackController = new SlackController();
