import { useState } from 'react';
import {
  X,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Clock,
  Eye,
  FileText,
  ExternalLink,
  ChevronRight,
  Filter,
  RefreshCw,
} from 'lucide-react';
import {
  InspectionRecord,
  ManufacturerProfile,
  ComplianceFinding,
  RepeatViolationGroup,
  ManufacturerViolationFinding,
} from '../../types';
import { ViolationDetailModal } from './ViolationDetailModal';
import { EvidenceViewerModal } from './EvidenceViewerModal';
import { NoticeReviewModal } from './NoticeReviewModal';

import { isFindingViolation } from '../../engine/passportCalculator';

export type MetricType =
  | 'PRODUCTS_INSPECTED'
  | 'COMPLIANT'
  | 'VIOLATIONS'
  | 'REPEAT_VIOLATIONS'
  | 'CRITICAL_VIOLATIONS'
  | 'LAST_INSPECTION';

interface MetricDetailModalProps {
  metricType: MetricType;
  manufacturer: ManufacturerProfile;
  inspections: InspectionRecord[];
  violations: ManufacturerViolationFinding[];
  repeatGroups: RepeatViolationGroup[];
  criticalViolations: ManufacturerViolationFinding[];
  isLoading?: boolean;
  onClose: () => void;
  onOpenInspection?: (inspectionId: string) => void;
}

export function MetricDetailModal({
  metricType,
  manufacturer,
  inspections,
  violations,
  repeatGroups,
  criticalViolations,
  isLoading = false,
  onClose,
  onOpenInspection,
}: MetricDetailModalProps) {
  const [selectedFinding, setSelectedFinding] = useState<{
    inspection: InspectionRecord;
    finding: ComplianceFinding;
  } | null>(null);

  const [evidenceInspection, setEvidenceInspection] = useState<InspectionRecord | null>(null);
  const [noticeTarget, setNoticeTarget] = useState<{
    inspection: InspectionRecord;
    finding: ComplianceFinding;
  } | null>(null);

  // Filter compliant inspections
  const compliantInspections = inspections.filter((insp) => {
    const findings = insp.findings || [];
    const hasActiveViolations = findings.some((f) => isFindingViolation(f));
    const isInvalid =
      insp.status === 'ANALYSIS_ERROR' ||
      insp.status === 'SEIZURE_FLAGGED' ||
      insp.status === 'NEEDS_REVIEW' ||
      insp.status === 'DRAFT';

    return !hasActiveViolations && !isInvalid && findings.length > 0;
  });

  // Latest inspection
  const latestInspection = inspections.length > 0 ? inspections[0] : null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 md:p-6 overflow-y-auto">
        <div className="bg-white border border-[#E7E3DC] rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#E7E3DC] flex items-center justify-between bg-[#FAF8F5]">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#EBF3EE] border border-[#C7DECF] rounded text-[10px] font-mono font-bold text-[#335E46]">
                  {manufacturer.name}
                </span>
                <span className="text-xs font-mono font-bold text-[#7A827B]">
                  LIC: {manufacturer.licenseNumber}
                </span>
              </div>
              <h3 className="text-base font-bold text-[#2D322E] mt-0.5">
                {metricType === 'PRODUCTS_INSPECTED' && 'PRODUCT INSPECTION HISTORY'}
                {metricType === 'COMPLIANT' && 'COMPLIANT INSPECTIONS'}
                {metricType === 'VIOLATIONS' && 'VIOLATION HISTORY'}
                {metricType === 'REPEAT_VIOLATIONS' && 'REPEATING RULE VIOLATIONS'}
                {metricType === 'CRITICAL_VIOLATIONS' && 'CRITICAL VIOLATION HISTORY'}
                {metricType === 'LAST_INSPECTION' && 'LAST INSPECTION SUMMARY'}
              </h3>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-[#E7E3DC] flex items-center justify-center text-[#7A827B] hover:text-[#2D322E] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 overflow-y-auto space-y-4">
            {/* Loading State — shown while API call is in flight */}
            {isLoading ? (
              <div className="py-16 flex flex-col items-center gap-3 text-[#7A827B]">
                <RefreshCw className="w-6 h-6 animate-spin text-[#52796F]" />
                <p className="text-xs font-semibold">Loading compliance data for {manufacturer.name}…</p>
              </div>
            ) : (
              <>
            {/* 1. PRODUCTS INSPECTED */}
            {metricType === 'PRODUCTS_INSPECTED' && (
              <div className="space-y-4">
                <div className="text-xs text-[#7A827B] flex justify-between items-center">
                  <span>Showing {inspections.length} inspection records on file for {manufacturer.name}</span>
                </div>

                {inspections.length === 0 ? (
                  <div className="p-10 text-center text-xs text-[#7A827B] bg-[#FAF8F5] border border-[#E7E3DC] rounded-xl">
                    No inspection records found for this manufacturer.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {inspections.map((insp) => {
                      const counts = insp.summaryCounts || ({} as any);
                      const violCount = (counts.violations ?? 0) + (counts.potentialIssues ?? 0) + (counts.notDetected ?? 0);
                      const isComp = violCount === 0 && insp.status === 'COMPLETED';

                      return (
                        <div
                          key={insp.id}
                          className="p-4 bg-white border border-[#E7E3DC] hover:border-[#D5CFC5] rounded-xl shadow-2xs space-y-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-[#2D322E]">{insp.productName}</span>
                              <span
                                className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border ${
                                  isComp
                                    ? 'bg-[#EBF3EE] text-[#335E46] border-[#C7DECF]'
                                    : 'bg-[#FAECE7] text-[#9E432A] border-[#F7D0C4]'
                                }`}
                              >
                                {isComp ? 'Verified Compliant' : `${violCount} Violations`}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-[#7A827B] font-mono">
                              <span>ID: {insp.id}</span>
                              <span>Date: {new Date(insp.createdAt).toLocaleDateString('en-IN')}</span>
                              <span>Category: {insp.category.replace(/_/g, ' ')}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {onOpenInspection && (
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  onOpenInspection(insp.id);
                                }}
                                className="h-9 px-3.5 bg-[#FAF8F5] border border-[#E7E3DC] hover:bg-white rounded-lg text-xs font-semibold text-[#2D322E] flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <span>View Inspection</span>
                                <ChevronRight className="w-4 h-4 text-[#52796F]" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 2. COMPLIANT */}
            {metricType === 'COMPLIANT' && (
              <div className="space-y-4">
                <div className="text-xs text-[#7A827B]">
                  Showing {compliantInspections.length} fully verified compliant inspections
                </div>

                {compliantInspections.length === 0 ? (
                  <div className="p-10 text-center text-xs text-[#7A827B] bg-[#FAF8F5] border border-[#E7E3DC] rounded-xl">
                    No compliant inspections recorded for this manufacturer yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {compliantInspections.map((insp) => (
                      <div
                        key={insp.id}
                        className="p-4 bg-white border border-[#E7E3DC] rounded-xl shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#2D322E]">{insp.productName}</span>
                            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#EBF3EE] text-[#335E46] border border-[#C7DECF] rounded">
                              VERIFIED COMPLIANT
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-[#7A827B] font-mono">
                            <span>ID: {insp.id}</span>
                            <span>Date: {new Date(insp.createdAt).toLocaleDateString('en-IN')}</span>
                            <span>Score: {insp.completenessScore}/100</span>
                          </div>
                        </div>

                        {onOpenInspection && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenInspection(insp.id);
                            }}
                            className="h-9 px-3.5 bg-[#FAF8F5] border border-[#E7E3DC] hover:bg-white rounded-lg text-xs font-semibold text-[#2D322E] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                          >
                            <span>View Inspection</span>
                            <ChevronRight className="w-4 h-4 text-[#52796F]" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. VIOLATIONS */}
            {metricType === 'VIOLATIONS' && (
              <div className="space-y-4">
                <div className="text-xs text-[#7A827B]">
                  Showing {violations.length} statutory violation findings across all inspected products
                </div>

                {violations.length === 0 ? (
                  <div className="p-10 text-center text-xs text-[#335E46] bg-[#EBF3EE] border border-[#C7DECF] rounded-xl font-semibold">
                    Zero statutory violations recorded for this manufacturer.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {violations.map(({ finding, inspection }, idx) => (
                      <div
                        key={`${inspection.id}-${finding.id}-${idx}`}
                        className="p-4 bg-[#FAECE7]/40 border border-[#F7D0C4] rounded-xl space-y-3"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-[#2D322E]">
                                {inspection.productName}
                              </span>
                              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#FAECE7] text-[#9E432A] border border-[#F7D0C4] rounded">
                                {finding.severity}
                              </span>
                            </div>
                            <p className="text-xs font-mono font-semibold text-[#9E432A] mt-0.5">
                              {finding.sectionRef || finding.ruleId} — {finding.title}
                            </p>
                          </div>

                          <span className="text-[11px] font-mono text-[#7A827B] shrink-0">
                            {new Date(inspection.createdAt).toLocaleDateString('en-IN')}
                          </span>
                        </div>

                        <div className="p-2.5 bg-white border border-[#E7E3DC] rounded-lg text-xs font-mono text-[#9E432A]">
                          Observed: "{finding.detectedText || 'Declaration absent'}" — Standard: {finding.statutoryStandardText}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <span className="text-[11px] text-[#7A827B] font-mono">
                            Inspection ID: {inspection.id}
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedFinding({ inspection, finding })}
                              className="px-3 py-1.5 bg-white border border-[#E7E3DC] hover:bg-[#FAF8F5] rounded-lg text-xs font-semibold text-[#2D322E] flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#52796F]" />
                              <span>View Details</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setNoticeTarget({ inspection, finding })}
                              className="px-3 py-1.5 bg-[#9E432A] hover:bg-[#853722] text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Issue Notice / Memo</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. REPEAT VIOLATIONS */}
            {metricType === 'REPEAT_VIOLATIONS' && (
              <div className="space-y-4">
                <div className="text-xs text-[#7A827B]">
                  Grouped by statutory rule (rules violated 2+ times across products)
                </div>

                {repeatGroups.length === 0 ? (
                  <div className="p-10 text-center text-xs text-[#335E46] bg-[#EBF3EE] border border-[#C7DECF] rounded-xl font-semibold">
                    No repeat rule infractions detected for this manufacturer.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {repeatGroups.map((group) => (
                      <div
                        key={group.ruleId}
                        className="p-4 bg-white border border-[#E7E3DC] rounded-xl space-y-3 shadow-2xs"
                      >
                        <div className="flex justify-between items-start gap-2 border-b border-[#E7E3DC] pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-sm text-[#9E432A]">
                                {group.sectionRef}
                              </span>
                              {group.isCritical && (
                                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#FAECE7] text-[#9E432A] border border-[#F7D0C4] rounded">
                                  CRITICAL RULE
                                </span>
                              )}
                            </div>
                            <h4 className="text-xs font-bold text-[#2D322E] mt-0.5">
                              {group.ruleTitle}
                            </h4>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="px-2.5 py-1 bg-[#FAECE7] text-[#9E432A] border border-[#F7D0C4] rounded-lg text-xs font-mono font-bold block">
                              VIOLATED {group.count} TIMES
                            </span>
                            <span className="text-[10px] text-[#7A827B] mt-1 block">
                              Across {group.affectedProducts} product(s)
                            </span>
                          </div>
                        </div>

                        {/* Individual Occurrences List */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A827B]">
                            Historical Rule Infraction Occurrences:
                          </span>
                          {group.occurrences.map((occ, oIdx) => (
                            <div
                              key={`${occ.inspectionId}-${occ.findingId}-${oIdx}`}
                              className="p-2.5 bg-[#FAF8F5] border border-[#E7E3DC] rounded-lg text-xs flex justify-between items-center"
                            >
                              <div className="space-y-0.5">
                                <span className="font-bold text-[#2D322E]">{occ.productName}</span>
                                <div className="flex items-center gap-3 text-[11px] text-[#7A827B] font-mono">
                                  <span>ID: {occ.inspectionId}</span>
                                  <span>
                                    Date: {occ.date ? new Date(occ.date).toLocaleDateString('en-IN') : 'N/A'}
                                  </span>
                                </div>
                              </div>

                              {onOpenInspection && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onClose();
                                    onOpenInspection(occ.inspectionId);
                                  }}
                                  className="px-2.5 py-1 bg-white border border-[#E7E3DC] hover:bg-[#FAF8F5] rounded text-[11px] font-semibold text-[#52796F] cursor-pointer"
                                >
                                  Inspection
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 5. CRITICAL VIOLATIONS */}
            {metricType === 'CRITICAL_VIOLATIONS' && (
              <div className="space-y-4">
                <div className="text-xs text-[#7A827B]">
                  Showing {criticalViolations.length} critical statutory omissions or safety warnings
                </div>

                {criticalViolations.length === 0 ? (
                  <div className="p-10 text-center text-xs text-[#335E46] bg-[#EBF3EE] border border-[#C7DECF] rounded-xl font-semibold">
                    Zero critical violations recorded.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {criticalViolations.map(({ finding, inspection }, idx) => (
                      <div
                        key={`${inspection.id}-${finding.id}-${idx}`}
                        className="p-4 bg-[#FAECE7] border border-[#F7D0C4] rounded-xl space-y-3"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#9E432A] text-white rounded">
                              CRITICAL OMISSION
                            </span>
                            <h4 className="text-sm font-bold text-[#2D322E] mt-1">
                              {inspection.productName}
                            </h4>
                            <p className="text-xs font-mono font-bold text-[#9E432A] mt-0.5">
                              {finding.sectionRef || finding.ruleId} — {finding.title}
                            </p>
                          </div>

                          <span className="text-[11px] font-mono text-[#7A827B]">
                            {new Date(inspection.createdAt).toLocaleDateString('en-IN')}
                          </span>
                        </div>

                        <div className="p-2.5 bg-white border border-[#E7E3DC] rounded-lg text-xs font-mono text-[#9E432A]">
                          Observed: "{finding.detectedText || 'Declaration absent'}" — Requirement: {finding.statutoryStandardText}
                        </div>

                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedFinding({ inspection, finding })}
                            className="px-3 py-1.5 bg-white border border-[#E7E3DC] rounded-lg text-xs font-semibold text-[#2D322E] cursor-pointer"
                          >
                            View Details
                          </button>
                          <button
                            type="button"
                            onClick={() => setNoticeTarget({ inspection, finding })}
                            className="px-3 py-1.5 bg-[#9E432A] text-white rounded-lg text-xs font-bold cursor-pointer"
                          >
                            Issue Notice / Memo
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 6. LAST INSPECTION */}
            {metricType === 'LAST_INSPECTION' && (
              <div className="space-y-4">
                {!latestInspection ? (
                  <div className="p-10 text-center text-xs text-[#7A827B] bg-[#FAF8F5] border border-[#E7E3DC] rounded-xl">
                    No inspection record on file.
                  </div>
                ) : (
                  <div className="p-5 bg-white border border-[#E7E3DC] rounded-xl space-y-4 shadow-2xs">
                    <div className="flex justify-between items-start border-b border-[#E7E3DC] pb-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A827B]">
                          Latest Inspection Record
                        </span>
                        <h4 className="text-base font-bold text-[#2D322E] mt-0.5">
                          {latestInspection.productName}
                        </h4>
                        <p className="text-xs font-mono text-[#7A827B]">
                          ID: {latestInspection.id} • Date: {new Date(latestInspection.createdAt).toLocaleString('en-IN')}
                        </p>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                          latestInspection.summaryCounts?.violations > 0
                            ? 'bg-[#FAECE7] text-[#9E432A] border border-[#F7D0C4]'
                            : 'bg-[#EBF3EE] text-[#335E46] border border-[#C7DECF]'
                        }`}
                      >
                        {latestInspection.summaryCounts?.violations > 0
                          ? `${latestInspection.summaryCounts.violations} Violations`
                          : 'VERIFIED COMPLIANT'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs p-3 bg-[#FAF8F5] rounded-lg border border-[#E7E3DC]">
                      <div>
                        <span className="text-[10px] font-bold text-[#7A827B] uppercase block">Category</span>
                        <span className="font-semibold text-[#2D322E]">{latestInspection.category.replace(/_/g, ' ')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[#7A827B] uppercase block">Completeness</span>
                        <span className="font-semibold text-[#335E46]">{latestInspection.completenessScore}/100</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[#7A827B] uppercase block">Inspector</span>
                        <span className="text-[#535953]">{latestInspection.inspectorName || 'Field Officer'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[#7A827B] uppercase block">Scanned Views</span>
                        <span className="text-[#535953]">{latestInspection.images?.length || 1} view(s)</span>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      {onOpenInspection && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenInspection(latestInspection.id);
                          }}
                          className="h-10 px-5 bg-[#335E46] hover:bg-[#284B37] text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
                        >
                          <span>OPEN FULL INSPECTION</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Nested Modals */}
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
    </>
  );
}
