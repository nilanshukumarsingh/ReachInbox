import React from 'react';
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  List,
  ListOrdered,
  Indent,
  Outdent,
  Quote,
  Strikethrough,
  Link2,
  ChevronDown,
} from 'lucide-react';

interface RichTextToolbarProps {
  onFormat?: (command: string, value?: string) => void;
}

export const RichTextToolbar: React.FC<RichTextToolbarProps> = () => {
  return (
    <div className="flex items-center gap-1 p-2 bg-[#F8FAFC] border border-[#EAECF0] rounded-t-xl text-gray-500 overflow-x-auto select-none">
      {/* Undo / Redo */}
      <button
        type="button"
        className="p-1.5 hover:bg-white hover:text-gray-900 rounded transition"
        title="Undo"
      >
        <Undo2 className="w-4 h-4" />
      </button>
      <button
        type="button"
        className="p-1.5 hover:bg-white hover:text-gray-900 rounded transition"
        title="Redo"
      >
        <Redo2 className="w-4 h-4" />
      </button>

      <div className="w-[1px] h-4 bg-gray-200 mx-1" />

      {/* Typography TT */}
      <button
        type="button"
        className="flex items-center gap-0.5 px-2 py-1 hover:bg-white hover:text-gray-900 rounded transition text-xs font-semibold"
        title="Font size"
      >
        <span>TT</span>
        <ChevronDown className="w-3 h-3 text-gray-400" />
      </button>

      <div className="w-[1px] h-4 bg-gray-200 mx-1" />

      {/* Bold / Italic / Underline */}
      <button
        type="button"
        className="p-1.5 hover:bg-white hover:text-gray-900 rounded transition"
        title="Bold"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        type="button"
        className="p-1.5 hover:bg-white hover:text-gray-900 rounded transition"
        title="Italic"
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        type="button"
        className="p-1.5 hover:bg-white hover:text-gray-900 rounded transition"
        title="Underline"
      >
        <Underline className="w-4 h-4" />
      </button>

      <div className="w-[1px] h-4 bg-gray-200 mx-1" />

      {/* Alignment */}
      <button
        type="button"
        className="flex items-center gap-0.5 p-1.5 hover:bg-white hover:text-gray-900 rounded transition"
        title="Align"
      >
        <AlignLeft className="w-4 h-4" />
        <ChevronDown className="w-3 h-3 text-gray-400" />
      </button>

      <div className="w-[1px] h-4 bg-gray-200 mx-1" />

      {/* Lists */}
      <button
        type="button"
        className="p-1.5 hover:bg-white hover:text-gray-900 rounded transition"
        title="Bullet list"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        type="button"
        className="p-1.5 hover:bg-white hover:text-gray-900 rounded transition"
        title="Numbered list"
      >
        <ListOrdered className="w-4 h-4" />
      </button>
      <button
        type="button"
        className="p-1.5 hover:bg-white hover:text-gray-900 rounded transition"
        title="Indent"
      >
        <Indent className="w-4 h-4" />
      </button>
      <button
        type="button"
        className="p-1.5 hover:bg-white hover:text-gray-900 rounded transition"
        title="Outdent"
      >
        <Outdent className="w-4 h-4" />
      </button>

      <div className="w-[1px] h-4 bg-gray-200 mx-1" />

      {/* Quote / Strike / Link */}
      <button
        type="button"
        className="p-1.5 hover:bg-white hover:text-gray-900 rounded transition"
        title="Quote"
      >
        <Quote className="w-4 h-4" />
      </button>
      <button
        type="button"
        className="p-1.5 hover:bg-white hover:text-gray-900 rounded transition"
        title="Strikethrough"
      >
        <Strikethrough className="w-4 h-4" />
      </button>
      <button
        type="button"
        className="p-1.5 hover:bg-white hover:text-gray-900 rounded transition"
        title="Insert Link"
      >
        <Link2 className="w-4 h-4" />
      </button>
    </div>
  );
};
