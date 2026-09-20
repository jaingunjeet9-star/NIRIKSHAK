import { ScanLine, History, HelpCircle, ShieldCheck, AlertCircle, BookOpen, ArrowRight } from 'lucide-react';
import { ConsumerScanRecord } from '../../types/consumerTypes';
import { Language } from '../../lib/i18n';

interface ConsumerDashboardProps {
  onStartScan: () => void;
  onViewHistory: () => void;
  onOpenHowItWorks: () => void;
  recentScans: ConsumerScanRecord[];
  onSelectScan: (scan: ConsumerScanRecord) => void;
  language: Language;
}

export function ConsumerDashboard({
  onStartScan,
  onViewHistory,
  onOpenHowItWorks,
  recentScans,
  onSelectScan,
  language,
}: ConsumerDashboardProps) {
  const isHi = language === 'HI';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Hero Welcome Card */}
      <div className="bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C] text-white rounded-3xl p-8 sm:p-12 shadow-sm relative overflow-hidden">
        {/* Subtle decorative background circle */}
        <div className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
        <div className="max-w-2xl relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-xs">
            <ShieldCheck className="w-4 h-4 text-[#95D5B2]" />
            <span>{isHi ? 'आधिकारिक सरकारी स्रोतों पर आधारित' : 'Based on Official FSSAI & CDSCO Regulations'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {isHi ? 'उपभोक्ता मोड (CONSUMER MODE)' : 'CONSUMER MODE'}
          </h1>

          <p className="text-base sm:text-lg text-[#D8F3DC] leading-relaxed">
            {isHi
              ? 'उत्पाद सामग्री को स्कैन करें और उनकी वैधानिक व विनियामक स्थिति को समझें।'
              : 'Scan product ingredients to understand their regulatory status.'}
          </p>

          <div className="pt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onStartScan}
              className="px-6 py-3.5 rounded-xl bg-white text-[#1B4332] text-sm font-bold shadow-md hover:bg-[#D8F3DC] flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
            >
              <ScanLine className="w-4 h-4" />
              <span>{isHi ? 'सामग्री स्कैन करें' : 'SCAN INGREDIENTS'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onViewHistory}
              className="px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold border border-white/20 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <History className="w-4 h-4" />
              <span>{isHi ? 'स्कैन इतिहास' : 'SCAN HISTORY'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 Value Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-[#E7E3DC] rounded-2xl p-6 space-y-2.5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-[#EBF3EE] text-[#2D6A4F] flex items-center justify-center font-bold">
            1
          </div>
          <h2 className="font-bold text-base text-[#1B4332]">
            {isHi ? '1 से 4 छवियां अपलोड करें' : 'Upload 1 to 4 Images'}
          </h2>
          <p className="text-xs text-[#7A827B] leading-relaxed">
            {isHi
              ? 'एक छवि पर्याप्त है। यदि सामग्री कई पैनलों पर फैली है, तो 4 तक छवियां जोड़ें।'
              : 'One image is completely sufficient. You can add up to 4 images if ingredients wrap across sides.'}
          </p>
        </div>

        <div className="bg-white border border-[#E7E3DC] rounded-2xl p-6 space-y-2.5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-[#EBF3EE] text-[#2D6A4F] flex items-center justify-center font-bold">
            2
          </div>
          <h2 className="font-bold text-base text-[#1B4332]">
            {isHi ? 'स्वचालित सामान्यीकरण' : 'Smart Normalization'}
          </h2>
          <p className="text-xs text-[#7A827B] leading-relaxed">
            {isHi
              ? 'टाइपो, आईएनएस और ई-नंबरों को सटीक वैधानिक रासायनिक नामों में परिवर्तित किया जाता है।'
              : 'OCR typos, INS codes, and E-numbers are resolved to canonical names while keeping evidence intact.'}
          </p>
        </div>

        <div className="bg-white border border-[#E7E3DC] rounded-2xl p-6 space-y-2.5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-[#EBF3EE] text-[#2D6A4F] flex items-center justify-center font-bold">
            3
          </div>
          <h2 className="font-bold text-base text-[#1B4332]">
            {isHi ? 'अज्ञात ≠ हानिकारक' : 'Unknown ≠ Harmful'}
          </h2>
          <p className="text-xs text-[#7A827B] leading-relaxed">
            {isHi
              ? 'यदि कोई घटक डेटाबेस में नहीं है, तो उसे कभी भी हानिकारक नहीं कहा जाता; केवल मैन्युअल सत्यापन आवश्यक है।'
              : 'If an ingredient is absent from rules, we mark it Unknown for manual review—never as harmful or illegal.'}
          </p>
        </div>
      </div>

      {/* Recent Scans Section (if available) */}
      {recentScans.length > 0 && (
        <div className="bg-white border border-[#E7E3DC] rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#1B4332]">{isHi ? 'हाल के स्कैन' : 'Recent Scans'}</h2>
              <p className="text-xs text-[#7A827B]">{isHi ? 'आपके द्वारा पहले जाँचे गए उत्पाद' : 'Previously verified consumer products'}</p>
            </div>
            <button
              type="button"
              onClick={onViewHistory}
              className="text-xs font-semibold text-[#2D6A4F] hover:underline cursor-pointer"
            >
              {isHi ? 'सभी देखें →' : 'View all →'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {recentScans.slice(0, 3).map((scan) => (
              <button
                type="button"
                key={scan.id}
                onClick={() => onSelectScan(scan)}
                className="text-left p-4 rounded-xl border border-[#E7E3DC] bg-[#FAF8F5] hover:border-[#B7E4C7] hover:bg-[#EBF3EE] transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-[11px] text-[#7A827B] mb-1.5">
                  <span className="font-mono">{scan.id}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-white border border-[#DFDBD3] text-[#2D6A4F]">
                    {scan.domain}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-[#2D322E] group-hover:text-[#1B4332] truncate">
                  {scan.productName || 'Scanned Product'}
                </h3>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-[#535953]">
                    {scan.summary.totalDetected} {isHi ? 'घटक' : 'ingredients'}
                  </span>
                  {scan.summary.requiresAttention > 0 ? (
                    <span className="text-[#B91C1C] font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {scan.summary.requiresAttention} {isHi ? 'ध्यान दें' : 'attention'}
                    </span>
                  ) : (
                    <span className="text-[#2D6A4F] font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      {isHi ? 'स्वीकृत' : 'Compliant'}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions / Explanatory Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-[#EBF3EE] border border-[#C7DECF] text-xs text-[#2D6A4F]">
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-4 h-4 text-[#1B4332] shrink-0" />
          <span>
            {isHi
              ? 'आधिकारिक नियम: एफएसएसएआई खाद्य सुरक्षा मानक और सीडीएससीओ प्रसाधन सामग्री नियम, 2020'
              : 'Regulatory Scope: Authoritative FSSAI Food Additive Standards and CDSCO Cosmetics Rules, 2020'}
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenHowItWorks}
          className="font-bold underline text-[#1B4332] hover:text-[#2D6A4F] flex items-center gap-1 cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{isHi ? 'प्रणाली विवरण' : 'How It Works'}</span>
        </button>
      </div>
    </div>
  );
}
