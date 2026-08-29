import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { emailService } from '../../services/email.service';

interface CsvUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onEmailsParsed: (emails: string[]) => void;
}

export const CsvUploader: React.FC<CsvUploaderProps> = ({
  isOpen,
  onClose,
  onEmailsParsed,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pasteText, setPasteText] = useState('');
  const [detectedEmails, setDetectedEmails] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const extractEmailsFromText = (text: string): string[] => {
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    const matches = text.match(emailRegex) || [];
    return Array.from(new Set(matches.map((e) => e.toLowerCase())));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    try {
      const text = await file.text();
      // Fast client-side regex with server fallback
      const emails = extractEmailsFromText(text);
      setDetectedEmails(emails);
    } catch (err) {
      console.error('File parsing error', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setPasteText(val);
    const emails = extractEmailsFromText(val);
    setDetectedEmails(emails);
  };

  const handleApply = () => {
    if (detectedEmails.length > 0) {
      onEmailsParsed(detectedEmails);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#E8F5E9] rounded-lg">
              <UploadCloud className="w-5 h-5 text-[#00A343]" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Upload Lead List</h3>
              <p className="text-xs text-gray-500">Import email recipients via CSV or text file</p>
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
        <div className="p-6 flex flex-col gap-4">
          {/* Drag & Drop File Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#D1D5DB] hover:border-[#00A343] hover:bg-[#F8FAFC] rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
            <FileText className="w-8 h-8 text-[#00A343]" />
            <div>
              <span className="text-xs font-semibold text-[#00A343]">Click to browse</span>
              <span className="text-xs text-gray-500"> or drag & drop CSV or TXT</span>
            </div>
            {fileName && (
              <span className="text-xs font-mono text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md">
                {fileName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-[1px] bg-gray-200" />
            <span className="text-xs text-gray-400 uppercase font-medium">OR PASTE EMAILS</span>
            <div className="flex-1 h-[1px] bg-gray-200" />
          </div>

          {/* Paste Text Area */}
          <textarea
            value={pasteText}
            onChange={handleTextChange}
            placeholder="Paste list of emails separated by commas, newlines, or tabs (e.g. tame@jmail.com, lame@jmail.com)..."
            rows={3}
            className="w-full bg-[#F8FAFC] border border-[#EAECF0] rounded-xl p-3 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#00A343] focus:bg-white resize-none"
          />

          {/* Detection Stats Pill */}
          {detectedEmails.length > 0 && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#E8F5E9] border border-[#C8E6C9] text-xs text-[#00A343]">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#00A343]" />
                <span className="font-semibold">{detectedEmails.length} email addresses detected</span>
              </div>
              <span className="text-[11px] text-gray-500 truncate max-w-[150px]">
                {detectedEmails.slice(0, 2).join(', ')}...
              </span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[#F8FAFC] border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={detectedEmails.length === 0}
            className={`px-5 py-2 rounded-xl text-xs font-semibold transition ${
              detectedEmails.length > 0
                ? 'bg-[#00A343] text-white hover:bg-[#008e3a] shadow-sm'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Apply {detectedEmails.length > 0 ? `(${detectedEmails.length})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
};
