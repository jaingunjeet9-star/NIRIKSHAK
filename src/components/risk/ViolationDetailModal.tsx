import { useState } from 'react';
import {
  X,
  AlertTriangle,
  FileText,
  Eye,
  ExternalLink,
  ShieldAlert,
  Building2,
  Calendar,
  CheckCircle2,
  Tag,
} from 'lucide-react';
import { InspectionRecord, ComplianceFinding } from '../../types';
import { EvidenceViewerModal } from './EvidenceViewerModal';
import { NoticeReviewModal } from './NoticeReviewModal';

interface ViolationDetailModalProps {
  inspection: InspectionRecord;
  finding: ComplianceFinding;
  manufacturerName: string;
  manufacturerAddress?: string;
  manufacturerId: string;
  onClose: () => void;
  onOpenInspection?: (inspectionId: string) => void;
}

export function ViolationDetailModal({
  inspection,
  finding,
  manufacturerName,
  manufacturerAddress,
  manufacturerId,
  onClose,
  onOpenInspection,
}: ViolationDetailModalProps) {
  const [showEvidence, setShowEvidence] = useState(false);
  const [showNoticeReview, setShowNoticeReview] = useState(false);

  const isCritical = finding.severity === 'CRITICAL' || finding.status === 'POTENTIAL_ISSUE';

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 md:p-6 overflow-y-auto">
        <div className="bg-white border border-[#E7E3DC] rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#E7E3DC] flex items-center justify-between bg-[#FAF8F5]">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#FAECE7] border border-[#F7D0C4] rounded text-[10px] font-mono font-bold text-[#9E432A]">
                  STATUTORY VIOLATION DETAILS
                </span>
                <span className="text-xs font-mono font-bold text-[#7A827B]">
                  ID: {finding.id}
                </span>
              </div>
              <h3 className="text-base font-bold text-[#2D322E] mt-0.5">
                {finding.sectionRef || finding.ruleId} — {finding.title}
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

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Meta Context Grid */}
            <div className="p-4 bg-[#FAF8F5] border border-[#E7E3DC] rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-[#7A827B] uppercase block">Manufacturer</span>
                <span className="font-semibold text-[#2D322E] line-clamp-1" title={manufacturerName}>
                  {manufacturerName}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#7A827B] uppercase block">Product Name</span>
                <span className="font-semibold text-[#2D322E] line-clamp-1" title={inspection.productName}>
                  {inspection.productName}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#7A827B] uppercase block">Inspection ID</span>
                <span className="font-mono text-[#535953]">{inspection.id}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#7A827B] uppercase block">Date</span>
                <span className="text-[#535953]">
                  {new Date(inspection.createdAt).toLocaleDateString('en-IN')}
                </span>
              </div>
            </div>

            {/* Rule Specification Card */}
            <div className="p-5 bg-white border border-[#E7E3DC] rounded-xl space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A827B]">
                    Governing Rule & Act
                  </span>
                  <h4 className="text-sm font-bold text-[#2D322E] mt-0.5">
                    {finding.actName || 'Legal Metrology (Packaged Commodities) Rules 2011'}
                  </h4>
                  <p className="text-xs font-mono font-semibold text-[#9E432A] mt-0.5">
                    Section {finding.sectionRef || finding.ruleId}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border ${
                      isCritical
                        ? 'bg-[#FAECE7] text-[#9E432A] border-[#F7D0C4]'
                        : 'bg-[#FBF3E8] text-[#8C5E2D] border-[#EED9C4]'
                    }`}
                  >
                    SEVERITY: {finding.severity}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#FAF8F5] text-[#535953] border border-[#E7E3DC] rounded">
                    STATUS: {finding.status}
                  </span>
                </div>
              </div>

              {/* Finding Values Breakdown */}
              <div className="p-3.5 bg-[#FAECE7]/70 border border-[#F7D0C4] rounded-lg space-y-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#9E432A] block">
                    Observed Package Declaration
                  </span>
                  <p className="font-mono font-bold text-[#9E432A] text-sm mt-0.5">
                    "{finding.detectedText || 'Declaration absent from physical package'}"
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-[#7A827B] block">
                    Mandatory Statutory Requirement
                  </span>
                  <p className="text-[#2D322E] leading-relaxed mt-0.5">
                    {finding.statutoryStandardText}
                  </p>
                </div>

                {finding.explanation && (
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#7A827B] block">
                      Statutory Rationale / Explanation
                    </span>
                    <p className="text-[#535953] leading-relaxed mt-0.5">
                      {finding.explanation}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Evidence Quick Link Card */}
            <div className="p-4 bg-[#FAF8F5] border border-[#E7E3DC] rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white border border-[#E7E3DC] flex items-center justify-center text-[#52796F]">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#2D322E]">Package Evidence Images</h4>
                  <p className="text-[11px] text-[#7A827B]">
                    {inspection.images?.length || 1} scanned package image(s) with visual OCR annotations
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowEvidence(true)}
                className="px-3.5 py-2 bg-white border border-[#E7E3DC] hover:bg-[#FAF8F5] rounded-lg text-xs font-semibold text-[#2D322E] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-[#52796F]" />
                <span>View Evidence</span>
              </button>
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="px-6 py-4 border-t border-[#E7E3DC] bg-[#FAF8F5] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowEvidence(true)}
                className="h-10 px-3.5 bg-white border border-[#E7E3DC] hover:bg-[#FAF8F5] rounded-xl text-xs font-semibold text-[#2D322E] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Eye className="w-4 h-4 text-[#52796F]" />
                <span>View Evidence</span>
              </button>

              {onOpenInspection && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenInspection(inspection.id);
                  }}
                  className="h-10 px-3.5 bg-white border border-[#E7E3DC] hover:bg-[#FAF8F5] rounded-xl text-xs font-semibold text-[#2D322E] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 text-[#52796F]" />
                  <span>Open Inspection</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowNoticeReview(true)}
              className="h-10 px-5 bg-[#9E432A] hover:bg-[#853722] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Issue Notice / Memo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-modals */}
      {showEvidence && (
        <EvidenceViewerModal
          inspection={inspection}
          targetField={finding.field}
          targetBoundingBoxId={finding.targetBoundingBoxId}
          onClose={() => setShowEvidence(false)}
        />
      )}

      {showNoticeReview && (
        <NoticeReviewModal
          inspection={inspection}
          finding={finding}
          manufacturerName={manufacturerName}
          manufacturerAddress={manufacturerAddress}
          manufacturerId={manufacturerId}
          onClose={() => setShowNoticeReview(false)}
        />
      )}
    </>
  );
}
