import React, { useState } from 'react';
import {
  ArrowLeft,
  Paperclip,
  Clock,
  UploadCloud,
  X,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import { RichTextToolbar } from './RichTextToolbar';
import { SendLaterModal } from './SendLaterModal';
import { CsvUploader } from './CsvUploader';
import { emailService } from '../../services/email.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface ComposeEmailProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const ComposeEmail: React.FC<ComposeEmailProps> = ({ onBack, onSuccess }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [fromEmail, setFromEmail] = useState(user?.email || 'oliver.brown@domain.io');
  const [toInput, setToInput] = useState('');
  const [recipientPills, setRecipientPills] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [delayBetweenEmails, setDelayBetweenEmails] = useState('2');
  const [hourlyLimit, setHourlyLimit] = useState('100');
  const [body, setBody] = useState('');

  const [sendLaterOpen, setSendLaterOpen] = useState(false);
  const [scheduledTime, setScheduledTime] = useState<string | null>(null);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAttachment, setHasAttachment] = useState(false);

  // Add recipient on enter or comma
  const handleKeyDownTo = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = toInput.trim().replace(',', '');
      if (val && !recipientPills.includes(val)) {
        setRecipientPills([...recipientPills, val]);
        setToInput('');
      }
    }
  };

  const removePill = (emailToRemove: string) => {
    setRecipientPills(recipientPills.filter((e) => e !== emailToRemove));
  };

  const handleCsvParsed = (parsedEmails: string[]) => {
    const combined = Array.from(new Set([...recipientPills, ...parsedEmails]));
    setRecipientPills(combined);
    showToast(`Added ${parsedEmails.length} email recipients!`, 'success');
  };

  const handleScheduleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const allRecipients = [...recipientPills];
    if (toInput.trim() && !allRecipients.includes(toInput.trim())) {
      allRecipients.push(toInput.trim());
    }

    if (allRecipients.length === 0) {
      showToast('Please add at least one recipient email', 'error');
      return;
    }

    if (!subject.trim()) {
      showToast('Please enter a subject', 'error');
      return;
    }

    if (!body.trim()) {
      showToast('Please enter an email body', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await emailService.scheduleEmails({
        senderEmail: fromEmail,
        recipients: allRecipients,
        subject,
        body,
        startTime: scheduledTime || new Date().toISOString(),
        delayBetweenEmails: parseInt(delayBetweenEmails, 10) || 0,
        hourlyLimit: parseInt(hourlyLimit, 10) || 100,
      });

      showToast(res.message || `Scheduled ${res.count} email(s) successfully!`, 'success');
      onSuccess();
      onBack();
    } catch (err: any) {
      showToast(err.response?.data?.error || err.message || 'Failed to schedule emails', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-white overflow-hidden select-none">
      {/* Top Bar matching Figma */}
      <div className="h-16 px-8 border-b border-[#EAECF0] flex items-center justify-between shrink-0 bg-white">
        {/* Left: Back button & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900 p-1.5 rounded-lg hover:bg-gray-100 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold text-[#1E293B]">Compose New Email</h1>
        </div>

        {/* Right Actions matching Figma */}
        <div className="relative flex items-center gap-4">
          {/* Attachment button */}
          <button
            type="button"
            onClick={() => setHasAttachment(!hasAttachment)}
            className={`p-2 rounded-lg transition relative ${
              hasAttachment ? 'text-[#00A343] bg-[#E8F5E9]' : 'text-gray-400 hover:text-gray-600'
            }`}
            title="Add attachment"
          >
            <Paperclip className="w-5 h-5" />
            {hasAttachment && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#00A343]" />
            )}
          </button>

          {/* Send Later clock icon */}
          <button
            type="button"
            onClick={() => setSendLaterOpen(!sendLaterOpen)}
            className={`p-2 rounded-lg transition relative ${
              scheduledTime ? 'text-[#00A343] bg-[#E8F5E9]' : 'text-gray-400 hover:text-gray-600'
            }`}
            title="Schedule time"
          >
            <Clock className="w-5 h-5" />
            {scheduledTime && (
              <span className="absolute -bottom-1 right-0 text-[9px] bg-[#00A343] text-white px-1 rounded-full font-bold">
                ✓
              </span>
            )}
          </button>

          {/* Send Later Popover */}
          <SendLaterModal
            isOpen={sendLaterOpen}
            onClose={() => setSendLaterOpen(false)}
            onSelectTime={(time) => {
              setScheduledTime(time);
              showToast(`Email scheduled for ${new Date(time).toLocaleString()}`, 'info');
            }}
            currentTime={scheduledTime || undefined}
          />

          {/* Schedule / Send Button */}
          <button
            type="button"
            onClick={handleScheduleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 rounded-full border border-[#00A343] text-[#00A343] hover:bg-[#E8F5E9] active:bg-[#C8E6C9] font-medium text-sm transition shadow-sm flex items-center gap-2"
          >
            {isSubmitting ? 'Scheduling...' : scheduledTime ? 'Schedule' : 'Send'}
          </button>
        </div>
      </div>

      {/* Form Fields Area */}
      <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-5 max-w-5xl">
        {/* From Field */}
        <div className="flex items-center">
          <span className="w-20 text-xs font-medium text-gray-500">From</span>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#EAECF0] text-xs text-gray-800">
            <span>{fromEmail}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </div>
        </div>

        {/* To Field with Recipient Pills & Upload List Button */}
        <div className="flex items-center">
          <span className="w-20 text-xs font-medium text-gray-500">To</span>
          <div className="flex-1 flex items-center justify-between gap-2 border-b border-[#F1F5F9] pb-2 min-h-[38px] flex-wrap">
            <div className="flex items-center gap-2 flex-wrap flex-1">
              {/* Recipient Pills matching Figma: tame@jmail.com, lame@jmail.com */}
              {recipientPills.map((email) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#E8F5E9] text-[#00A343] border border-[#C8E6C9]"
                >
                  {email}
                  <button
                    type="button"
                    onClick={() => removePill(email)}
                    className="text-[#00A343] hover:text-[#008e3a] transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              <input
                type="text"
                value={toInput}
                onChange={(e) => setToInput(e.target.value)}
                onKeyDown={handleKeyDownTo}
                placeholder={recipientPills.length === 0 ? 'recipient@example.com' : 'Add another...'}
                className="text-xs text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent min-w-[200px] flex-1 py-1"
              />
            </div>

            {/* Upload List Button matching Figma: ⤒ Upload List */}
            <button
              type="button"
              onClick={() => setCsvModalOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#00A343] hover:text-[#008e3a] transition shrink-0 px-2 py-1 rounded-lg hover:bg-[#E8F5E9]"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload List</span>
            </button>
          </div>
        </div>

        {/* Subject Field */}
        <div className="flex items-center">
          <span className="w-20 text-xs font-medium text-gray-500">Subject</span>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="flex-1 border-b border-[#F1F5F9] pb-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00A343] transition bg-transparent"
          />
        </div>

        {/* Delay & Hourly Limit Row matching Figma */}
        <div className="flex items-center gap-8 pt-1">
          {/* Delay between 2 emails */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-500">Delay between 2 emails</span>
            <input
              type="number"
              min="0"
              value={delayBetweenEmails}
              onChange={(e) => setDelayBetweenEmails(e.target.value)}
              placeholder="00"
              className="w-14 bg-[#F8FAFC] border border-[#EAECF0] rounded-xl px-2.5 py-1.5 text-xs text-center text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#00A343]"
            />
            <span className="text-xs text-gray-400">sec</span>
          </div>

          {/* Hourly Limit */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-500">Hourly Limit</span>
            <input
              type="number"
              min="1"
              value={hourlyLimit}
              onChange={(e) => setHourlyLimit(e.target.value)}
              placeholder="00"
              className="w-16 bg-[#F8FAFC] border border-[#EAECF0] rounded-xl px-2.5 py-1.5 text-xs text-center text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#00A343]"
            />
            <span className="text-xs text-gray-400">emails/hr</span>
          </div>
        </div>

        {/* Rich Text Editor Container matching Figma */}
        <div className="flex-1 flex flex-col min-h-[350px] border border-[#EAECF0] rounded-2xl overflow-hidden shadow-sm mt-2">
          {/* Toolbar */}
          <RichTextToolbar />

          {/* Editor Body */}
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type Your Reply..."
            className="flex-1 w-full p-5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none resize-none leading-relaxed bg-[#FAFAFA]"
          />
        </div>
      </div>

      {/* Floating Help Button matching Figma: ? in bottom right */}
      <div className="fixed bottom-6 right-6">
        <button
          type="button"
          title="ReachInbox Help & Documentation"
          className="w-9 h-9 rounded-full bg-[#F1F5F9] hover:bg-[#E2E8F0] text-gray-600 flex items-center justify-center font-bold text-sm shadow-sm transition border border-gray-200"
        >
          ?
        </button>
      </div>

      {/* CSV / Lead List Uploader Modal */}
      <CsvUploader
        isOpen={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        onEmailsParsed={handleCsvParsed}
      />
    </div>
  );
};
