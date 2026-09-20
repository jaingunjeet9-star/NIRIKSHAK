import { Shield, Sparkles, History, HelpCircle, ScanLine, LogOut } from 'lucide-react';
import { Language } from '../../lib/i18n';

export type ConsumerTab = 'dashboard' | 'scanner' | 'history';

interface ConsumerTopHeaderProps {
  activeTab: ConsumerTab;
  setActiveTab: (tab: ConsumerTab) => void;
  onOpenHowItWorks: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  onExitConsumer: () => void;
  historyCount?: number;
}

export function ConsumerTopHeader({
  activeTab,
  setActiveTab,
  onOpenHowItWorks,
  language,
  setLanguage,
  onExitConsumer,
  historyCount = 0,
}: ConsumerTopHeaderProps) {
  const isHi = language === 'HI';

  return (
    <header className="bg-white border-b border-[#E7E3DC] sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Branding & Consumer Badge */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-[#2D6A4F] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-[#1B4332]">NIRIKSHAK</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-[#D8F3DC] text-[#1B4332] px-2 py-0.5 rounded-full border border-[#B7E4C7]">
                  <Sparkles className="w-2.5 h-2.5" />
                  {isHi ? 'उपभोक्ता मोड' : 'Consumer Mode'}
                </span>
              </div>
              <p className="text-[10px] font-medium text-[#7A827B]">
                {isHi ? 'सामग्री सुरक्षा व वैधानिक सत्यापन' : 'Ingredient Safety & Regulatory Verification'}
              </p>
            </div>
          </button>
        </div>

        {/* Center: Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-[#EBF3EE] text-[#2D6A4F]'
                : 'text-[#535953] hover:bg-[#FAF8F5] hover:text-[#2D322E]'
            }`}
          >
            {isHi ? 'डैशबोर्ड' : 'Dashboard'}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('scanner')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'scanner'
                ? 'bg-[#2D6A4F] text-white shadow-xs'
                : 'text-[#535953] hover:bg-[#FAF8F5] hover:text-[#2D322E]'
            }`}
          >
            <ScanLine className="w-3.5 h-3.5" />
            {isHi ? 'सामग्री स्कैनर' : 'Scan Ingredients'}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'bg-[#EBF3EE] text-[#2D6A4F]'
                : 'text-[#535953] hover:bg-[#FAF8F5] hover:text-[#2D322E]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>{isHi ? 'स्कैन इतिहास' : 'Scan History'}</span>
            {historyCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-[#E7E3DC] text-[#535953] text-[10px] rounded-full font-bold">
                {historyCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenHowItWorks}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#535953] hover:bg-[#FAF8F5] hover:text-[#2D322E] flex items-center gap-1 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            {isHi ? 'यह कैसे काम करता है' : 'How It Works'}
          </button>
        </nav>

        {/* Right: Language switch & Exit to Inspector Login */}
        <div className="flex items-center gap-2.5">
          {/* Language toggle */}
          <div className="flex items-center bg-[#FAF8F5] border border-[#DFDBD3] rounded-lg p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setLanguage('EN')}
              className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                language === 'EN' ? 'bg-white text-[#2D6A4F] shadow-xs' : 'text-[#7A827B]'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('HI')}
              className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                language === 'HI' ? 'bg-white text-[#2D6A4F] shadow-xs' : 'text-[#7A827B]'
              }`}
            >
              हिन्दी
            </button>
          </div>

          {/* Exit / Switch to Inspector Mode */}
          <button
            type="button"
            onClick={onExitConsumer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DFDBD3] bg-[#FAF8F5] text-xs font-semibold text-[#535953] hover:bg-[#F2F0E8] hover:text-[#1B4332] cursor-pointer transition-colors"
            title="Return to Inspector Login"
          >
            <LogOut className="w-3.5 h-3.5 text-[#7A827B]" />
            <span className="hidden sm:inline">{isHi ? 'निरीक्षक लॉगिन' : 'Inspector Login'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
