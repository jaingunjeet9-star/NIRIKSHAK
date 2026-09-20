import { useState } from 'react';
import { X, Copy, Check, Printer, FileText, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../lib/i18n';

interface ShowCauseNoticeModalProps {
  noticeDraft: string;
  productName: string;
  batchReference: string;
  onClose: () => void;
}

export function ShowCauseNoticeModal({
  noticeDraft,
  productName,
  batchReference,
  onClose,
}: ShowCauseNoticeModalProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(noticeDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-[#E7E3DC] rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-[#FAF8F5] border-b border-[#E7E3DC] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FAECE7] text-[#9E432A] flex items-center justify-center border border-[#F7D0C4]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#2D322E]">
                {t('modals.noticeTitle')} (Form LM-VIII)
              </h3>
              <p className="text-xs text-[#7A827B]">
                {t('common.ref')} {batchReference} • {productName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-[#EFECE5] flex items-center justify-center text-[#535953] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notice Body */}
        <div className="p-6 overflow-y-auto font-mono text-xs text-[#2D322E] leading-relaxed whitespace-pre-wrap bg-[#FAF8F5]/50 border-b border-[#E7E3DC]">
          <div className="p-4 bg-white border border-[#E7E3DC] rounded-xl shadow-xs">
            {noticeDraft}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#FAF8F5] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#8C5E2D]">
            <AlertTriangle className="w-4 h-4 text-[#8C5E2D]" />
            <span>Standard 15-day statutory response window applies upon dispatch.</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleCopy}
              className="h-10 px-4 bg-white border border-[#E7E3DC] hover:bg-[#F6F4EE] text-[#2D322E] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-[#335E46]" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : t('modals.copyNotice')}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="h-10 px-4 bg-[#52796F] hover:bg-[#45665E] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{t('common.print')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
