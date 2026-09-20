import { useState, useEffect } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { TopHeader, ActiveTab } from './components/TopHeader';
import { InspectionWorkspace } from './components/InspectionWorkspace';
import { OverviewDashboard } from './components/OverviewDashboard';
import { ReviewQueueView } from './components/ReviewQueueView';
import { RiskCenterView } from './components/RiskCenterView';
import { RulesManagerView } from './components/RulesManagerView';
import { AssistantDrawer } from './components/AssistantDrawer';
import { PRESET_INSPECTIONS } from './data/presets';
import { InspectionRecord, hasUnresolvedFindings } from './types';
import { requestJson, deleteInspection } from './lib/api';
import { LanguageProvider, useTranslation } from './lib/i18n';
import { UserSessionProvider, useUserSession } from './lib/userSession';
import { InspectorLogin } from './components/InspectorLogin';
import { ConsumerWorkspace } from './components/consumer/ConsumerWorkspace';

function createBlankInspection(): InspectionRecord {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return {
    id: `INSP-${year}-${randomSuffix}`,
    scanId: `scan-${Date.now()}-${randomSuffix}`,
    analysisSource: 'uploaded_image',
    batchReference: `BATCH-${year}-${randomSuffix}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'DRAFT',
    inspectorName: 'Field Officer (Station 04)',
    stationNode: 'NIC-METROLOGY-NODE: #DELHI-WEST-04',
    productName: 'New Packaged Commodity Scan',
    category: 'GENERAL_PACKAGED_COMMODITY',
    isImported: false,
    images: [],
    extractedFields: {},
    boundingBoxes: [],
    findings: [],
    completenessScore: 0,
    summaryCounts: {
      verified: 0,
      violations: 0,
      warnings: 0,
      insufficientEvidence: 0,
      potentialIssues: 0,
      notDetected: 0,
      requiresReview: 0,
      lowConfidence: 0,
      notApplicable: 0,
    },
  };
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('scanner');
  const [showDemoData, setShowDemoData] = useState<boolean>(() => {
    try {
      return localStorage.getItem('nirikshak_demo_data_enabled') === 'true';
    } catch {
      return false;
    }
  });
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [currentInspection, setCurrentInspection] = useState<InspectionRecord>(createBlankInspection);
  const [inspectionOrigin, setInspectionOrigin] = useState<'overview' | 'reviews' | 'risk' | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const { language, setLanguage } = useTranslation();
  const { currentUser, isInspectorAuthenticated, authReady } = useUserSession();
  const currentPath = window.location.pathname;

  const handleToggleDemoData = () => {
    const next = !showDemoData;
    setShowDemoData(next);
    try {
      localStorage.setItem('nirikshak_demo_data_enabled', String(next));
    } catch { }
  };

  const handleSelectInspection = (insp: InspectionRecord, origin: 'overview' | 'reviews' | 'risk' = 'overview') => {
    setCurrentInspection(insp);
    setInspectionOrigin(origin);
    try {
      localStorage.setItem('nirikshak_current_inspection_id', insp.id);
    } catch { }
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('inspectionId', insp.id);
      window.history.pushState({}, '', url.toString());
    } catch { }
    setActiveTab('scanner');
  };

  // Sync latest inspections from backend on mount, tab navigation, and demo mode toggle
  useEffect(() => {
    if (!isInspectorAuthenticated) return;

    async function loadInspections() {
      try {
        const data = await requestJson<{ inspections: InspectionRecord[] }>(
          `/api/inspections?includeDemo=${showDemoData}`
        );
        const fetched = data.inspections || [];
        setInspections(fetched);

        const urlParams = new URLSearchParams(window.location.search);
        const targetId = urlParams.get('inspectionId') || localStorage.getItem('nirikshak_current_inspection_id');

        if (targetId) {
          const matched = fetched.find((i) => i.id === targetId);
          if (matched) {
            setCurrentInspection(matched);
            return;
          }
        }

        setCurrentInspection((prev) => {
          if (prev && prev.id && fetched.some((i) => i.id === prev.id)) {
            return prev;
          }
          return fetched.length > 0 ? fetched[0] : createBlankInspection();
        });
      } catch (err) {
        console.warn('Using local fallback inspections:', err);
      }
    }
    loadInspections();
  }, [activeTab, isInspectorAuthenticated, showDemoData]);

  const [isConsumerMode, setIsConsumerMode] = useState<boolean>(() => {
    try {
      return (
        localStorage.getItem('nirikshak_consumer_mode') === 'true' ||
        window.location.pathname === '/consumer'
      );
    } catch {
      return false;
    }
  });

  const handleEnterConsumerMode = () => {
    setIsConsumerMode(true);
    try {
      localStorage.setItem('nirikshak_consumer_mode', 'true');
      window.history.pushState({}, '', '/consumer');
    } catch { }
  };

  const handleExitConsumerMode = () => {
    setIsConsumerMode(false);
    try {
      localStorage.removeItem('nirikshak_consumer_mode');
      window.history.pushState({}, '', '/login');
    } catch { }
  };

  const authPath = currentPath === '/login' || currentPath === '/signup' || currentPath === '/forgot-password' || currentPath === '/inspector/login';

  // Dedicated Consumer Mode Isolation (No Inspector Auth Required)
  if (isConsumerMode) {
    return (
      <ConsumerWorkspace
        onExitConsumer={handleExitConsumerMode}
        language={language}
        setLanguage={setLanguage}
      />
    );
  }

  if (!authReady) {
    return <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center text-sm text-[#7A827B]">Loading secure workspace...</div>;
  }

  if (authPath) {
    if (!isInspectorAuthenticated) {
      const initialMode = currentPath === '/signup' ? 'signup' : currentPath === '/forgot-password' ? 'forgot' : 'login';
      return <InspectorLogin returnTo="/" initialMode={initialMode} onEnterConsumerMode={handleEnterConsumerMode} />;
    }
    window.history.replaceState({}, '', '/');
  }

  if (!isInspectorAuthenticated) {
    const returnTo = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState({}, '', '/login');
    return <InspectorLogin returnTo={returnTo} onEnterConsumerMode={handleEnterConsumerMode} />;
  }

  const handleUpdateInspection = (updated: InspectionRecord) => {
    setCurrentInspection(updated);
    try {
      localStorage.setItem('nirikshak_current_inspection_id', updated.id);
    } catch {
      // ignore
    }
    setInspections((prev) => {
      const idx = prev.findIndex((item) => item.id === updated.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      }
      return [updated, ...prev];
    });
  };

  const handleDeleteInspection = async (inspectionId: string): Promise<void> => {
    await deleteInspection(inspectionId, currentUser.role, `${currentUser.name} (${currentUser.officerId})`);
    // Remove from local state on successful delete
    setInspections((prev) => prev.filter((i) => i.id !== inspectionId));

    // Clear localStorage pointer if it pointed to this inspection
    try {
      const savedId = localStorage.getItem('nirikshak_current_inspection_id');
      if (savedId === inspectionId) {
        localStorage.removeItem('nirikshak_current_inspection_id');
      }
    } catch { }

    // If the deleted inspection was the active one, switch to the first remaining
    if (currentInspection.id === inspectionId) {
      const remaining = inspections.filter((i) => i.id !== inspectionId);
      if (remaining.length > 0) {
        setCurrentInspection(remaining[0]);
        try {
          localStorage.setItem('nirikshak_current_inspection_id', remaining[0].id);
        } catch { }
      }
    }
  };

  const handleLoadPreset = (presetId: string) => {
    const target = inspections.find((i) => i.id === presetId) || PRESET_INSPECTIONS.find((i) => i.id === presetId);
    if (target) {
      handleSelectInspection(target, 'scanner' as any);
    }
  };

  const pendingReviewCount = inspections.filter(hasUnresolvedFindings).length;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#FAF8F5] text-[#2D322E]">
      {/* Universal Top Header with Standards Portal info */}
      <TopHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingReviewCount={pendingReviewCount}
        language={language}
        setLanguage={setLanguage}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        showDemoData={showDemoData}
        onToggleDemoData={handleToggleDemoData}
      />

      {/* View Switcher */}
      <main className="flex-1">
        {activeTab === 'scanner' && (
          <InspectionWorkspace
            currentInspection={currentInspection}
            onUpdateInspection={handleUpdateInspection}
            onLoadPreset={handleLoadPreset}
            language={language}
            onBackToCommandCenter={inspectionOrigin ? () => setActiveTab(inspectionOrigin) : undefined}
          />
        )}

        {activeTab === 'overview' && (
          <OverviewDashboard
            inspections={inspections}
            onSelectInspection={(insp) => handleSelectInspection(insp, 'overview')}
            onOpenScanner={() => setActiveTab('scanner')}
            onDeleteInspection={handleDeleteInspection}
            showDemoData={showDemoData}
          />
        )}

        {activeTab === 'reviews' && (
          <ReviewQueueView
            inspections={inspections}
            onUpdateInspection={handleUpdateInspection}
            onBackToScanner={() => setActiveTab('scanner')}
          />
        )}

        {activeTab === 'risk' && (
          <RiskCenterView
            showDemoData={showDemoData}
            onOpenInspection={(id) => handleLoadPreset(id)}
          />
        )}

        {activeTab === 'rules' && <RulesManagerView />}
      </main>

      {/* Grounded Statutory Compliance Assistant Drawer */}
      <AssistantDrawer
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        currentInspectionId={currentInspection.id}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <UserSessionProvider>
          <AppContent />
        </UserSessionProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
// font-size-verification-active
