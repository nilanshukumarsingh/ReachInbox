export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  slackConnected?: boolean;
}

export interface EmailJob {
  id: string;
  userId?: string | null;
  senderEmail: string;
  recipientEmail: string;
  recipientName?: string | null;
  subject: string;
  body: string;
  status: 'SCHEDULED' | 'SENDING' | 'SENT' | 'FAILED' | 'RATE_LIMITED';
  scheduledAt: string;
  sentAt?: string | null;
  delaySeconds: number;
  hourlyLimit: number;
  bullJobId?: string | null;
  etherealPreviewUrl?: string | null;
  errorMessage?: string | null;
  isStarred: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QueueStats {
  bullmq: {
    waiting: number;
    active: number;
    delayed: number;
    completed: number;
    failed: number;
    totalQueued: number;
  };
  database: {
    scheduled: number;
    sent: number;
    failed: number;
    total: number;
  };
}

export interface ScheduleEmailPayload {
  senderEmail: string;
  recipients: string[];
  subject: string;
  body: string;
  startTime?: string;
  delayBetweenEmails?: number;
  hourlyLimit?: number;
}
