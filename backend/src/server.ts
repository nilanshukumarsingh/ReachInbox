import express from 'express';
import cors from 'cors';
import { config } from './config';
import authRoutes from './routes/auth.routes';
import emailRoutes from './routes/email.routes';
import slackRoutes from './routes/slack.routes';
import { initEmailWorker } from './workers/email.worker';
import { queueService } from './services/queue.service';
import { smtpService } from './services/smtp.service';

const app = express();

// Middlewares
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ReachInbox Email Job Scheduler',
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/slack', slackRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Bootstrap Server & Worker
const server = app.listen(config.port, async () => {
  console.log(`\n=================================================`);
  console.log(`🚀 [ReachInbox Server] Listening on http://localhost:${config.port}`);
  console.log(`📧 [Scheduler] Initializing BullMQ Worker & SMTP...`);
  console.log(`=================================================\n`);

  try {
    // 1. Initialize Ethereal fake SMTP
    await smtpService.getTransporter();

    // 2. Start BullMQ Background Worker
    initEmailWorker();

    // 3. Recover any pending jobs across server restart
    await queueService.recoverPendingJobs();

    console.log(`\n✅ [System Ready] Email Scheduler is running smoothly!\n`);
  } catch (error: any) {
    console.error('⚠️ [Startup Warning]:', error.message);
  }
});

// Graceful Shutdown
const shutdown = async () => {
  console.log('\n🛑 [Server] Gracefully shutting down...');
  server.close(() => {
    console.log('✅ [Server] Closed HTTP server.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app;
