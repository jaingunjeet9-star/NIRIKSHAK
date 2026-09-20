import { useState, useEffect } from 'react';
import { ConsumerTopHeader, ConsumerTab } from './ConsumerTopHeader';
import { ConsumerDashboard } from './ConsumerDashboard';
import { ConsumerScanner } from './ConsumerScanner';
import { ConsumerResultView } from './ConsumerResultView';
import { ConsumerHistoryView } from './ConsumerHistoryView';
import { ConsumerHowItWorksModal } from './ConsumerHowItWorksModal';
import { ConsumerScanRecord } from '../../types/consumerTypes';
import { Language } from '../../lib/i18n';

interface ConsumerWorkspaceProps {
  onExitConsumer: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

export function ConsumerWorkspace({ onExitConsumer, language, setLanguage }: ConsumerWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<ConsumerTab>('dashboard');
  const [currentScan, setCurrentScan] = useState<ConsumerScanRecord | null>(null);
  const [scans, setScans] = useState<ConsumerScanRecord[]>([]);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);

  // Load history from API
  useEffect(() => {
    async function loadScans() {
      try {
        const res = await fetch('/api/consumer/history');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.scans)) {
            setScans(data.scans);
          }
        }
      } catch (err) {
        console.warn('[ConsumerWorkspace] Failed to fetch scan history:', err);
      }
    }
    loadScans();
  }, [activeTab]);

  const handleScanComplete = (scan: ConsumerScanRecord) => {
    setCurrentScan(scan);
    setScans((prev) => [scan, ...prev.filter((s) => s.id !== scan.id)]);
    setActiveTab('scanner'); // stay in scanner view to show result
  };

  const handleSelectScan = (scan: ConsumerScanRecord) => {
    setCurrentScan(scan);
    setActiveTab('scanner');
  };

  const handleDeleteScan = async (id: string) => {
    try {
      await fetch(`/api/consumer/scan/${id}`, { method: 'DELETE' });
      setScans((prev) => prev.filter((s) => s.id !== id));
      if (currentScan?.id === id) {
        setCurrentScan(null);
      }
    } catch (err) {
      console.error('[ConsumerWorkspace] Error deleting scan:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#FAF8F5] text-[#2D322E]">
      <ConsumerTopHeader
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'scanner' && currentScan) {
            // keep current scan open
          } else if (tab !== 'scanner') {
            // switching away
          }
        }}
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
        language={language}
        setLanguage={setLanguage}
        onExitConsumer={onExitConsumer}
        historyCount={scans.length}
      />

      <main className="flex-1">
        {activeTab === 'dashboard' && (
          <ConsumerDashboard
            onStartScan={() => {
              setCurrentScan(null);
              setActiveTab('scanner');
            }}
            onViewHistory={() => setActiveTab('history')}
            onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
            recentScans={scans}
            onSelectScan={handleSelectScan}
            language={language}
          />
        )}

        {activeTab === 'scanner' && (
          <>
            {currentScan ? (
              <ConsumerResultView
                scan={currentScan}
                onBackToScanner={() => setCurrentScan(null)}
                language={language}
              />
            ) : (
              <ConsumerScanner onScanComplete={handleScanComplete} language={language} />
            )}
          </>
        )}

        {activeTab === 'history' && (
          <ConsumerHistoryView
            scans={scans}
            onSelectScan={handleSelectScan}
            onDeleteScan={handleDeleteScan}
            onStartNewScan={() => {
              setCurrentScan(null);
              setActiveTab('scanner');
            }}
            language={language}
          />
        )}
      </main>

      <ConsumerHowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
        language={language}
      />
    </div>
  );
}
