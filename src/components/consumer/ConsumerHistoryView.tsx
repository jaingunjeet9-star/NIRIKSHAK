import { useState } from 'react';
import { History, ShieldCheck, AlertTriangle, Trash2, ArrowRight, ScanLine } from 'lucide-react';
import { ConsumerScanRecord } from '../../types/consumerTypes';
import { Language } from '../../lib/i18n';

interface ConsumerHistoryViewProps {
  scans: ConsumerScanRecord[];
  onSelectScan: (scan: ConsumerScanRecord) => void;
  onDeleteScan: (id: string) => void;
  onStartNewScan: () => void;
  language: Language;
}

export function ConsumerHistoryView({
  scans,
  onSelectScan,
  onDeleteScan,
  onStartNewScan,
  language,
}: ConsumerHistoryViewProps) {
  const isHi = language === 'HI';
  const [filter, setFilter] = useState<'ALL' | 'FOOD' | 'COSMETIC'>('ALL');

  const filteredScans = scans.filter((s) => {
    if (filter === 'ALL') return true;
    return s.domain === filter;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#2D6A4F]" />
            <h1 className="text-2xl font-bold text-[#1B4332]">
              {isHi ? 'उपभोक्ता स्कैन इतिहास' : 'Consumer Scan History'}
            </h1>
          </div>
          <p className="text-xs text-[#7A827B] mt-1">
            {isHi
              ? 'आपके द्वारा पूर्व में जाँचे गए सभी उत्पादों का रिकॉर्ड'
              : 'Record of all previously scanned packaging ingredient evaluations'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Domain Filter */}
          <div className="flex items-center bg-white border border-[#DFDBD3] rounded-xl p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1 rounded-lg cursor-pointer transition-colors ${
                filter === 'ALL' ? 'bg-[#2D6A4F] text-white shadow-xs' : 'text-[#7A827B]'
              }`}
            >
              {isHi ? 'सभी' : 'All'}
            </button>
            <button
              type="button"
              onClick={() => setFilter('FOOD')}
              className={`px-3 py-1 rounded-lg cursor-pointer transition-colors ${
                filter === 'FOOD' ? 'bg-[#2D6A4F] text-white shadow-xs' : 'text-[#7A827B]'
              }`}
            >
              {isHi ? 'खाद्य' : 'Food'}
            </button>
            <button
              type="button"
              onClick={() => setFilter('COSMETIC')}
              className={`px-3 py-1 rounded-lg cursor-pointer transition-colors ${
                filter === 'COSMETIC' ? 'bg-[#2D6A4F] text-white shadow-xs' : 'text-[#7A827B]'
              }`}
            >
              {isHi ? 'प्रसाधन' : 'Cosmetics'}
            </button>
          </div>

          <button
            type="button"
            onClick={onStartNewScan}
            className="px-4 py-2 rounded-xl bg-[#2D6A4F] text-white text-xs font-bold shadow-xs hover:bg-[#1B4332] flex items-center gap-1.5 cursor-pointer"
          >
            <ScanLine className="w-3.5 h-3.5" />
            <span>{isHi ? 'नया स्कैन' : 'New Scan'}</span>
          </button>
        </div>
      </div>

      {filteredScans.length === 0 ? (
        <div className="bg-white border border-[#E7E3DC] rounded-3xl p-12 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] text-[#7A827B] mx-auto flex items-center justify-center">
            <History className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[#2D322E]">
              {isHi ? 'कोई स्कैन इतिहास नहीं मिला' : 'No scan history found'}
            </h2>
            <p className="text-xs text-[#7A827B]">
              {isHi
                ? 'आपने अभी तक कोई उत्पाद स्कैन नहीं किया है।'
                : 'You have not scanned any product ingredients yet.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onStartNewScan}
            className="px-5 py-2.5 rounded-xl bg-[#2D6A4F] text-white text-xs font-bold hover:bg-[#1B4332] cursor-pointer"
          >
            {isHi ? 'पहला उत्पाद स्कैन करें' : 'Scan First Product'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredScans.map((scan) => (
            <div
              key={scan.id}
              className="bg-white border border-[#E7E3DC] rounded-2xl p-4 sm:p-5 hover:border-[#B7E4C7] transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div
                onClick={() => onSelectScan(scan)}
                className="flex items-start gap-4 cursor-pointer flex-1"
              >
                {scan.images[0] && (
                  <img
                    src={scan.images[0].dataUrl}
                    alt={scan.productName}
                    className="w-16 h-16 rounded-xl object-cover border border-[#E7E3DC] bg-[#FAF8F5] shrink-0"
                  />
                )}
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[11px] text-[#7A827B]">{scan.id}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#FAF8F5] text-[#2D6A4F] border border-[#DFDBD3]">
                      {scan.domain}
                    </span>
                    <span className="text-[11px] text-[#7A827B]">
                      {new Date(scan.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-[#1B4332]">{scan.productName}</h3>

                  <div className="flex items-center gap-2 text-xs text-[#535953] pt-1 flex-wrap">
                    <span className="font-semibold text-[#1B4332]">
                      {scan.ingredients?.length || scan.summary.totalDetected} {isHi ? 'सामग्रियां' : 'ingredients'}
                    </span>
                    {scan.foodAnalysis?.quickSummary && scan.foodAnalysis.quickSummary.length > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-[#92400E] bg-[#FEF3C7] px-2 py-0.5 rounded-md font-semibold text-2xs border border-[#FDE68A]">
                          {scan.foodAnalysis.quickSummary[0]}
                        </span>
                      </>
                    )}
                    {scan.cosmeticAnalysis?.quickSummary && scan.cosmeticAnalysis.quickSummary.length > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-[#2D6A4F] bg-[#EBF3EE] px-2 py-0.5 rounded-md font-semibold text-2xs border border-[#C7DECF]">
                          {scan.cosmeticAnalysis.quickSummary[0]}
                        </span>
                      </>
                    )}
                  </div>

                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => onSelectScan(scan)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#EBF3EE] hover:bg-[#D8F3DC] text-[#2D6A4F] text-xs font-bold border border-[#C7DECF] flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <span>{isHi ? 'परिणाम देखें' : 'View Result'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteScan(scan.id)}
                  className="p-2 rounded-xl text-[#9E432A] hover:bg-[#FAECE7] cursor-pointer transition-colors"
                  title={isHi ? 'हटाएं' : 'Delete'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
