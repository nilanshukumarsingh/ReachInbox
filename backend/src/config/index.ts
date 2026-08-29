import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'reachinbox_secret_key_2026',
  workerConcurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
  minDelaySeconds: parseInt(process.env.MIN_DELAY_SECONDS || '2', 10),
  defaultHourlyLimit: parseInt(process.env.DEFAULT_HOURLY_LIMIT || '100', 10),
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL || '',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};
