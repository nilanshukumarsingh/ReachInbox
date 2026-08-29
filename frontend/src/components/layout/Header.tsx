import React from 'react';
import { Search, SlidersHorizontal, RotateCw } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onRefresh,
  isLoading = false,
}) => {
  return (
    <header className="h-16 bg-white border-b border-[#EAECF0] px-6 flex items-center justify-between shrink-0">
      {/* Search Input matching Figma */}
      <div className="flex items-center gap-3 w-full max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search"
            className="w-full bg-[#F8FAFC] border border-[#F1F5F9] rounded-xl pl-9 pr-4 py-2 text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#00A343] focus:bg-white transition"
          />
        </div>

        {/* Filter Action */}
        <button
          title="Filter"
          className="p-2 text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8FAFC] rounded-lg transition"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        {/* Refresh Action */}
        <button
          onClick={onRefresh}
          title="Refresh List"
          className={`p-2 text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8FAFC] rounded-lg transition ${
            isLoading ? 'animate-spin text-[#00A343]' : ''
          }`}
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
