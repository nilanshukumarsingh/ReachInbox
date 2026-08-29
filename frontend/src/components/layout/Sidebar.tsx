import React, { useState } from 'react';
import { Clock, Send, ChevronDown, Plus, MessageSquare, LogOut, CheckCircle2, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { OnbLogo } from '../icons/FigmaIcons';
import { QueueStats } from '../../types';

interface SidebarProps {
  currentTab: 'scheduled' | 'sent';
  onSelectTab: (tab: 'scheduled' | 'sent') => void;
  onOpenCompose: () => void;
  onOpenSlackModal: () => void;
  scheduledCount: number;
  sentCount: number;
  queueStats?: QueueStats | null;
  slackConnected?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenCompose,
  onOpenSlackModal,
  scheduledCount,
  sentCount,
  queueStats,
  slackConnected = false,
}) => {
  const { user, logout } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  return (
    <aside className="w-[260px] h-screen bg-white border-r border-[#EAECF0] flex flex-col justify-between p-5 select-none shrink-0">
      {/* Top Section */}
      <div className="flex flex-col gap-6">
        {/* Brand / Logo */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-2xl tracking-tighter text-[#111827]">ONB</span>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-[#F8FAFC] border border-[#F1F5F9] hover:bg-[#F1F5F9] transition text-left"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img
                src={
                  user?.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                }
                alt={user?.name || 'Oliver Brown'}
                className="w-8 h-8 rounded-full object-cover shrink-0 border border-gray-200"
              />
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-semibold text-[#1E293B] truncate leading-tight">
                  {user?.name || 'Oliver Brown'}
                </span>
                <span className="text-[11px] text-[#64748B] truncate leading-tight">
                  {user?.email || 'oliver.brown@domain.io'}
                </span>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-[#94A3B8] shrink-0 ml-1" />
          </button>

          {/* Profile Dropdown */}
          {profileDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-lg z-30 py-1.5 overflow-hidden">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-xs font-medium text-gray-900">{user?.name}</p>
                <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  setProfileDropdownOpen(false);
                  onOpenSlackModal();
                }}
                className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-[#F8FAFC] flex items-center gap-2"
              >
                <MessageSquare className="w-3.5 h-3.5 text-gray-500" />
                Slack Notifications
              </button>
              <button
                onClick={() => {
                  setProfileDropdownOpen(false);
                  logout();
                }}
                className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>

        {/* Compose Button */}
        <button
          onClick={onOpenCompose}
          className="w-full py-2 px-4 rounded-full border border-[#00A343] text-[#00A343] hover:bg-[#E8F5E9] active:bg-[#C8E6C9] font-medium text-sm transition flex items-center justify-center gap-1.5 shadow-sm"
        >
          Compose
        </button>

        {/* Navigation Section */}
        <div className="flex flex-col gap-1.5 mt-1">
          <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider px-2.5 mb-1">
            CORE
          </span>

          {/* Scheduled Nav Item */}
          <button
            onClick={() => onSelectTab('scheduled')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition ${
              currentTab === 'scheduled'
                ? 'bg-[#E8F5E9] text-[#00A343]'
                : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Clock className={`w-4 h-4 ${currentTab === 'scheduled' ? 'text-[#00A343]' : 'text-[#64748B]'}`} />
              <span>Scheduled</span>
            </div>
            <span
              className={`text-xs ${
                currentTab === 'scheduled' ? 'text-[#00A343] font-semibold' : 'text-[#94A3B8]'
              }`}
            >
              {scheduledCount}
            </span>
          </button>

          {/* Sent Nav Item */}
          <button
            onClick={() => onSelectTab('sent')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition ${
              currentTab === 'sent'
                ? 'bg-[#E8F5E9] text-[#00A343]'
                : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Send className={`w-4 h-4 ${currentTab === 'sent' ? 'text-[#00A343]' : 'text-[#64748B]'}`} />
              <span>Sent</span>
            </div>
            <span
              className={`text-xs ${
                currentTab === 'sent' ? 'text-[#00A343] font-semibold' : 'text-[#94A3B8]'
              }`}
            >
              {sentCount}
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Status Section */}
      <div className="flex flex-col gap-3 pt-4 border-t border-[#F1F5F9]">
        {/* Slack Connection status */}
        <button
          onClick={onOpenSlackModal}
          className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition ${
            slackConnected
              ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#047857]'
              : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9]'
          }`}
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-[#4A154B]" />
            <span>{slackConnected ? 'Slack Alert Active' : 'Connect Slack'}</span>
          </div>
          {slackConnected ? (
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
          ) : (
            <span className="text-[10px] text-gray-400">OAuth</span>
          )}
        </button>

        {/* BullMQ Live Worker Pill */}
        <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#F1F5F9] text-[11px] text-[#64748B] flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block"></span>
              BullMQ Queue
            </span>
            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-mono">
              ACTIVE
            </span>
          </div>
          <div className="flex justify-between text-gray-500 pt-1 border-t border-gray-100">
            <span>Waiting: {queueStats?.bullmq.waiting || 0}</span>
            <span>Delayed: {queueStats?.bullmq.delayed || 0}</span>
            <span>Sent: {queueStats?.database.sent || 0}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
