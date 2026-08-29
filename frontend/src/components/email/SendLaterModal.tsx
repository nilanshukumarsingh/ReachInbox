import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, X, Check } from 'lucide-react';

interface SendLaterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTime: (dateTime: string) => void;
  currentTime?: string;
}

export const SendLaterModal: React.FC<SendLaterModalProps> = ({
  isOpen,
  onClose,
  onSelectTime,
  currentTime,
}) => {
  // Default to 1 hour in future formatted for datetime-local input
  const getDefaultDateTime = () => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const [selectedDateTime, setSelectedDateTime] = useState<string>(
    currentTime || getDefaultDateTime()
  );

  if (!isOpen) return null;

  const handlePreset = (minutes: number) => {
    const d = new Date(Date.now() + minutes * 60 * 1000);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    setSelectedDateTime(d.toISOString().slice(0, 16));
  };

  const handleTomorrowMorning = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    setSelectedDateTime(d.toISOString().slice(0, 16));
  };

  const handleConfirm = () => {
    const isoString = new Date(selectedDateTime).toISOString();
    onSelectTime(isoString);
    onClose();
  };

  return (
    <div className="absolute right-0 top-12 z-40 w-80 bg-white border border-[#E2E8F0] rounded-2xl shadow-xl p-5 animate-in fade-in zoom-in-95 duration-150">
      {/* Header matching Figma */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-[#1E293B] flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#00A343]" />
          Send Later
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 rounded-full p-1 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Presets */}
      <div className="flex flex-col gap-1.5 my-3.5">
        <button
          type="button"
          onClick={() => handlePreset(10)}
          className="text-left px-3 py-1.5 rounded-lg text-xs text-gray-700 hover:bg-[#F8FAFC] hover:text-[#00A343] transition flex justify-between items-center"
        >
          <span>In 10 minutes</span>
          <span className="text-[11px] text-gray-400">+10m</span>
        </button>
        <button
          type="button"
          onClick={() => handlePreset(60)}
          className="text-left px-3 py-1.5 rounded-lg text-xs text-gray-700 hover:bg-[#F8FAFC] hover:text-[#00A343] transition flex justify-between items-center"
        >
          <span>In 1 hour</span>
          <span className="text-[11px] text-gray-400">+1h</span>
        </button>
        <button
          type="button"
          onClick={handleTomorrowMorning}
          className="text-left px-3 py-1.5 rounded-lg text-xs text-gray-700 hover:bg-[#F8FAFC] hover:text-[#00A343] transition flex justify-between items-center"
        >
          <span>Tomorrow morning</span>
          <span className="text-[11px] text-gray-400">9:00 AM</span>
        </button>
      </div>

      {/* Custom Picker matching Figma: "Pick date & time 📅" */}
      <div className="flex flex-col gap-1.5 mb-4">
        <label className="text-xs font-medium text-gray-500">Pick date & time</label>
        <div className="relative">
          <input
            type="datetime-local"
            value={selectedDateTime}
            onChange={(e) => setSelectedDateTime(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-[#EAECF0] rounded-xl px-3 py-2 text-xs text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#00A343] focus:bg-white transition"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="px-4 py-1.5 rounded-lg text-xs font-medium bg-[#00A343] text-white hover:bg-[#008e3a] transition shadow-sm flex items-center gap-1.5"
        >
          <Check className="w-3.5 h-3.5" />
          Schedule
        </button>
      </div>
    </div>
  );
};
