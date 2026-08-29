import React, { useState } from 'react';
import { MessageSquare, X, Check, AlertCircle, Send, BellRing } from 'lucide-react';
import { slackService } from '../../services/slack.service';
import { useToast } from '../../context/ToastContext';

interface SlackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectedStatusChange: (status: boolean) => void;
}

export const SlackModal: React.FC<SlackModalProps> = ({
  isOpen,
  onClose,
  onConnectedStatusChange,
}) => {
  const { showToast } = useToast();
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookUrl) return;

    setIsSaving(true);
    try {
      const res = await slackService.connectSlack(webhookUrl);
      showToast(res.message || 'Slack connected successfully!', 'success');
      onConnectedStatusChange(true);
      onClose();
    } catch (err: any) {
      showToast(err.response?.data?.error || err.message || 'Failed to connect Slack', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTriggerTest = async () => {
    setIsTesting(true);
    try {
      const res = await slackService.triggerTestAlert();
      showToast(res.message || 'Rate-limit alert dispatched to Slack!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to dispatch test alert', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await slackService.disconnectSlack();
      setWebhookUrl('');
      onConnectedStatusChange(false);
      showToast('Slack disconnected', 'info');
      onClose();
    } catch (err: any) {
      showToast('Failed to disconnect', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#F3E8FF] rounded-lg">
              <MessageSquare className="w-5 h-5 text-[#4A154B]" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Slack Rate-Limit Alerts</h3>
              <p className="text-xs text-gray-500">Real-time alerts when hourly send limits are exceeded</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 rounded-full p-1.5 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleConnect} className="p-6 flex flex-col gap-4">
          <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-100 text-xs text-purple-900 flex flex-col gap-1.5">
            <span className="font-semibold flex items-center gap-1.5">
              <BellRing className="w-4 h-4 text-purple-700" />
              Live Rate Limit Notification Guarantee
            </span>
            <p className="text-purple-800 text-[11px] leading-relaxed">
              When any sender hits their hourly limit, ReachInbox immediately pauses and reschedules their overflow jobs to the next hour window and dispatches a live alert directly into your Slack channel.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700">Slack Incoming Webhook URL</label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://hooks.slack.com/services/T00/B00/XXXXX"
              className="w-full bg-[#F8FAFC] border border-[#EAECF0] rounded-xl px-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#00A343] focus:bg-white transition"
              required
            />
          </div>

          {/* Test & Disconnect Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleTriggerTest}
              disabled={isTesting}
              className="text-xs font-medium text-[#4A154B] hover:text-purple-900 hover:underline flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {isTesting ? 'Sending test alert...' : 'Send Test Alert to Slack'}
            </button>

            <button
              type="button"
              onClick={handleDisconnect}
              className="text-xs text-gray-400 hover:text-red-500 transition"
            >
              Disconnect
            </button>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#00A343] text-white hover:bg-[#008e3a] transition shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              {isSaving ? 'Connecting...' : 'Save & Connect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
