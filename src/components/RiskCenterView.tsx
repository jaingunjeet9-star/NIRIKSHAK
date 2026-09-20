import { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Search,
  Building2,
  MapPin,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertOctagon,
  FileCheck2,
  Database,
  Radio,
  Tag,
  FlaskConical,
  ArrowRight,
  Calendar,
  Eye,
} from 'lucide-react';
import { ManufacturerProfile, InspectionRecord, ComplianceFinding, ManufacturerViolationFinding, RepeatViolationGroup } from '../types';
import { requestJson } from '../lib/api';
import { useTranslation } from '../lib/i18n';
import { MetricDetailModal, MetricType } from './risk/MetricDetailModal';
import { ManufacturerPassportModal } from './risk/ManufacturerPassportModal';
import { ViolationDetailModal } from './risk/ViolationDetailModal';

function formatLastInspection(isoString: string | null): string {
  if (!isoString) return 'No record';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return isoString;
  }
}

interface RiskCenterViewProps {
  showDemoData?: boolean;
  onOpenInspection?: (inspectionId: string) => void;
}

export function RiskCenterView({ showDemoData = false, onOpenInspection }: RiskCenterViewProps) {
  const { t } = useTranslation();
  const [manufacturers, setManufacturers] = useState<ManufacturerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'LIVE' | 'DEMO' | 'HIGH_RISK'>('ALL');
  const [dateFilter, setDateFilter] = useState<'all' | '7d' | '30d' | '90d' | 'year'>('all');

  // Modal State
  const [selectedPassportMfg, setSelectedPassportMfg] = useState<ManufacturerProfile | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<{
    mfg: ManufacturerProfile;
    type: MetricType;
  } | null>(null);

  const [metricModalData, setMetricModalData] = useState<{
    inspections: InspectionRecord[];
    violations: ManufacturerViolationFinding[];
    repeatGroups: RepeatViolationGroup[];
    criticalViolations: ManufacturerViolationFinding[];
  }>({
    inspections: [],
    violations: [],
    repeatGroups: [],
    criticalViolations: [],
  });
  const [loadingMetricData, setLoadingMetricData] = useState(false);

  const [selectedViolationFinding, setSelectedViolationFinding] = useState<{
    inspection: InspectionRecord;
    finding: ComplianceFinding;
    mfg: ManufacturerProfile;
  } | null>(null);

  const loadRiskProfiles = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    try {
      const data = await requestJson<{ manufacturers: ManufacturerProfile[] }>(
        `/api/risk/manufacturers?includeDemo=${showDemoData}`
      );
      if (data.manufacturers) {
        setManufacturers(data.manufacturers);
      }
    } catch (err) {
      console.warn('Failed to fetch live risk passports:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [showDemoData]);

  useEffect(() => {
    loadRiskProfiles();

    // Auto-refresh when tab gains focus so new scans reflect immediately
    const onFocus = () => loadRiskProfiles();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadRiskProfiles]);

  const handleOpenMetric = async (mfg: ManufacturerProfile, type: MetricType) => {
    // Reset stale data first so modal opens with loading state, not previous manufacturer's data
    setMetricModalData({ inspections: [], violations: [], repeatGroups: [], criticalViolations: [] });
    setSelectedMetric({ mfg, type });
    setLoadingMetricData(true);

    try {
      const [inspRes, violRes, repRes, critRes] = await Promise.all([
        requestJson<{ inspections: InspectionRecord[] }>(
          `/api/risk/manufacturers/${mfg.id}/inspections`
        ),
        requestJson<{ violations: ManufacturerViolationFinding[] }>(
          `/api/risk/manufacturers/${mfg.id}/violations`
        ),
        requestJson<{ repeatViolationGroups: RepeatViolationGroup[] }>(
          `/api/risk/manufacturers/${mfg.id}/repeat-violations`
        ),
        requestJson<{ criticalViolations: ManufacturerViolationFinding[] }>(
          `/api/risk/manufacturers/${mfg.id}/critical-violations`
        ),
      ]);

      setMetricModalData({
        inspections: inspRes.inspections || [],
        violations: violRes.violations || [],
        repeatGroups: repRes.repeatViolationGroups || [],
        criticalViolations: critRes.criticalViolations || [],
      });
    } catch (err) {
      console.warn('Failed to load metric drill-down data:', err);
      // Keep modal open so user sees it — empty state will show
    } finally {
      setLoadingMetricData(false);
    }
  };

  const handleRecentViolationClick = async (mfg: ManufacturerProfile, violationStr: string) => {
    try {
      const violRes = await requestJson<{ violations: ManufacturerViolationFinding[] }>(
        `/api/risk/manufacturers/${mfg.id}/violations`
      );
      if (violRes.violations && violRes.violations.length > 0) {
        // Try to match the clicked violation text
        const ruleMatch = violationStr.match(/^([A-Za-z0-9\(\)\-\.]+)/);
        const ruleId = ruleMatch ? ruleMatch[1] : '';

        const matched = violRes.violations.find((v) =>
          ruleId ? v.finding.sectionRef?.includes(ruleId) || v.finding.ruleId.includes(ruleId) : true
        ) || violRes.violations[0];

        setSelectedViolationFinding({
          inspection: matched.inspection,
          finding: matched.finding,
          mfg,
        });
      }
    } catch (err) {
      console.warn('Failed to fetch violation details for recent item:', err);
    }
  };

  const filtered = manufacturers.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'LIVE') return !m.isDemoData;
    if (filterType === 'DEMO') return m.isDemoData;
    if (filterType === 'HIGH_RISK') return m.riskLevel === 'HIGH';
    return true;
  });

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 md:px-10 py-6 md:py-8 space-y-6 md:space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E7E3DC] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FBF3E8] border border-[#EED9C4] rounded-lg mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-[#8C5E2D]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C5E2D]">
              MANUFACTURER COMPLIANCE PASSPORT
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#2D322E] tracking-tight">
            Manufacturer & Importer Compliance Passports
          </h2>
          <p className="text-xs md:text-sm text-[#535953] mt-1 max-w-3xl">
            Live statutory audit records, repeat violation tracking, critical omission monitoring, and legal compounding risk calculated live from real inspection data. Click any metric to trace database evidence.
          </p>
        </div>

        {/* Controls: Search & Refresh */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 text-[#7A827B] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search manufacturer, license, state..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-white border border-[#E7E3DC] rounded-xl text-xs text-[#2D322E] focus:outline-none focus:border-[#52796F]"
            />
          </div>
          <button
            type="button"
            onClick={() => loadRiskProfiles(true)}
            disabled={isRefreshing}
            className="h-11 px-3.5 bg-white hover:bg-[#FAF8F5] border border-[#E7E3DC] rounded-xl flex items-center justify-center text-[#535953] hover:text-[#2D322E] transition-colors cursor-pointer shrink-0"
            title="Refresh live passport data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#52796F]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs & Date Range Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 p-1 bg-[#FAF8F5] rounded-xl border border-[#E7E3DC] overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filterType === 'ALL'
                ? 'bg-white text-[#2D322E] shadow-2xs border border-[#E7E3DC]'
                : 'text-[#7A827B] hover:text-[#2D322E]'
            }`}
          >
            All Entities ({manufacturers.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('LIVE')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filterType === 'LIVE'
                ? 'bg-white text-[#335E46] shadow-2xs border border-[#E7E3DC]'
                : 'text-[#7A827B] hover:text-[#2D322E]'
            }`}
          >
            Live Scans ({manufacturers.filter((m) => !m.isDemoData).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('HIGH_RISK')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filterType === 'HIGH_RISK'
                ? 'bg-white text-[#9E432A] shadow-2xs border border-[#E7E3DC]'
                : 'text-[#7A827B] hover:text-[#2D322E]'
            }`}
          >
            High Risk ({manufacturers.filter((m) => m.riskLevel === 'HIGH').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('DEMO')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filterType === 'DEMO'
                ? 'bg-white text-[#8C5E2D] shadow-2xs border border-[#E7E3DC]'
                : 'text-[#7A827B] hover:text-[#2D322E]'
            }`}
          >
            Demo Seeded ({manufacturers.filter((m) => m.isDemoData).length})
          </button>
        </div>

        <div className="text-[11px] text-[#7A827B] flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-[#52796F] animate-pulse" />
          <span>Real-time aggregations calculated on read</span>
        </div>
      </div>

      {/* Profiles Grid */}
      {loading ? (
        <div className="p-16 text-center text-xs text-[#7A827B] bg-white border border-[#E7E3DC] rounded-2xl">
          <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-[#52796F]" />
          Loading live manufacturer compliance passports...
        </div>
      ) : manufacturers.length === 0 ? (
        <div className="p-16 text-center bg-white border border-[#E7E3DC] rounded-2xl space-y-3">
          <Building2 className="w-10 h-10 text-[#7A827B] mx-auto opacity-50" />
          <h3 className="text-base font-bold text-[#2D322E]">No manufacturer compliance passports yet</h3>
          <p className="text-xs text-[#7A827B] max-w-md mx-auto">
            Scan and audit product packaging in the Scanner workspace to automatically build live statutory manufacturer compliance passports.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-16 text-center text-xs text-[#7A827B] bg-white border border-[#E7E3DC] rounded-2xl">
          No manufacturers found matching "{searchTerm}".
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((mfg) => (
            <div
              key={mfg.id}
              className="bg-white border border-[#E7E3DC] rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-5 hover:border-[#D5CFC5] transition-all"
            >
              <div>
                {/* Responsive Header (Prevent Badge Overflow on 320px-1920px viewports) */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E7E3DC] flex items-center justify-center text-[#52796F] shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => setSelectedPassportMfg(mfg)}
                        className="text-left font-bold text-sm text-[#2D322E] hover:text-[#52796F] transition-colors truncate block max-w-full cursor-pointer"
                        title={`${mfg.name} — Click to open full passport`}
                      >
                        {mfg.name}
                      </button>
                      <div className="flex items-center gap-1 text-[11px] text-[#7A827B] mt-0.5 truncate">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate" title={mfg.state}>{mfg.state}</span>
                      </div>
                    </div>
                  </div>

                  {/* Responsive Wrapping Badges Container */}
                  <div className="flex flex-wrap items-center sm:flex-col sm:items-end gap-1.5 shrink-0">
                    <span
                      className={`px-2 py-0.5 font-mono text-[10px] font-bold rounded border ${
                        mfg.riskLevel === 'HIGH'
                          ? 'bg-[#FAECE7] text-[#9E432A] border-[#F7D0C4]'
                          : mfg.riskLevel === 'MEDIUM'
                          ? 'bg-[#FBF3E8] text-[#8C5E2D] border-[#EED9C4]'
                          : 'bg-[#EBF3EE] text-[#335E46] border-[#C7DECF]'
                      }`}
                    >
                      {mfg.riskLevel === 'HIGH' ? 'HIGH RISK' : mfg.riskLevel === 'MEDIUM' ? 'MEDIUM RISK' : 'LOW RISK'}
                    </span>

                    {mfg.isDemoData ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#FEF3C7] border border-[#F59E0B] rounded text-[9px] font-mono font-bold text-[#92400E]">
                        <FlaskConical className="w-2.5 h-2.5 text-[#D97706]" />
                        <span>DEMO DATA</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#EBF3EE] border border-[#C7DECF] rounded text-[9px] font-mono font-bold text-[#335E46]">
                        <FileCheck2 className="w-2.5 h-2.5" />
                        <span>Live Verified</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* 6 Interactive Clickable Compliance Passport Metrics */}
                <div className="mt-4 p-3 bg-[#FAF8F5] rounded-xl border border-[#E7E3DC] grid grid-cols-3 gap-2 text-center">
                  {/* Metric 1: Products Inspected */}
                  <button
                    type="button"
                    onClick={() => handleOpenMetric(mfg, 'PRODUCTS_INSPECTED')}
                    className="p-1.5 rounded-lg bg-white/90 hover:bg-white border border-[#E7E3DC] hover:border-[#52796F] transition-all cursor-pointer group text-left flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between text-[9px] font-bold text-[#7A827B] uppercase w-full">
                      <span className="truncate">Products</span>
                      <ArrowRight className="w-2.5 h-2.5 text-[#7A827B] group-hover:text-[#52796F] transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <span className="font-mono text-sm font-bold text-[#2D322E] block mt-0.5">
                      {mfg.productsInspected}
                    </span>
                  </button>

                  {/* Metric 2: Compliant */}
                  <button
                    type="button"
                    onClick={() => handleOpenMetric(mfg, 'COMPLIANT')}
                    className="p-1.5 rounded-lg bg-white/90 hover:bg-white border border-[#E7E3DC] hover:border-[#335E46] transition-all cursor-pointer group text-left flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between text-[9px] font-bold text-[#335E46] uppercase w-full">
                      <span className="truncate">Compliant</span>
                      <ArrowRight className="w-2.5 h-2.5 text-[#335E46] transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <span className="font-mono text-sm font-bold text-[#335E46] block mt-0.5">
                      {mfg.compliant}
                    </span>
                  </button>

                  {/* Metric 3: Violations */}
                  <button
                    type="button"
                    onClick={() => handleOpenMetric(mfg, 'VIOLATIONS')}
                    className="p-1.5 rounded-lg bg-white/90 hover:bg-white border border-[#E7E3DC] hover:border-[#9E432A] transition-all cursor-pointer group text-left flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between text-[9px] font-bold text-[#9E432A] uppercase w-full">
                      <span className="truncate">Violations</span>
                      <ArrowRight className="w-2.5 h-2.5 text-[#9E432A] transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <span className="font-mono text-sm font-bold text-[#9E432A] block mt-0.5">
                      {mfg.violations}
                    </span>
                  </button>

                  {/* Metric 4: Repeat Violations */}
                  <button
                    type="button"
                    onClick={() => handleOpenMetric(mfg, 'REPEAT_VIOLATIONS')}
                    className={`p-1.5 rounded-lg border transition-all cursor-pointer group text-left flex flex-col justify-between ${
                      mfg.repeatViolations > 0
                        ? 'bg-[#FAECE7] hover:bg-[#F5DFD7] border-[#F7D0C4] text-[#9E432A]'
                        : 'bg-white/90 hover:bg-white border-[#E7E3DC] hover:border-[#8C5E2D]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[9px] font-bold uppercase w-full">
                      <span className="truncate">Repeat</span>
                      <ArrowRight className="w-2.5 h-2.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <span className="font-mono text-sm font-bold block mt-0.5">
                      {mfg.repeatViolations}
                    </span>
                  </button>

                  {/* Metric 5: Critical Violations */}
                  <button
                    type="button"
                    onClick={() => handleOpenMetric(mfg, 'CRITICAL_VIOLATIONS')}
                    className={`p-1.5 rounded-lg border transition-all cursor-pointer group text-left flex flex-col justify-between ${
                      mfg.criticalViolations > 0
                        ? 'bg-[#FAECE7] hover:bg-[#F5DFD7] border-[#F7D0C4] text-[#9E432A]'
                        : 'bg-white/90 hover:bg-white border-[#E7E3DC] hover:border-[#9E432A]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[9px] font-bold uppercase w-full">
                      <span className="truncate">Critical</span>
                      <ArrowRight className="w-2.5 h-2.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <span className="font-mono text-sm font-bold block mt-0.5">
                      {mfg.criticalViolations}
                    </span>
                  </button>

                  {/* Metric 6: Last Inspection */}
                  <button
                    type="button"
                    onClick={() => handleOpenMetric(mfg, 'LAST_INSPECTION')}
                    className="p-1.5 rounded-lg bg-white/90 hover:bg-white border border-[#E7E3DC] hover:border-[#52796F] transition-all cursor-pointer group text-left flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between text-[9px] font-bold text-[#7A827B] uppercase w-full">
                      <span className="truncate">Last Insp.</span>
                      <ArrowRight className="w-2.5 h-2.5 text-[#7A827B] group-hover:text-[#52796F] transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <span className="font-mono text-[11px] font-semibold text-[#535953] block mt-0.5 truncate">
                      {formatLastInspection(mfg.lastInspection)}
                    </span>
                  </button>
                </div>

                {/* Repeating Rules Callout */}
                {mfg.repeatViolationRules && mfg.repeatViolationRules.length > 0 && (
                  <div className="mt-3 p-2.5 bg-[#FAECE7] border border-[#F7D0C4] rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-[10px] uppercase text-[#9E432A]">
                        <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
                        <span>Repeat Rule Infractions</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenMetric(mfg, 'REPEAT_VIOLATIONS')}
                        className="text-[10px] font-bold text-[#9E432A] hover:underline cursor-pointer"
                      >
                        View All ({mfg.repeatViolationRules.length}) →
                      </button>
                    </div>

                    <div className="space-y-1">
                      {mfg.repeatViolationRules.map((rule) => (
                        <button
                          key={rule.ruleId}
                          type="button"
                          onClick={() => handleOpenMetric(mfg, 'REPEAT_VIOLATIONS')}
                          className="w-full flex items-center justify-between text-[11px] text-[#9E432A] font-mono bg-white/80 hover:bg-white px-2 py-1 rounded text-left transition-colors cursor-pointer"
                        >
                          <span className="font-semibold truncate">
                            {rule.sectionRef} — {rule.title}
                          </span>
                          <span className="shrink-0 font-bold ml-2">
                            violated {rule.count}×
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dynamic Live Risk Assessment */}
                <div className="mt-4 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A827B] block mb-1">
                    Risk Assessment:
                  </span>
                  <p className="text-[#535953] leading-relaxed text-[11px] bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E7E3DC]/80">
                    {mfg.riskReason}
                  </p>
                </div>

                {/* Clickable Recent Violations List */}
                {mfg.recentViolations && mfg.recentViolations.length > 0 ? (
                  <div className="mt-3 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E432A] block mb-1">
                      Recent Violations (Click to investigate):
                    </span>
                    <ul className="space-y-1.5">
                      {mfg.recentViolations.map((v, i) => (
                        <li key={i}>
                          <button
                            type="button"
                            onClick={() => handleRecentViolationClick(mfg, v)}
                            className="w-full text-left text-[11px] text-[#9E432A] bg-[#FAECE7]/50 hover:bg-[#FAECE7] p-2 rounded-lg border border-[#F7D0C4]/60 flex items-center justify-between gap-1.5 transition-colors cursor-pointer group"
                          >
                            <div className="flex items-start gap-1.5 min-w-0">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#9E432A]" />
                              <span className="leading-tight truncate">{v}</span>
                            </div>
                            <span className="text-[10px] font-bold text-[#9E432A] opacity-80 group-hover:opacity-100 shrink-0">
                              View →
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="mt-3 text-[11px] text-[#335E46] bg-[#EBF3EE]/60 px-2.5 py-1.5 rounded-lg border border-[#C7DECF] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#335E46]" />
                    <span>No statutory violations recorded.</span>
                  </div>
                )}
              </div>

              {/* Card Footer: License */}
              <div className="pt-3 border-t border-[#E7E3DC] flex justify-between items-center text-[11px] text-[#7A827B] font-mono">
                <span className="truncate max-w-[180px]" title={mfg.licenseNumber}>
                  LIC: {mfg.licenseNumber}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {selectedPassportMfg && (
        <ManufacturerPassportModal
          manufacturer={selectedPassportMfg}
          onClose={() => setSelectedPassportMfg(null)}
          onOpenInspection={onOpenInspection}
        />
      )}

      {selectedMetric && (
        <MetricDetailModal
          metricType={selectedMetric.type}
          manufacturer={selectedMetric.mfg}
          inspections={metricModalData.inspections}
          violations={metricModalData.violations}
          repeatGroups={metricModalData.repeatGroups}
          criticalViolations={metricModalData.criticalViolations}
          isLoading={loadingMetricData}
          onClose={() => setSelectedMetric(null)}
          onOpenInspection={onOpenInspection}
        />
      )}

      {selectedViolationFinding && (
        <ViolationDetailModal
          inspection={selectedViolationFinding.inspection}
          finding={selectedViolationFinding.finding}
          manufacturerName={selectedViolationFinding.mfg.name}
          manufacturerAddress={selectedViolationFinding.mfg.state}
          manufacturerId={selectedViolationFinding.mfg.id}
          onClose={() => setSelectedViolationFinding(null)}
          onOpenInspection={onOpenInspection}
        />
      )}
    </div>
  );
}
