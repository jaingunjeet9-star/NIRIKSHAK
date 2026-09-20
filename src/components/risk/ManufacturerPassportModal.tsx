import { useState, useEffect } from 'react';
import {
  X,
  Building2,
  MapPin,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Clock,
  FileCheck2,
  FileText,
  Eye,
  TrendingUp,
  Filter,
  Calendar,
  Search,
  Download,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import {
  ManufacturerProfile,
  InspectionRecord,
  ManufacturerViolationFinding,
  RepeatViolationGroup,
  ComplianceDocument,
  ComplianceFinding,
} from '../../types';
import { requestJson } from '../../lib/api';
import { exportNoticeToPDF } from '../../lib/noticePdfExport';
import { ViolationDetailModal } from './ViolationDetailModal';
import { EvidenceViewerModal } from './EvidenceViewerModal';
import { NoticeReviewModal } from './NoticeReviewModal';

import { isFindingViolation } from '../../engine/passportCalculator';

type PassportTab =
  | 'OVERVIEW'
  | 'PRODUCTS'
  | 'INSPECTIONS'
  | 'VIOLATIONS'
  | 'REPEAT_VIOLATIONS'
  | 'CRITICAL_VIOLATIONS'
  | 'COMPLIANCE_TREND'
  | 'NOTICES_MEMOS'
  | 'EVIDENCE';

type DateFilterOption = '7d' | '30d' | '90d' | 'year' | 'all';

interface ManufacturerPassportModalProps {
  manufacturer: ManufacturerProfile;
  onClose: () => void;
  onOpenInspection?: (inspectionId: string) => void;
}

export function ManufacturerPassportModal({
  manufacturer,
  onClose,
  onOpenInspection,
}: ManufacturerPassportModalProps) {
  const [activeTab, setActiveTab] = useState<PassportTab>('OVERVIEW');
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Live state fetched from server
  const [rawInspections, setRawInspections] = useState<InspectionRecord[]>([]);
  const [rawViolations, setRawViolations] = useState<ManufacturerViolationFinding[]>([]);
  const [rawRepeatGroups, setRawRepeatGroups] = useState<RepeatViolationGroup[]>([]);
  const [rawCriticalViolations, setRawCriticalViolations] = useState<ManufacturerViolationFinding[]>([]);
  const [rawDocuments, setRawDocuments] = useState<ComplianceDocument[]>([]);

  const [selectedFinding, setSelectedFinding] = useState<{
    inspection: InspectionRecord;
    finding: ComplianceFinding;
  } | null>(null);

  const [selectedNoticeDoc, setSelectedNoticeDoc] = useState<ComplianceDocument | null>(null);

  const [evidenceInspection, setEvidenceInspection] = useState<InspectionRecord | null>(null);
  const [noticeTarget, setNoticeTarget] = useState<{
    inspection: InspectionRecord;
    finding: ComplianceFinding;
  } | null>(null);

  // Fetch real data for this manufacturer
  useEffect(() => {
    async function loadPassportData() {
      setLoading(true);
      setError(null);
      try {
        const [inspRes, violRes, repRes, critRes, docRes] = await Promise.all([
          requestJson<{ inspections: InspectionRecord[] }>(
            `/api/risk/manufacturers/${manufacturer.id}/inspections`
          ),
          requestJson<{ violations: ManufacturerViolationFinding[] }>(
            `/api/risk/manufacturers/${manufacturer.id}/violations`
          ),
          requestJson<{ repeatViolationGroups: RepeatViolationGroup[] }>(
            `/api/risk/manufacturers/${manufacturer.id}/repeat-violations`
          ),
          requestJson<{ criticalViolations: ManufacturerViolationFinding[] }>(
            `/api/risk/manufacturers/${manufacturer.id}/critical-violations`
          ),
          requestJson<{ documents: ComplianceDocument[] }>(
            `/api/documents?manufacturerId=${manufacturer.id}`
          ),
        ]);

        if (inspRes.inspections) setRawInspections(inspRes.inspections);
        if (violRes.violations) setRawViolations(violRes.violations);
        if (repRes.repeatViolationGroups) setRawRepeatGroups(repRes.repeatViolationGroups);
        if (critRes.criticalViolations) setRawCriticalViolations(critRes.criticalViolations);
        if (docRes.documents) setRawDocuments(docRes.documents);
      } catch (err) {
        console.warn('Error fetching passport details:', err);
        setError('Unable to load live manufacturer compliance data. Check connection.');
      } finally {
        setLoading(false);
      }
    }

    loadPassportData();
  }, [manufacturer.id]);

  // Apply Date Filter to inspections & violations
  const filterByDate = (dateStr: string | null | undefined): boolean => {
    if (dateFilter === 'all' || !dateStr) return true;
    const time = new Date(dateStr).getTime();
    if (isNaN(time)) return true;
    const now = Date.now();
    const diffDays = (now - time) / (1000 * 60 * 60 * 24);

    if (dateFilter === '7d') return diffDays <= 7;
    if (dateFilter === '30d') return diffDays <= 30;
    if (dateFilter === '90d') return diffDays <= 90;
    if (dateFilter === 'year') return new Date(dateStr).getFullYear() === new Date().getFullYear();
    return true;
  };

  const filteredInspections = rawInspections.filter((i) => filterByDate(i.createdAt));
  const filteredViolations = rawViolations.filter((v) => filterByDate(v.inspection.createdAt));
  const filteredCriticalViolations = rawCriticalViolations.filter((c) => filterByDate(c.inspection.createdAt));
  const filteredDocuments = rawDocuments.filter((d) => filterByDate(d.createdAt));

  // Compute metrics based on date filter
  const productsCount = filteredInspections.length;
  const compliantCount = filteredInspections.filter((i) => {
    const findings = i.findings || [];
    const hasViolations = findings.some((f) => isFindingViolation(f));
    return !hasViolations && i.status === 'COMPLETED';
  }).length;
  const violationsCount = filteredViolations.length;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 md:p-6 overflow-y-auto">
        <div className="bg-white border border-[#E7E3DC] rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* Top Banner Header */}
          <div className="p-6 border-b border-[#E7E3DC] bg-[#FAF8F5] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-white border border-[#E7E3DC] flex items-center justify-center text-[#52796F] shrink-0 shadow-xs">
                <Building2 className="w-6 h-6" />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg md:text-xl font-bold text-[#2D322E]">
                    {manufacturer.name}
                  </h2>
                  <span
                    className={`px-2.5 py-0.5 font-mono text-[10px] font-bold rounded border ${manufacturer.riskLevel === 'HIGH'
                        ? 'bg-[#FAECE7] text-[#9E432A] border-[#F7D0C4]'
                        : manufacturer.riskLevel === 'MEDIUM'
                          ? 'bg-[#FBF3E8] text-[#8C5E2D] border-[#EED9C4]'
                          : 'bg-[#EBF3EE] text-[#335E46] border-[#C7DECF]'
                      }`}
                  >
                    {manufacturer.riskLevel} RISK
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-[#7A827B] mt-1 font-mono">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {manufacturer.state}
                  </span>
                  <span>LIC: {manufacturer.licenseNumber}</span>
                  <span className="text-[#335E46] font-bold">MANUFACTURER COMPLIANCE PASSPORT</span>
                </div>
              </div>
            </div>

            {/* Date Filter Bar & Close */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-1 bg-white border border-[#E7E3DC] rounded-xl p-1 text-xs">
                <Calendar className="w-3.5 h-3.5 text-[#7A827B] ml-2" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as DateFilterOption)}
                  className="h-8 px-2 bg-transparent text-xs font-semibold text-[#2D322E] focus:outline-none cursor-pointer"
                >
                  <option value="all">All Time</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                  <option value="year">This Year (2026)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-xl hover:bg-[#E7E3DC] flex items-center justify-center text-[#7A827B] hover:text-[#2D322E] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="flex items-center gap-1 px-6 border-b border-[#E7E3DC] bg-[#FAF8F5] overflow-x-auto scrollbar-none text-xs font-semibold">
            {[
              { id: 'OVERVIEW', label: 'Overview' },
              { id: 'PRODUCTS', label: `Products (${productsCount})` },
              { id: 'INSPECTIONS', label: `Inspections (${filteredInspections.length})` },
              { id: 'VIOLATIONS', label: `Violations (${violationsCount})` },
              { id: 'REPEAT_VIOLATIONS', label: `Repeat Rules (${rawRepeatGroups.length})` },
              { id: 'CRITICAL_VIOLATIONS', label: `Critical (${filteredCriticalViolations.length})` },
              { id: 'NOTICES_MEMOS', label: `Documents (${filteredDocuments.length})` },
              { id: 'EVIDENCE', label: 'Evidence' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as PassportTab)}
                className={`py-3 px-3.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === tab.id
                    ? 'border-[#52796F] text-[#335E46] font-bold bg-white/60'
                    : 'border-transparent text-[#7A827B] hover:text-[#2D322E]'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {loading ? (
              <div className="p-16 text-center text-xs text-[#7A827B] space-y-2">
                <div className="w-6 h-6 border-2 border-[#52796F] border-t-transparent rounded-full animate-spin mx-auto" />
                <p>Loading live manufacturer compliance data...</p>
              </div>
            ) : error ? (
              <div className="p-10 text-center text-xs text-[#9E432A] bg-[#FAECE7] border border-[#F7D0C4] rounded-xl space-y-1">
                <AlertOctagon className="w-8 h-8 text-[#9E432A] mx-auto mb-2" />
                <h4 className="font-bold text-sm">Query Failure</h4>
                <p>{error}</p>
              </div>
            ) : (
              <>
                {/* 1. OVERVIEW */}
                {activeTab === 'OVERVIEW' && (
                  <div className="space-y-6">
                    {/* Summary Metrics Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
                      <div className="p-3 bg-[#FAF8F5] border border-[#E7E3DC] rounded-xl">
                        <span className="text-[10px] font-bold text-[#7A827B] uppercase block">Products</span>
                        <span className="font-mono text-lg font-bold text-[#2D322E] mt-0.5 block">{productsCount}</span>
                      </div>
                      <div className="p-3 bg-[#FAF8F5] border border-[#E7E3DC] rounded-xl">
                        <span className="text-[10px] font-bold text-[#335E46] uppercase block">Compliant</span>
                        <span className="font-mono text-lg font-bold text-[#335E46] mt-0.5 block">{compliantCount}</span>
                      </div>
                      <div className="p-3 bg-[#FAF8F5] border border-[#E7E3DC] rounded-xl">
                        <span className="text-[10px] font-bold text-[#9E432A] uppercase block">Violations</span>
                        <span className="font-mono text-lg font-bold text-[#9E432A] mt-0.5 block">{violationsCount}</span>
                      </div>
                      <div className="p-3 bg-[#FAF8F5] border border-[#E7E3DC] rounded-xl">
                        <span className="text-[10px] font-bold text-[#9E432A] uppercase block">Repeat Rules</span>
                        <span className="font-mono text-lg font-bold text-[#9E432A] mt-0.5 block">{rawRepeatGroups.length}</span>
                      </div>
                      <div className="p-3 bg-[#FAF8F5] border border-[#E7E3DC] rounded-xl">
                        <span className="text-[10px] font-bold text-[#9E432A] uppercase block">Critical</span>
                        <span className="font-mono text-lg font-bold text-[#9E432A] mt-0.5 block">{filteredCriticalViolations.length}</span>
                      </div>
                      <div className="p-3 bg-[#FAF8F5] border border-[#E7E3DC] rounded-xl">
                        <span className="text-[10px] font-bold text-[#7A827B] uppercase block">Documents</span>
                        <span className="font-mono text-lg font-bold text-[#52796F] mt-0.5 block">{filteredDocuments.length}</span>
                      </div>
                    </div>

                    {/* Dynamic Risk Assessment Box */}
                    <div className="p-4 bg-[#FAF8F5] border border-[#E7E3DC] rounded-xl space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A827B]">
                        Live Statutory Risk Assessment
                      </span>
                      <p className="text-xs text-[#535953] leading-relaxed bg-white p-3 rounded-lg border border-[#E7E3DC]">
                        {manufacturer.riskReason}
                      </p>
                    </div>

                    {/* Recent Violations Highlights */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#9E432A] flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        Recent Statutory Infractions
                      </h4>

                      {filteredViolations.length === 0 ? (
                        <div className="p-6 text-center text-xs text-[#335E46] bg-[#EBF3EE] border border-[#C7DECF] rounded-xl space-y-1">
                          <CheckCircle2 className="w-6 h-6 text-[#335E46] mx-auto mb-1" />
                          <p className="font-bold">No statutory violations recorded in selected timeframe.</p>
                          <p className="text-[11px] text-[#535953]">All product packaging complies with statutory declarations.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {filteredViolations.slice(0, 4).map(({ finding, inspection }, i) => (
                            <div
                              key={i}
                              className="p-3.5 bg-[#FAECE7]/50 border border-[#F7D0C4] rounded-xl flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="space-y-0.5">
                                <span className="font-bold text-[#2D322E]">{inspection.productName}</span>
                                <p className="font-mono text-[11px] text-[#9E432A]">
                                  {finding.sectionRef} — {finding.title}
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedFinding({ inspection, finding })}
                                  className="px-3 py-1.5 bg-white border border-[#E7E3DC] hover:bg-[#FAF8F5] rounded-lg text-xs font-semibold text-[#2D322E] cursor-pointer shrink-0"
                                >
                                  View Details
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setNoticeTarget({ inspection, finding })}
                                  className="px-3 py-1.5 bg-[#9E432A] hover:bg-[#853722] text-white rounded-lg text-xs font-bold cursor-pointer shrink-0"
                                >
                                  Issue Notice / Memo
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. PRODUCTS */}
                {activeTab === 'PRODUCTS' && (
                  <div className="space-y-3">
                    <span className="text-xs text-[#7A827B]">
                      Showing {filteredInspections.length} product inspections for {manufacturer.name}
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {filteredInspections.map((insp) => (
                        <div
                          key={insp.id}
                          className="p-4 bg-white border border-[#E7E3DC] rounded-xl space-y-2 shadow-2xs"
                        >
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-sm text-[#2D322E]">{insp.productName}</h4>
                            <span className="text-[10px] font-mono text-[#7A827B]">{insp.id}</span>
                          </div>
                          <p className="text-xs text-[#7A827B] font-mono">
                            Category: {insp.category.replace(/_/g, ' ')}
                          </p>
                          {onOpenInspection && (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onOpenInspection(insp.id);
                              }}
                              className="text-xs font-semibold text-[#52796F] hover:underline flex items-center gap-1 cursor-pointer pt-1"
                            >
                              Open Inspection Workspace →
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. INSPECTIONS */}
                {activeTab === 'INSPECTIONS' && (
                  <div className="space-y-3">
                    {filteredInspections.map((insp) => (
                      <div
                        key={insp.id}
                        className="p-4 bg-white border border-[#E7E3DC] rounded-xl flex items-center justify-between gap-4 text-xs"
                      >
                        <div>
                          <span className="font-bold text-sm text-[#2D322E] block">{insp.productName}</span>
                          <span className="font-mono text-[#7A827B]">
                            {insp.id} • {new Date(insp.createdAt).toLocaleDateString('en-IN')}
                          </span>
                        </div>

                        {onOpenInspection && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenInspection(insp.id);
                            }}
                            className="px-3.5 py-1.5 bg-[#FAF8F5] border border-[#E7E3DC] rounded-lg font-semibold text-[#2D322E] cursor-pointer"
                          >
                            View Inspection
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* 4. VIOLATIONS */}
                {activeTab === 'VIOLATIONS' && (
                  <div className="space-y-4">
                    <span className="text-xs text-[#7A827B] block">
                      Showing {filteredViolations.length} statutory violation finding(s) across all inspected products for {manufacturer.name}.
                    </span>

                    {filteredViolations.length === 0 ? (
                      <div className="p-10 text-center bg-[#EBF3EE] border border-[#C7DECF] rounded-xl space-y-2">
                        <CheckCircle2 className="w-10 h-10 text-[#335E46] mx-auto" />
                        <h4 className="font-bold text-sm text-[#2D322E]">No statutory violations recorded</h4>
                        <p className="text-xs text-[#535953]">
                          Zero statutory violations recorded for {manufacturer.name}. All inspected product commodities comply with statutory packaging rules.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredViolations.map(({ finding, inspection }, i) => (
                          <div
                            key={i}
                            className="p-5 bg-[#FAECE7]/40 border border-[#F7D0C4] rounded-xl space-y-3 text-xs shadow-2xs"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F7D0C4]/60 pb-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-[#2D322E]">
                                    PRODUCT: {inspection.productName}
                                  </span>
                                  {inspection.extractedFields?.brandName && (
                                    <span className="px-2 py-0.5 text-[10px] font-mono bg-white border border-[#E7E3DC] rounded text-[#535953]">
                                      BRAND: {inspection.extractedFields.brandName}
                                    </span>
                                  )}
                                </div>
                                <span className="font-mono text-[11px] text-[#7A827B]">
                                  INSPECTION: {inspection.id} • {new Date(inspection.createdAt).toLocaleDateString('en-IN')}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#FAECE7] text-[#9E432A] border border-[#F7D0C4] rounded">
                                  {finding.severity || 'MAJOR'}
                                </span>
                                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-white text-[#535953] border border-[#E7E3DC] rounded">
                                  {finding.status}
                                </span>
                              </div>
                            </div>

                            <div>
                              <span className="font-mono font-bold text-sm text-[#9E432A] block">
                                RULE: {finding.sectionRef || finding.ruleId} — {finding.title}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-white rounded-lg border border-[#E7E3DC]">
                              <div>
                                <span className="text-[10px] font-bold text-[#9E432A] uppercase block">
                                  Detected / Observed Value
                                </span>
                                <p className="font-mono text-xs font-bold text-[#9E432A] mt-0.5">
                                  "{finding.detectedText || 'Declaration absent from package'}"
                                </p>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-[#7A827B] uppercase block">
                                  Expected Statutory Requirement
                                </span>
                                <p className="text-xs text-[#2D322E] mt-0.5 leading-relaxed">
                                  {finding.statutoryStandardText}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                              <span className="text-[11px] font-mono text-[#7A827B]">
                                Evidence: {finding.sourceImageView || 'Scanned Package Image'}
                              </span>

                              <div className="flex items-center gap-2">
                                {onOpenInspection && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onClose();
                                      onOpenInspection(inspection.id);
                                    }}
                                    className="px-3 py-1.5 bg-white border border-[#E7E3DC] hover:bg-[#FAF8F5] rounded-lg text-xs font-semibold text-[#2D322E] cursor-pointer"
                                  >
                                    View Inspection
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setEvidenceInspection(inspection)}
                                  className="px-3 py-1.5 bg-white border border-[#E7E3DC] hover:bg-[#FAF8F5] rounded-lg text-xs font-semibold text-[#2D322E] flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-[#52796F]" />
                                  <span>View Evidence</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setNoticeTarget({ inspection, finding })}
                                  className="px-3.5 py-1.5 bg-[#9E432A] hover:bg-[#853722] text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>Generate Notice / Memo</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 5. REPEAT VIOLATIONS */}
                {activeTab === 'REPEAT_VIOLATIONS' && (
                  <div className="space-y-4">
                    {rawRepeatGroups.map((group) => (
                      <div key={group.ruleId} className="p-4 bg-white border border-[#E7E3DC] rounded-xl space-y-2 text-xs">
                        <div className="flex justify-between items-start">
                          <span className="font-mono font-bold text-[#9E432A]">{group.sectionRef} — {group.ruleTitle}</span>
                          <span className="font-mono font-bold text-[#9E432A]">Violated {group.count}×</span>
                        </div>
                        <span className="text-[#7A827B]">Affected Products: {group.affectedProducts}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 6. CRITICAL VIOLATIONS */}
                {activeTab === 'CRITICAL_VIOLATIONS' && (
                  <div className="space-y-4">
                    <span className="text-xs text-[#7A827B] block">
                      Showing {filteredCriticalViolations.length} critical statutory infraction(s) for {manufacturer.name}.
                    </span>

                    {filteredCriticalViolations.length === 0 ? (
                      <div className="p-10 text-center bg-[#EBF3EE] border border-[#C7DECF] rounded-xl space-y-2">
                        <CheckCircle2 className="w-10 h-10 text-[#335E46] mx-auto" />
                        <h4 className="font-bold text-sm text-[#2D322E]">Zero critical violations</h4>
                        <p className="text-xs text-[#535953]">
                          No critical statutory omissions detected across inspected products for {manufacturer.name}.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredCriticalViolations.map(({ finding, inspection }, i) => (
                          <div
                            key={i}
                            className="p-5 bg-[#FAECE7] border border-[#F7D0C4] rounded-xl space-y-3 text-xs shadow-2xs"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F7D0C4] pb-2">
                              <div>
                                <span className="font-bold text-sm text-[#2D322E]">
                                  PRODUCT: {inspection.productName}
                                </span>
                                <p className="font-mono text-[11px] text-[#7A827B]">
                                  INSPECTION: {inspection.id} • {new Date(inspection.createdAt).toLocaleDateString('en-IN')}
                                </p>
                              </div>

                              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold bg-[#9E432A] text-white rounded">
                                CRITICAL INFRACTION
                              </span>
                            </div>

                            <div>
                              <span className="font-mono font-bold text-sm text-[#9E432A] block">
                                RULE: {finding.sectionRef || finding.ruleId} — {finding.title}
                              </span>
                            </div>

                            <div className="p-3 bg-white rounded-lg border border-[#E7E3DC] space-y-1">
                              <span className="text-[10px] font-bold text-[#9E432A] uppercase block">
                                Observed Value
                              </span>
                              <p className="font-mono text-xs font-bold text-[#9E432A]">
                                "{finding.detectedText || 'Declaration absent'}"
                              </p>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-1">
                              {onOpenInspection && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onClose();
                                    onOpenInspection(inspection.id);
                                  }}
                                  className="px-3 py-1.5 bg-white border border-[#E7E3DC] hover:bg-[#FAF8F5] rounded-lg text-xs font-semibold text-[#2D322E] cursor-pointer"
                                >
                                  View Inspection
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setEvidenceInspection(inspection)}
                                className="px-3 py-1.5 bg-white border border-[#E7E3DC] hover:bg-[#FAF8F5] rounded-lg text-xs font-semibold text-[#2D322E] flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-[#52796F]" />
                                <span>View Evidence</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setNoticeTarget({ inspection, finding })}
                                className="px-3.5 py-1.5 bg-[#9E432A] hover:bg-[#853722] text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Generate Notice / Memo</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 7. DOCUMENTS */}
                {activeTab === 'NOTICES_MEMOS' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs text-[#7A827B]">
                        Showing {filteredDocuments.length} statutory compliance document(s) generated against {manufacturer.name}.
                      </span>
                      {filteredDocuments.length > 0 && (
                        <div className="flex items-center gap-2 text-[10px] font-mono">
                          <span className="px-2 py-0.5 bg-[#EBF3EE] text-[#335E46] border border-[#C7DECF] rounded font-bold">COMPLIANCE REPORT = Editable DOCX/PDF</span>
                          <span className="px-2 py-0.5 bg-[#2D322E] text-white rounded font-bold">MEMO/NOTICE = Immutable PDF</span>
                        </div>
                      )}
                    </div>

                    {filteredDocuments.length === 0 ? (
                      <div className="p-10 text-center text-xs text-[#7A827B] bg-[#FAF8F5] border border-[#E7E3DC] rounded-xl space-y-1">
                        <FileText className="w-8 h-8 text-[#7A827B] mx-auto mb-1 opacity-60" />
                        <h4 className="font-bold text-sm text-[#2D322E]">No compliance documents generated yet</h4>
                        <p>Generate a formal Memo / Notice from any active violation in the Violations tab.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredDocuments.map((doc) => {
                          const isMemo = doc.documentType === 'MEMO' || doc.documentType === 'NOTICE' || doc.documentType === 'NON_COMPLIANCE_REPORT';
                          const isComplianceReport = doc.documentType === 'COMPLIANCE_REPORT';
                          return (
                            <div
                              key={doc.documentId}
                              className={`p-4 bg-white border rounded-xl shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs ${isMemo ? 'border-[#2D322E]/20' : 'border-[#E7E3DC]'
                                }`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono font-bold text-sm text-[#335E46]">{doc.documentId}</span>
                                  {isMemo ? (
                                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#2D322E] text-white rounded flex items-center gap-1">
                                      <span>🔒</span> {doc.documentType} · IMMUTABLE
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#EBF3EE] text-[#335E46] border border-[#C7DECF] rounded">
                                      {doc.documentType} · EDITABLE
                                    </span>
                                  )}
                                  <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border ${doc.status === 'ISSUED' ? 'bg-[#FAECE7] text-[#9E432A] border-[#F7D0C4]' :
                                      doc.status === 'REVIEWED' ? 'bg-[#EBF3EE] text-[#335E46] border-[#C7DECF]' :
                                        'bg-[#FBF3E8] text-[#8C5E2D] border-[#EED9C4]'
                                    }`}>
                                    {doc.status}
                                  </span>
                                </div>
                                <p className="text-[#2D322E] font-semibold">{doc.productName}</p>
                                <p className="font-mono text-[#7A827B]">{doc.sectionRef} — {doc.ruleTitle}</p>
                                <p className="text-[#7A827B]">Inspection: {doc.inspectionId} · {new Date(doc.createdAt).toLocaleDateString('en-IN')}</p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {/* View button: opens the review modal */}
                                <button
                                  type="button"
                                  onClick={() => setSelectedNoticeDoc(doc)}
                                  className="px-3.5 py-2 bg-[#FAF8F5] border border-[#E7E3DC] hover:bg-[#E7E3DC]/40 rounded-xl font-semibold text-[#2D322E] cursor-pointer"
                                >
                                  View
                                </button>

                                {/* Download PDF: always available */}
                                <button
                                  type="button"
                                  onClick={() => exportNoticeToPDF(doc)}
                                  className={`px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs text-white ${isMemo
                                      ? 'bg-[#2D322E] hover:bg-[#1E2420]'
                                      : 'bg-[#335E46] hover:bg-[#284B37]'
                                    }`}
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>{isMemo ? 'Download Memo PDF' : 'Download PDF'}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}


                {/* 8. EVIDENCE */}
                {activeTab === 'EVIDENCE' && (
                  <div className="space-y-4">
                    <span className="text-xs text-[#7A827B] block">
                      Showing scanned packaging evidence images for {manufacturer.name}.
                    </span>

                    {filteredInspections.length === 0 ? (
                      <div className="p-10 text-center text-xs text-[#7A827B] bg-[#FAF8F5] border border-[#E7E3DC] rounded-xl">
                        No packaging evidence images available.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {filteredInspections.map((insp) => (
                          <div
                            key={insp.id}
                            onClick={() => setEvidenceInspection(insp)}
                            className="p-3 bg-[#FAF8F5] border border-[#E7E3DC] rounded-xl hover:border-[#52796F] cursor-pointer space-y-2 group transition-colors"
                          >
                            <div className="h-32 bg-[#1A1D1A] rounded-lg flex items-center justify-center overflow-hidden">
                              {insp.images && insp.images[0]?.previewUrl ? (
                                <img src={insp.images[0].previewUrl} alt={insp.productName} className="h-full w-auto object-contain group-hover:scale-105 transition-transform" />
                              ) : (
                                <Eye className="w-6 h-6 text-[#7A827B]" />
                              )}
                            </div>
                            <div className="space-y-0.5">
                              <span className="font-bold text-xs text-[#2D322E] block truncate">{insp.productName}</span>
                              <span className="text-[10px] font-mono text-[#7A827B] block">{insp.id}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Sub-modals */}
      {selectedFinding && (
        <ViolationDetailModal
          inspection={selectedFinding.inspection}
          finding={selectedFinding.finding}
          manufacturerName={manufacturer.name}
          manufacturerAddress={manufacturer.state}
          manufacturerId={manufacturer.id}
          onClose={() => setSelectedFinding(null)}
          onOpenInspection={onOpenInspection}
        />
      )}

      {evidenceInspection && (
        <EvidenceViewerModal
          inspection={evidenceInspection}
          onClose={() => setEvidenceInspection(null)}
        />
      )}

      {noticeTarget && (
        <NoticeReviewModal
          inspection={noticeTarget.inspection}
          finding={noticeTarget.finding}
          manufacturerName={manufacturer.name}
          manufacturerAddress={manufacturer.state}
          manufacturerId={manufacturer.id}
          onClose={() => setNoticeTarget(null)}
        />
      )}

      {selectedNoticeDoc && (
        <NoticeReviewModal
          inspection={{
            id: selectedNoticeDoc.inspectionId,
            productName: selectedNoticeDoc.productName,
            createdAt: selectedNoticeDoc.createdAt || new Date().toISOString(),
            extractedFields: {
              brandName: selectedNoticeDoc.brandName,
              manufacturerName: selectedNoticeDoc.manufacturerName,
              manufacturerAddress: selectedNoticeDoc.manufacturerAddress,
            },
          } as any}
          finding={{
            id: selectedNoticeDoc.violationFindingId,
            ruleId: selectedNoticeDoc.ruleId,
            sectionRef: selectedNoticeDoc.sectionRef,
            title: selectedNoticeDoc.ruleTitle,
            statutoryStandardText: selectedNoticeDoc.statutoryStandardText,
            detectedText: selectedNoticeDoc.detectedText,
            severity: selectedNoticeDoc.severity as any,
            status: selectedNoticeDoc.findingStatus as any,
          } as any}
          manufacturerName={selectedNoticeDoc.manufacturerName}
          manufacturerAddress={selectedNoticeDoc.manufacturerAddress}
          manufacturerId={selectedNoticeDoc.manufacturerId}
          existingDocument={selectedNoticeDoc}
          onClose={() => setSelectedNoticeDoc(null)}
        />
      )}
    </>
  );
}
