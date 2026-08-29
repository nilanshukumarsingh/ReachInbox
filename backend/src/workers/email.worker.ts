import { Worker, Job } from 'bullmq';
import { getRedisConnection } from '../lib/redis';
import { prisma } from '../lib/prisma';
import { smtpService } from '../services/smtp.service';
import { slackService } from '../services/slack.service';
import { EMAIL_QUEUE_NAME, EmailJobData, getEmailQueue } from '../services/queue.service';
import { config } from '../config';

function getCurrentHourWindow(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}-${String(d.getUTCHours()).padStart(2, '0')}`;
}

function getMsUntilNextHourWindow(): number {
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setUTCHours(nextHour.getUTCHours() + 1, 0, 0, 0);
  return Math.max(1000, nextHour.getTime() - now.getTime() + 1000); // 1s buffer into next hour
}

let emailWorkerInstance: Worker<EmailJobData> | null = null;

export function initEmailWorker(): Worker<EmailJobData> {
  if (emailWorkerInstance) {
    return emailWorkerInstance;
  }

  const redis = getRedisConnection();

  emailWorkerInstance = new Worker<EmailJobData>(
    EMAIL_QUEUE_NAME,
    async (job: Job<EmailJobData>) => {
      const { emailJobId, senderEmail, recipientEmail, recipientName, subject, body, hourlyLimit, delaySeconds, userId } = job.data;
      console.log(`\n⏳ [Worker Job Started] Processing email ${emailJobId} -> ${recipientEmail} from ${senderEmail}`);

      // 1. Check if email was already marked SENT (Idempotency)
      const existingRecord = await prisma.emailJob.findUnique({
        where: { id: emailJobId },
      });

      if (!existingRecord) {
        console.warn(`⚠️ [Worker] Email record ${emailJobId} not found in DB. Skipping.`);
        return { skipped: true, reason: 'NOT_FOUND' };
      }

      if (existingRecord.status === 'SENT') {
        console.log(`✅ [Worker] Email ${emailJobId} is already marked as SENT. Skipping duplicate execution.`);
        return { skipped: true, reason: 'ALREADY_SENT' };
      }

      // 2. Check Hourly Rate Limit
      const windowHour = getCurrentHourWindow();
      const effectiveHourlyLimit = hourlyLimit || config.defaultHourlyLimit;

      // Atomic Rate Limit tracking via DB / Redis
      let rateLimitLog = await prisma.rateLimitLog.findUnique({
        where: {
          senderEmail_windowHour: {
            senderEmail,
            windowHour,
          },
        },
      });

      const currentCount = rateLimitLog ? rateLimitLog.count : 0;

      if (currentCount >= effectiveHourlyLimit) {
        console.warn(`🚨 [Rate Limit Reached] Sender ${senderEmail} has hit the hourly limit of ${effectiveHourlyLimit} emails in window ${windowHour}.`);
        
        const delayUntilNextHour = getMsUntilNextHourWindow();
        const nextScheduledDate = new Date(Date.now() + delayUntilNextHour);

        // Update DB status to RATE_LIMITED & reschedule time
        await prisma.emailJob.update({
          where: { id: emailJobId },
          data: {
            status: 'RATE_LIMITED',
            scheduledAt: nextScheduledDate,
          },
        });

        // Trigger live Slack Alert if not already notified for this window
        if (!rateLimitLog?.slackNotified) {
          console.log(`📣 [Worker] Triggering Slack Alert for sender rate limit hit...`);
          const alertSent = await slackService.sendRateLimitAlert({
            userId,
            senderEmail,
            hourlyLimit: effectiveHourlyLimit,
            currentCount,
            nextAvailableWindow: nextScheduledDate.toISOString(),
          });

          if (alertSent) {
            await prisma.rateLimitLog.upsert({
              where: {
                senderEmail_windowHour: { senderEmail, windowHour },
              },
              create: {
                senderEmail,
                windowHour,
                count: currentCount + 1,
                slackNotified: true,
              },
              update: {
                count: { increment: 1 },
                slackNotified: true,
              },
            });
          }
        }

        // Reschedule job in BullMQ to next window
        const queue = getEmailQueue();
        await queue.add(
          `send-email-${emailJobId}-rescheduled`,
          {
            ...job.data,
            scheduledAt: nextScheduledDate.toISOString(),
          },
          {
            delay: delayUntilNextHour,
            jobId: `job-${emailJobId}-rescheduled-${Date.now()}`,
          }
        );

        console.log(`⏰ [Rescheduled] Job for ${recipientEmail} postponed by ${Math.round(delayUntilNextHour / 60000)} minutes.`);
        return { rateLimited: true, rescheduledAt: nextScheduledDate };
      }

      // 3. Increment Rate Limit counter
      await prisma.rateLimitLog.upsert({
        where: {
          senderEmail_windowHour: { senderEmail, windowHour },
        },
        create: {
          senderEmail,
          windowHour,
          count: 1,
          slackNotified: false,
        },
        update: {
          count: { increment: 1 },
        },
      });

      // 4. Update status to SENDING
      await prisma.emailJob.update({
        where: { id: emailJobId },
        data: { status: 'SENDING' },
      });

      // 5. Apply inter-email delay if specified
      if (delaySeconds > 0) {
        console.log(`⏸️ [Throttling] Enforcing delay of ${delaySeconds}s before dispatching...`);
        await new Promise((res) => setTimeout(res, delaySeconds * 1000));
      }

      // 6. Send Email via Ethereal SMTP
      const sendResult = await smtpService.sendEmail({
        from: senderEmail,
        to: recipientEmail,
        subject,
        html: body,
      });

      // 7. Update Database with result
      if (sendResult.success) {
        await prisma.emailJob.update({
          where: { id: emailJobId },
          data: {
            status: 'SENT',
            sentAt: new Date(),
            etherealPreviewUrl: sendResult.previewUrl || null,
            errorMessage: null,
          },
        });
        console.log(`🎉 [Worker Success] Email ${emailJobId} successfully delivered to ${recipientEmail}!`);
        return { success: true, previewUrl: sendResult.previewUrl };
      } else {
        await prisma.emailJob.update({
          where: { id: emailJobId },
          data: {
            status: 'FAILED',
            errorMessage: sendResult.error || 'Unknown SMTP error',
          },
        });
        console.error(`❌ [Worker Failed] Email ${emailJobId} failed: ${sendResult.error}`);
        throw new Error(sendResult.error || 'SMTP delivery failed');
      }
    },
    {
      connection: redis,
      concurrency: config.workerConcurrency,
      limiter: {
        max: 10,
        duration: 1000,
      },
    }
  );

  emailWorkerInstance.on('completed', (job) => {
    console.log(`✅ [BullMQ Worker] Job ${job.id} completed.`);
  });

  emailWorkerInstance.on('failed', (job, err) => {
    console.error(`❌ [BullMQ Worker] Job ${job?.id} failed with error: ${err.message}`);
  });

  console.log(`⚡ [Worker] BullMQ Email Worker started with concurrency: ${config.workerConcurrency}`);
  return emailWorkerInstance;
}
