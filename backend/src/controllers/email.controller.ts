import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { queueService } from '../services/queue.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class EmailController {
  /**
   * Schedule new emails (single or batch from CSV lead list)
   */
  public async scheduleEmails(req: AuthenticatedRequest, res: Response) {
    try {
      const {
        senderEmail,
        recipients, // Array of strings or comma-separated string
        subject,
        body,
        startTime,
        delayBetweenEmails = 0,
        hourlyLimit = 100,
      } = req.body;

      if (!senderEmail || !recipients || !subject || !body) {
        return res.status(400).json({ error: 'Missing required fields (senderEmail, recipients, subject, body)' });
      }

      // Format recipient list
      let recipientList: string[] = [];
      if (Array.isArray(recipients)) {
        recipientList = recipients.map((r) => String(r).trim()).filter(Boolean);
      } else if (typeof recipients === 'string') {
        recipientList = recipients.split(/[\n,;]+/).map((r) => r.trim()).filter(Boolean);
      }

      if (recipientList.length === 0) {
        return res.status(400).json({ error: 'No valid recipient email addresses provided' });
      }

      const scheduledDate = startTime ? new Date(startTime) : new Date();
      const delaySec = Math.max(0, parseInt(String(delayBetweenEmails), 10) || 0);
      const limitPerHour = Math.max(1, parseInt(String(hourlyLimit), 10) || 100);

      // Create records in database
      const createdJobs = [];
      for (const recipient of recipientList) {
        const job = await prisma.emailJob.create({
          data: {
            userId: req.user?.id || null,
            senderEmail,
            recipientEmail: recipient,
            subject,
            body,
            status: 'SCHEDULED',
            scheduledAt: scheduledDate,
            delaySeconds: delaySec,
            hourlyLimit: limitPerHour,
          },
        });
        createdJobs.push(job);
      }

      // Enqueue in BullMQ with persistent delay & spacing
      await queueService.batchSchedule(
        createdJobs.map((j) => ({
          emailJobId: j.id,
          userId: j.userId,
          senderEmail: j.senderEmail,
          recipientEmail: j.recipientEmail,
          recipientName: j.recipientName,
          subject: j.subject,
          body: j.body,
          delaySeconds: j.delaySeconds,
          hourlyLimit: j.hourlyLimit,
          scheduledAt: j.scheduledAt,
        }))
      );

      return res.status(201).json({
        success: true,
        message: `Successfully scheduled ${createdJobs.length} email(s)!`,
        count: createdJobs.length,
        jobs: createdJobs,
      });
    } catch (error: any) {
      console.error('Schedule Error:', error);
      return res.status(500).json({ error: 'Failed to schedule emails', details: error.message });
    }
  }

  /**
   * Get Scheduled Emails with search & filter
   */
  public async getScheduledEmails(req: Request, res: Response) {
    try {
      const search = (req.query.search as string) || '';
      const whereClause: any = {
        status: { in: ['SCHEDULED', 'RATE_LIMITED', 'SENDING'] },
      };

      if (search) {
        whereClause.OR = [
          { recipientEmail: { contains: search } },
          { senderEmail: { contains: search } },
          { subject: { contains: search } },
          { body: { contains: search } },
        ];
      }

      const emails = await prisma.emailJob.findMany({
        where: whereClause,
        orderBy: { scheduledAt: 'asc' },
      });

      return res.json({
        success: true,
        count: emails.length,
        emails,
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch scheduled emails', details: error.message });
    }
  }

  /**
   * Get Sent Emails with search & filter
   */
  public async getSentEmails(req: Request, res: Response) {
    try {
      const search = (req.query.search as string) || '';
      const whereClause: any = {
        status: { in: ['SENT', 'FAILED'] },
      };

      if (search) {
        whereClause.OR = [
          { recipientEmail: { contains: search } },
          { senderEmail: { contains: search } },
          { subject: { contains: search } },
          { body: { contains: search } },
        ];
      }

      const emails = await prisma.emailJob.findMany({
        where: whereClause,
        orderBy: { sentAt: 'desc' },
      });

      return res.json({
        success: true,
        count: emails.length,
        emails,
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch sent emails', details: error.message });
    }
  }

  /**
   * Star / Unstar email
   */
  public async toggleStar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const email = await prisma.emailJob.findUnique({ where: { id } });
      if (!email) return res.status(404).json({ error: 'Email not found' });

      const updated = await prisma.emailJob.update({
        where: { id },
        data: { isStarred: !email.isStarred },
      });

      return res.json({ success: true, isStarred: updated.isStarred });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to star email', details: error.message });
    }
  }

  /**
   * Delete / Cancel email
   */
  public async deleteEmail(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.emailJob.delete({ where: { id } });
      return res.json({ success: true, message: 'Email deleted' });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to delete email', details: error.message });
    }
  }

  /**
   * Real-time BullMQ & DB queue stats
   */
  public async getStats(req: Request, res: Response) {
    try {
      const stats = await queueService.getQueueStats();
      return res.json({ success: true, stats });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch queue stats', details: error.message });
    }
  }

  /**
   * Parse CSV / TXT lead file
   */
  public async parseCsv(req: Request, res: Response) {
    try {
      const { content } = req.body;
      if (!content || typeof content !== 'string') {
        return res.status(400).json({ error: 'File content is required' });
      }

      // Regex to extract all valid email addresses
      const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
      const matches = content.match(emailRegex) || [];
      const uniqueEmails = Array.from(new Set(matches.map((e) => e.toLowerCase())));

      return res.json({
        success: true,
        count: uniqueEmails.length,
        emails: uniqueEmails,
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to parse CSV', details: error.message });
    }
  }
}

export const emailController = new EmailController();
