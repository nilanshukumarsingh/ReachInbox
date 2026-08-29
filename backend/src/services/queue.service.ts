import { Queue, Job } from 'bullmq';
import { getRedisConnection } from '../lib/redis';
import { prisma } from '../lib/prisma';
import { config } from '../config';

export interface EmailJobData {
  emailJobId: string;
  userId?: string | null;
  senderEmail: string;
  recipientEmail: string;
  recipientName?: string | null;
  subject: string;
  body: string;
  delaySeconds: number;
  hourlyLimit: number;
  scheduledAt: string;
}

export const EMAIL_QUEUE_NAME = 'email-scheduler-queue';

let emailQueueInstance: Queue<EmailJobData> | null = null;

export function getEmailQueue(): Queue<EmailJobData> {
  if (emailQueueInstance) {
    return emailQueueInstance;
  }

  const redis = getRedisConnection();
  emailQueueInstance = new Queue<EmailJobData>(EMAIL_QUEUE_NAME, {
    connection: redis,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: false,
      removeOnFail: false,
    },
  });

  console.log(`🚀 [Queue] BullMQ Queue '${EMAIL_QUEUE_NAME}' initialized.`);
  return emailQueueInstance;
}

export class QueueService {
  /**
   * Schedule a single email job into BullMQ
   */
  public async scheduleJob(data: EmailJobData, delayMs: number): Promise<Job<EmailJobData> | null> {
    try {
      const queue = getEmailQueue();
      const job = await queue.add(`send-email-${data.emailJobId}`, data, {
        delay: Math.max(0, delayMs),
        jobId: `job-${data.emailJobId}`,
      });

      // Update database record with BullMQ job ID
      await prisma.emailJob.update({
        where: { id: data.emailJobId },
        data: { bullJobId: job.id },
      });

      return job;
    } catch (error: any) {
      console.error(`❌ [Queue Error] Failed to enqueue job for ${data.emailJobId}:`, error.message);
      return null;
    }
  }

  /**
   * Batch schedule multiple emails with inter-email delay and start time
   */
  public async batchSchedule(
    items: Array<{
      emailJobId: string;
      userId?: string | null;
      senderEmail: string;
      recipientEmail: string;
      recipientName?: string | null;
      subject: string;
      body: string;
      delaySeconds: number;
      hourlyLimit: number;
      scheduledAt: Date;
    }>
  ) {
    const queue = getEmailQueue();
    const now = Date.now();

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const targetTime = item.scheduledAt.getTime();
      // Incremental delay for batch to space them out
      const staggerDelayMs = i * (item.delaySeconds * 1000);
      const totalDelayMs = Math.max(0, targetTime - now + staggerDelayMs);

      const jobData: EmailJobData = {
        emailJobId: item.emailJobId,
        userId: item.userId,
        senderEmail: item.senderEmail,
        recipientEmail: item.recipientEmail,
        recipientName: item.recipientName,
        subject: item.subject,
        body: item.body,
        delaySeconds: item.delaySeconds,
        hourlyLimit: item.hourlyLimit,
        scheduledAt: new Date(targetTime + staggerDelayMs).toISOString(),
      };

      try {
        const job = await queue.add(`send-email-${item.emailJobId}`, jobData, {
          delay: totalDelayMs,
          jobId: `job-${item.emailJobId}`,
        });

        await prisma.emailJob.update({
          where: { id: item.emailJobId },
          data: {
            bullJobId: job.id,
            scheduledAt: new Date(targetTime + staggerDelayMs),
          },
        });
      } catch (err: any) {
        console.error(`❌ [Queue Batch Error] Failed for ${item.emailJobId}:`, err.message);
      }
    }
  }

  /**
   * Recover all pending/scheduled jobs on server restart (Ensures Persistence)
   */
  public async recoverPendingJobs(): Promise<void> {
    try {
      console.log('🔄 [Persistence Recovery] Checking DB for pending scheduled emails...');
      const pendingEmails = await prisma.emailJob.findMany({
        where: {
          status: { in: ['SCHEDULED', 'RATE_LIMITED'] },
        },
        orderBy: { scheduledAt: 'asc' },
      });

      if (pendingEmails.length === 0) {
        console.log('✅ [Persistence Recovery] No pending jobs to recover.');
        return;
      }

      console.log(`📦 [Persistence Recovery] Found ${pendingEmails.length} pending email jobs. Re-enqueuing into BullMQ...`);
      const queue = getEmailQueue();
      const now = Date.now();

      for (const email of pendingEmails) {
        const delayMs = Math.max(0, new Date(email.scheduledAt).getTime() - now);
        const jobData: EmailJobData = {
          emailJobId: email.id,
          userId: email.userId,
          senderEmail: email.senderEmail,
          recipientEmail: email.recipientEmail,
          recipientName: email.recipientName,
          subject: email.subject,
          body: email.body,
          delaySeconds: email.delaySeconds,
          hourlyLimit: email.hourlyLimit,
          scheduledAt: email.scheduledAt.toISOString(),
        };

        // Check if job already exists in BullMQ to maintain idempotency
        const existingJob = await queue.getJob(`job-${email.id}`);
        if (!existingJob) {
          await queue.add(`send-email-${email.id}`, jobData, {
            delay: delayMs,
            jobId: `job-${email.id}`,
          });
        }
      }

      console.log('✅ [Persistence Recovery] All pending jobs successfully synchronized with BullMQ.');
    } catch (error: any) {
      console.error('❌ [Persistence Recovery Error]:', error.message);
    }
  }

  /**
   * Retrieve live BullMQ queue stats for real-time dashboard visibility
   */
  public async getQueueStats() {
    try {
      const queue = getEmailQueue();
      const [waiting, active, delayed, completed, failed] = await Promise.all([
        queue.getWaitingCount().catch(() => 0),
        queue.getActiveCount().catch(() => 0),
        queue.getDelayedCount().catch(() => 0),
        queue.getCompletedCount().catch(() => 0),
        queue.getFailedCount().catch(() => 0),
      ]);

      const [dbScheduled, dbSent, dbFailed] = await Promise.all([
        prisma.emailJob.count({ where: { status: 'SCHEDULED' } }),
        prisma.emailJob.count({ where: { status: 'SENT' } }),
        prisma.emailJob.count({ where: { status: 'FAILED' } }),
      ]);

      return {
        bullmq: {
          waiting,
          active,
          delayed,
          completed,
          failed,
          totalQueued: waiting + active + delayed,
        },
        database: {
          scheduled: dbScheduled,
          sent: dbSent,
          failed: dbFailed,
          total: dbScheduled + dbSent + dbFailed,
        },
      };
    } catch (error: any) {
      return {
        bullmq: { waiting: 0, active: 0, delayed: 0, completed: 0, failed: 0, totalQueued: 0 },
        database: { scheduled: 0, sent: 0, failed: 0, total: 0 },
      };
    }
  }
}

export const queueService = new QueueService();
