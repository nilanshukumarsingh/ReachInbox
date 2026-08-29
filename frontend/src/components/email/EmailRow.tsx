import React from 'react';
import { Clock, Star, ExternalLink, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { EmailJob } from '../../types';

interface EmailRowProps {
  email: EmailJob;
  type: 'scheduled' | 'sent';
  onToggleStar: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (email: EmailJob) => void;
}

export const EmailRow: React.FC<EmailRowProps> = ({
  email,
  type,
  onToggleStar,
  onDelete,
  onClick,
}) => {
  const formatScheduledTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return format(d, 'EEE h:mm:ss a');
    } catch {
      return dateStr;
    }
  };

  const recipientDisplayName =
    email.recipientName ||
    email.recipientEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  // Extract clean plain text for snippet
  const cleanSnippet = email.body.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();

  return (
    <div
      onClick={() => onClick(email)}
      className="group flex items-center justify-between px-6 py-3.5 border-b border-[#F1F5F9] hover:bg-[#F8FAFC] cursor-pointer transition text-sm select-none"
    >
      {/* Left side: Recipient & Badge & Content snippet */}
      <div className="flex items-center gap-6 overflow-hidden pr-4 flex-1">
        {/* Recipient info matching Figma: "To: John Smith" */}
        <div className="w-44 shrink-0 font-medium text-[#1E293B] truncate">
          <span>To: </span>
          <span>{recipientDisplayName}</span>
        </div>

        {/* Badge */}
        <div className="shrink-0">
          {type === 'scheduled' ? (
            email.status === 'RATE_LIMITED' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                <Clock className="w-3 h-3 text-amber-600" />
                Rescheduled (Rate Limit)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FEF3C7] text-[#B45309]">
                <Clock className="w-3 h-3 text-[#D97706]" />
                {formatScheduledTime(email.scheduledAt)}
              </span>
            )
          ) : (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                email.status === 'SENT'
                  ? 'bg-[#F3F4F6] text-[#4B5563]'
                  : 'bg-red-50 text-red-600 border border-red-200'
              }`}
            >
              {email.status === 'SENT' ? 'Sent' : 'Failed'}
            </span>
          )}
        </div>

        {/* Subject & snippet matching Figma: "Meeting follow-up - Scheduled - Hi John..." */}
        <div className="flex items-center gap-1.5 overflow-hidden text-sm">
          <span className="font-semibold text-[#1E293B] shrink-0 truncate max-w-xs">
            {email.subject}
          </span>
          <span className="text-[#94A3B8] shrink-0">-</span>
          <span className="text-[#64748B] truncate">{cleanSnippet}</span>
        </div>
      </div>

      {/* Right side Actions */}
      <div
        className="flex items-center gap-3 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ethereal Preview URL (if sent) */}
        {email.etherealPreviewUrl && (
          <a
            href={email.etherealPreviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="View in Ethereal Fake SMTP"
            className="text-[#00A343] hover:text-[#008e3a] p-1 hover:bg-[#E8F5E9] rounded transition"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}

        {/* Star Button */}
        <button
          onClick={() => onToggleStar(email.id)}
          className="text-[#CBD5E1] hover:text-amber-400 transition p-1"
          title="Star"
        >
          <Star
            className={`w-4 h-4 ${
              email.isStarred ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
            }`}
          />
        </button>

        {/* Delete button (visible on hover) */}
        <button
          onClick={() => onDelete(email.id)}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition p-1"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
