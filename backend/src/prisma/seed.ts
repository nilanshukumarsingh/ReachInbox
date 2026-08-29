import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 [Seed] Seeding database with Figma demo records...');

  // 1. Create or update Oliver Brown
  const user = await prisma.user.upsert({
    where: { email: 'oliver.brown@domain.io' },
    create: {
      email: 'oliver.brown@domain.io',
      name: 'Oliver Brown',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    update: {},
  });

  // 2. Clear existing demo data to keep it crisp
  await prisma.emailJob.deleteMany({});

  // 3. Create Scheduled Emails matching Figma
  const scheduledList = [
    {
      senderEmail: 'oliver.brown@domain.io',
      recipientEmail: 'john.smith@acme.com',
      recipientName: 'John Smith',
      subject: 'Meeting follow-up - Scheduled',
      body: 'Hi John, just wanted to follow up on our meeting yesterday regarding the new campaign outreach. Let me know if you need any additional insights.',
      status: 'SCHEDULED',
      scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // 2 days in future
      delaySeconds: 2,
      hourlyLimit: 100,
    },
    {
      senderEmail: 'oliver.brown@domain.io',
      recipientEmail: 'olive@venturehub.co',
      recipientName: 'Olive',
      subject: "Ramit, great to meet you - you'll love it",
      body: "Hi Olive, just wanted to follow up on our meeting and introduce the AI sequence capabilities we discussed.",
      status: 'SCHEDULED',
      scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4), // 4 days in future
      delaySeconds: 2,
      hourlyLimit: 100,
    },
    {
      senderEmail: 'oliver.brown@domain.io',
      recipientEmail: 'alex.carter@growthscale.io',
      recipientName: 'Alex Carter',
      subject: 'Quick question about your lead volume',
      body: 'Hi Alex, saw your recent post on scaling outbound outreach. Would love to share our scheduler benchmarks.',
      status: 'SCHEDULED',
      scheduledAt: new Date(Date.now() + 1000 * 60 * 30), // 30 mins
      delaySeconds: 2,
      hourlyLimit: 100,
    },
    {
      senderEmail: 'oliver.brown@domain.io',
      recipientEmail: 'elena.rostova@techinnovate.com',
      recipientName: 'Elena Rostova',
      subject: 'Partnership opportunity with Outbox Labs',
      body: 'Hello Elena, ReachInbox is launching our new multi-tenant email router next week.',
      status: 'SCHEDULED',
      scheduledAt: new Date(Date.now() + 1000 * 60 * 90),
      delaySeconds: 3,
      hourlyLimit: 50,
    },
    {
      senderEmail: 'oliver.brown@domain.io',
      recipientEmail: 'marcus.vance@cloudnexus.net',
      recipientName: 'Marcus Vance',
      subject: 'Product Demo: Next-gen BullMQ Queues',
      body: 'Hi Marcus, excited to show you how our system sustains 1000+ jobs without dropping state.',
      status: 'SCHEDULED',
      scheduledAt: new Date(Date.now() + 1000 * 60 * 120),
      delaySeconds: 2,
      hourlyLimit: 100,
    },
  ];

  for (const item of scheduledList) {
    await prisma.emailJob.create({
      data: {
        userId: user.id,
        ...item,
      },
    });
  }

  // 4. Create Sent Emails matching Figma
  const sentList = [
    {
      senderEmail: 'oliver.brown@domain.io',
      recipientEmail: 'sarah.wilson@enterprises.org',
      recipientName: 'Sarah Wilson',
      subject: 'Re: Project Update',
      body: 'Thanks for the update, Sarah. Looks good! We are on track for Monday deployment.',
      status: 'SENT',
      scheduledAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
      sentAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
      etherealPreviewUrl: 'https://ethereal.email/message/demo-preview-1',
    },
    {
      senderEmail: 'oliver.brown@domain.io',
      recipientEmail: 'support@reachinbox.ai',
      recipientName: 'Support',
      subject: 'Issue with login',
      body: 'I am having trouble logging in to the dashboard with my credentials. Could you check the OAuth callback?',
      status: 'SENT',
      scheduledAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
      sentAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
      etherealPreviewUrl: 'https://ethereal.email/message/demo-preview-2',
    },
    {
      senderEmail: 'oliver.brown@domain.io',
      recipientEmail: 'david.beck@horizonfin.com',
      recipientName: 'David Beck',
      subject: 'Q2 Outbound Analytics Review',
      body: 'Hi David, attached is the Q2 deliverability report for your campaign sequence.',
      status: 'SENT',
      scheduledAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      etherealPreviewUrl: 'https://ethereal.email/message/demo-preview-3',
    },
  ];

  for (const item of sentList) {
    await prisma.emailJob.create({
      data: {
        userId: user.id,
        ...item,
      },
    });
  }

  console.log(`✅ [Seed] Successfully seeded ${scheduledList.length} scheduled emails and ${sentList.length} sent emails!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
