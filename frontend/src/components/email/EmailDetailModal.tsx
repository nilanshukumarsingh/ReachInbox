import React from 'react';
import { X, ExternalLink, Clock, User, Mail, Calendar, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { EmailJob } from '../../types';

interface EmailDetailModalProps {
  email: EmailJob | null;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export const EmailDetailModal: React.FC<EmailDetailModalProps> = ({
  email,
  onClose,
  onDelete,
}) => {
  if (!email) return null;

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      return format(new Date(dateStr), 'EEEE, MMMM d, yyyy @ h:mm:ss a');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#F8FAFC]">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                email.status === 'SENT'
                  ? 'bg-emerald-100 text-emerald-800'
                  : email.status === 'SCHEDULED'
                  ? 'bg-amber-100 text-amber-800'
                  : email.status === 'RATE_LIMITED'
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {email.status}
            </span>
            <span className="text-xs text-gray-500 font-mono">ID: {email.id.slice(0, 8)}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onDelete(email.id);
                onClose();
              }}
              className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg transition"
              title="Delete Email"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 rounded-full p-1.5 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Email Metadata */}
        <div className="p-6 flex flex-col gap-4 overflow-y-auto">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">{email.subject}</h2>
            <div className="flex flex-wrap gap-y-2 gap-x-6 text-xs text-gray-600 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-gray-400" />
                <span>From: </span>
                <span className="font-semibold text-gray-800">{email.senderEmail}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                <span>To: </span>
                <span className="font-semibold text-gray-800">{email.recipientEmail}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span>
                  {email.status === 'SENT' ? 'Sent:' : 'Scheduled:'}{' '}
                  {formatDate(email.status === 'SENT' ? email.sentAt : email.scheduledAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Ethereal Fake SMTP preview link */}
          {email.etherealPreviewUrl && (
            <div className="p-3 bg-[#E8F5E9] border border-[#C8E6C9] rounded-xl flex items-center justify-between">
              <div className="text-xs text-[#00A343]">
                <span className="font-semibold">Fake SMTP Delivery Verified: </span>
                <span>Ethereal Email generated a live browser preview for this message.</span>
              </div>
              <a
                href={email.etherealPreviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-[#00A343] text-white rounded-lg text-xs font-semibold hover:bg-[#008e3a] transition flex items-center gap-1.5 shrink-0"
              >
                <span>View Email</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Configuration Parameters */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl text-xs text-gray-600">
            <div>
              <span className="text-gray-400">Delay between emails: </span>
              <span className="font-semibold text-gray-800">{email.delaySeconds}s</span>
            </div>
            <div>
              <span className="text-gray-400">Sender Hourly Limit: </span>
              <span className="font-semibold text-gray-800">{email.hourlyLimit} emails/hr</span>
            </div>
          </div>

          {/* Body Content */}
          <div className="mt-2">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Message Body</h4>
            <div
              className="p-4 bg-[#F8FAFC] border border-[#EAECF0] rounded-xl text-sm text-gray-800 leading-relaxed min-h-[120px] whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: email.body }}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-6 py-3 bg-[#F8FAFC] border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-200 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
