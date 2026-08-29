import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { EmailRow } from '../components/email/EmailRow';
import { ComposeEmail } from '../components/email/ComposeEmail';
import { SlackModal } from '../components/email/SlackModal';
import { EmailDetailModal } from '../components/email/EmailDetailModal';
import { emailService } from '../services/email.service';
import { slackService } from '../services/slack.service';
import { EmailJob, QueueStats } from '../types';
import { useToast } from '../context/ToastContext';
import { Inbox, MailCheck, Clock, Search, AlertCircle } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { showToast } = useToast();

  const [currentTab, setCurrentTab] = useState<'scheduled' | 'sent'>('scheduled');
  const [isComposing, setIsComposing] = useState(false);
  const [slackModalOpen, setSlackModalOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailJob | null>(null);

  const [scheduledEmails, setScheduledEmails] = useState<EmailJob[]>([]);
  const [sentEmails, setSentEmails] = useState<EmailJob[]>([]);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [slackConnected, setSlackConnected] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [scheduled, sent, stats, slackStatus] = await Promise.all([
        emailService.getScheduledEmails(searchQuery),
        emailService.getSentEmails(searchQuery),
        emailService.getStats().catch(() => null),
        slackService.getStatus().catch(() => ({ connected: false })),
      ]);

      setScheduledEmails(scheduled);
      setSentEmails(sent);
      if (stats) setQueueStats(stats);
      if (slackStatus) setSlackConnected(slackStatus.connected);
    } catch (err: any) {
      console.error('Error loading dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadData();
    // Poll queue & emails every 5 seconds for live real-time updates
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleToggleStar = async (id: string) => {
    try {
      const isStarred = await emailService.toggleStar(id);
      setScheduledEmails((prev) =>
        prev.map((e) => (e.id === id ? { ...e, isStarred } : e))
      );
      setSentEmails((prev) =>
        prev.map((e) => (e.id === id ? { ...e, isStarred } : e))
      );
    } catch (err) {
      showToast('Failed to update star', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await emailService.deleteEmail(id);
      setScheduledEmails((prev) => prev.filter((e) => e.id !== id));
      setSentEmails((prev) => prev.filter((e) => e.id !== id));
      showToast('Email deleted', 'info');
    } catch (err) {
      showToast('Failed to delete email', 'error');
    }
  };

  const activeEmailList = currentTab === 'scheduled' ? scheduledEmails : sentEmails;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white">
      {/* Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setIsComposing(false);
        }}
        onOpenCompose={() => setIsComposing(true)}
        onOpenSlackModal={() => setSlackModalOpen(true)}
        scheduledCount={scheduledEmails.length}
        sentCount={sentEmails.length}
        queueStats={queueStats}
        slackConnected={slackConnected}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white">
        {isComposing ? (
          <ComposeEmail
            onBack={() => setIsComposing(false)}
            onSuccess={() => {
              loadData();
              setCurrentTab('scheduled');
            }}
          />
        ) : (
          <>
            {/* Top Search & Filter Header */}
            <Header
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onRefresh={loadData}
              isLoading={isLoading}
            />

            {/* Email Table Container matching Figma */}
            <div className="flex-1 overflow-y-auto">
              {isLoading && activeEmailList.length === 0 ? (
                /* Loading Skeleton */
                <div className="flex flex-col">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-6 px-6 py-4 border-b border-gray-100 animate-pulse"
                    >
                      <div className="w-36 h-4 bg-gray-100 rounded" />
                      <div className="w-24 h-5 bg-gray-100 rounded-full" />
                      <div className="flex-1 h-4 bg-gray-100 rounded max-w-lg" />
                    </div>
                  ))}
                </div>
              ) : activeEmailList.length === 0 ? (
                /* Empty State */
                <div className="h-full flex flex-col items-center justify-center p-12 text-center select-none">
                  <div className="w-16 h-16 rounded-2xl bg-[#F8FAFC] border border-[#EAECF0] flex items-center justify-center mb-4 text-[#94A3B8]">
                    {currentTab === 'scheduled' ? (
                      <Clock className="w-8 h-8 text-[#00A343]" />
                    ) : (
                      <MailCheck className="w-8 h-8 text-[#00A343]" />
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-[#1E293B] mb-1">
                    {searchQuery
                      ? 'No matching emails found'
                      : currentTab === 'scheduled'
                      ? 'No scheduled emails'
                      : 'No sent emails yet'}
                  </h3>
                  <p className="text-xs text-[#64748B] max-w-sm mb-6">
                    {searchQuery
                      ? `Try searching for another recipient, subject or keyword.`
                      : currentTab === 'scheduled'
                      ? 'Click the Compose button to schedule outbound emails with automated delays and rate limiting.'
                      : 'Emails sent via fake SMTP will appear here along with their live preview links.'}
                  </p>
                  {!searchQuery && currentTab === 'scheduled' && (
                    <button
                      onClick={() => setIsComposing(true)}
                      className="px-5 py-2 rounded-full border border-[#00A343] text-[#00A343] hover:bg-[#E8F5E9] font-medium text-xs transition"
                    >
                      Compose First Email
                    </button>
                  )}
                </div>
              ) : (
                /* Email List */
                <div className="flex flex-col divide-y divide-[#F1F5F9]">
                  {activeEmailList.map((email) => (
                    <EmailRow
                      key={email.id}
                      email={email}
                      type={currentTab}
                      onToggleStar={handleToggleStar}
                      onDelete={handleDelete}
                      onClick={(item) => setSelectedEmail(item)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Slack Integration Modal */}
      <SlackModal
        isOpen={slackModalOpen}
        onClose={() => setSlackModalOpen(false)}
        onConnectedStatusChange={setSlackConnected}
      />

      {/* Email Detail View Modal */}
      <EmailDetailModal
        email={selectedEmail}
        onClose={() => setSelectedEmail(null)}
        onDelete={handleDelete}
      />
    </div>
  );
};
