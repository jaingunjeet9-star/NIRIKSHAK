import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, XCircle, Edit3, Check, ArrowLeft, Download, Filter, Eye } from 'lucide-react';
import { InspectionRecord, ComplianceFinding, hasUnresolvedFindings } from '../types';
import { requestJson } from '../lib/api';
import { exportInspectionToPDF } from '../lib/pdfExport';
import { useTranslation } from '../lib/i18n';

interface ReviewQueueViewProps {
  inspections: InspectionRecord[];
  onUpdateInspection: (updated: InspectionRecord) => void;
  onBackToScanner: () => void;
}

export function isFindingPending(f: ComplianceFinding): boolean {
  if (!f) return false;
  // If finding has already been adjudicated by inspector override, it is no longer pending
  if (f.reviewerOverride) return false;
  // If status is already VERIFIED or NOT_APPLICABLE, it is not pending
  if (f.status === 'VERIFIED' || f.status === 'NOT_APPLICABLE') return false;
  // Needs human review (POTENTIAL_ISSUE, NOT_DETECTED, REQUIRES_MANUAL_REVIEW, VIOLATION, LOW_CONFIDENCE, WARNING)
  return true;
}

export function ReviewQueueView({
  inspections,
  onUpdateInspection,
  onBackToScanner,
}: ReviewQueueViewProps) {
  const { t } = useTranslation();

  const pendingCases = inspections.filter(hasUnresolvedFindings);

  const [selectedCaseId, setSelectedCaseId] = useState<string>(pendingCases[0]?.id || '');
  const [editingFindingId, setEditingFindingId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState('');
  const [inspectorNotes, setInspectorNotes] = useState('');
  const [savedToast, setSavedToast] = useState(false);
  const [showAllFindings, setShowAllFindings] = useState<boolean>(false);

  useEffect(() => {
    if (pendingCases.length > 0 && !pendingCases.some((c) => c.id === selectedCaseId)) {
      setSelectedCaseId(pendingCases[0].id);
    }
  }, [pendingCases, selectedCaseId]);

  const activeCase = inspections.find((i) => i.id === selectedCaseId) || pendingCases[0];

  const handleDecision = async (findingId: string, decision: 'ACCEPT' | 'REJECT') => {
    if (!activeCase) return;

    try {
      const res = await requestJson<{ inspection: InspectionRecord }>(
        `/api/reviews/${activeCase.id}/decision`,
        {
          method: 'POST',
          body: JSON.stringify({
            findingId,
            decision,
            reviewerName: 'Devendra Sharma (Officer ID: DL-LM-408)',
            updatedValue: editingFindingId === findingId ? editedText : undefined,
            notes: inspectorNotes || undefined,
          }),
        }
      );

      if (res.inspection) {
        onUpdateInspection(res.inspection);
        setEditingFindingId(null);
        setSavedToast(true);
        setTimeout(() => setSavedToast(false), 2500);
      }
    } catch (err) {
      console.error(err);
      alert('Unable to record review decision.');
    }
  };

  const handleMarkBatchVerified = async () => {
    if (!activeCase) return;

    try {
      const res = await requestJson<{ inspection: InspectionRecord }>(
        `/api/reviews/${activeCase.id}/decision`,
        {
          method: 'POST',
          body: JSON.stringify({
            decision: 'MARK_VERIFIED',
            reviewerName: 'Devendra Sharma (Officer ID: DL-LM-408)',
            notes: inspectorNotes || 'Batch manually verified against physical seed samples.',
          }),
        }
      );

      if (res.inspection) {
        onUpdateInspection(res.inspection);
        setSavedToast(true);
        setTimeout(() => setSavedToast(false), 2500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter findings: default to showing ONLY pending findings for Case Adjudication
  const allFindings = activeCase?.findings || [];
  const pendingFindings = allFindings.filter(isFindingPending);
  const displayedFindings = showAllFindings ? allFindings : pendingFindings;

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 md:px-10 py-6 md:py-8 space-y-6 md:space-y-8">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7E3DC] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FAECE7] border border-[#F7D0C4] rounded-lg mb-2">
            <AlertCircle className="w-3.5 h-3.5 text-[#9E432A]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9E432A]">
              {t('reviews.badgeReview')}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#2D322E] tracking-tight">
            {t('reviews.title')}
          </h2>
          <p className="text-xs md:text-sm text-[#535953] mt-1">
            {t('reviews.subtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={onBackToScanner}
          className="h-11 px-4 bg-white border border-[#E7E3DC] hover:bg-[#FAF8F5] text-[#2D322E] text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#52796F]" />
          <span>{t('reviews.backScanner')}</span>
        </button>
      </div>

      {pendingCases.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[#E7E3DC] rounded-2xl">
          <CheckCircle2 className="w-10 h-10 text-[#335E46] mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#2D322E]">{t('reviews.noPendingTitle')}</h3>
          <p className="text-xs text-[#7A827B] mt-1">
            {t('reviews.noPendingText')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
          {/* Left Column: Flagged Cases List (4 Cols) */}
          <div className="lg:col-span-4 bg-white border border-[#E7E3DC] rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 bg-[#FAF8F5] border-b border-[#E7E3DC] font-mono text-xs font-bold text-[#7A827B]">
              {t('reviews.flaggedCasesHeader')} ({pendingCases.length})
            </div>
            <div className="divide-y divide-[#E7E3DC]">
              {pendingCases.map((c) => {
                const unadjudicatedCount = (c.findings || []).filter(isFindingPending).length;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCaseId(c.id)}
                    className={`p-4 cursor-pointer transition-colors ${
                      activeCase?.id === c.id ? 'bg-[#FAF8F5] border-l-4 border-l-[#52796F]' : 'hover:bg-[#FAF8F5]/60'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-xs font-bold text-[#2D322E]">{c.batchReference}</span>
                      <span className="px-2 py-0.5 bg-[#FAECE7] text-[#9E432A] font-mono text-[10px] font-bold rounded border border-[#F7D0C4]">
                        {unadjudicatedCount} {t('reviews.issuesCount')}
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-[#2D322E] mt-1 line-clamp-1">{c.productName}</h4>
                    <p className="text-[11px] text-[#7A827B] mt-0.5">{t('categories.' + c.category, c.category)}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Case Adjudication Workbench (8 Cols) */}
          {activeCase && (
            <div className="lg:col-span-8 bg-white border border-[#E7E3DC] rounded-2xl p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E7E3DC] pb-4">
                <div>
                  <span className="font-mono text-xs text-[#7A827B]">{t('reviews.caseAdjudication')} {activeCase.id}</span>
                  <h3 className="text-xl font-bold text-[#2D322E] mt-0.5">{activeCase.productName}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await exportInspectionToPDF(activeCase);
                      } catch (err) {
                        console.error('Failed to export PDF:', err);
                      }
                    }}
                    className="h-10 px-3.5 bg-white hover:bg-[#FAF8F5] border border-[#E7E3DC] text-[#2D322E] text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    title="Export Current Case Summary as PDF"
                  >
                    <Download className="w-4 h-4 text-[#52796F]" />
                    <span>{t('reviews.exportPdfBtn')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleMarkBatchVerified}
                    className="h-10 px-4 bg-[#52796F] hover:bg-[#45665E] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{t('reviews.markBatchVerified')}</span>
                  </button>
                </div>
              </div>

              {savedToast && (
                <div className="p-3 bg-[#EBF3EE] border border-[#C7DECF] rounded-xl text-xs font-semibold text-[#335E46] flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>{t('reviews.decisionSavedToast')}</span>
                </div>
              )}

              {/* Findings Review List Header with Filter Toggle */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#E7E3DC] pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#7A827B]">
                    {showAllFindings
                      ? `All Findings (${allFindings.length})`
                      : `Pending Findings Needing Review (${pendingFindings.length})`}
                  </span>

                  {allFindings.length > pendingFindings.length && (
                    <button
                      type="button"
                      onClick={() => setShowAllFindings(!showAllFindings)}
                      className="text-[11px] font-semibold text-[#52796F] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Filter className="w-3 h-3 text-[#52796F]" />
                      <span>
                        {showAllFindings
                          ? `Show Pending Only (${pendingFindings.length})`
                          : `Show All Findings (${allFindings.length})`}
                      </span>
                    </button>
                  )}
                </div>

                {displayedFindings.length === 0 ? (
                  <div className="p-8 text-center bg-[#FAF8F5] border border-[#E7E3DC] rounded-xl space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-[#335E46] mx-auto opacity-80" />
                    <h4 className="text-sm font-bold text-[#2D322E]">All findings for this case have been resolved</h4>
                    <p className="text-xs text-[#7A827B]">
                      Every statutory finding for {activeCase.productName} has been verified or adjudicated by the inspector.
                    </p>
                  </div>
                ) : (
                  displayedFindings.map((f: ComplianceFinding) => (
                    <div
                      key={f.id}
                      className={`p-4 rounded-xl border text-xs space-y-3 ${
                        f.status === 'VERIFIED'
                          ? 'bg-[#FAF8F5] border-[#C7DECF]'
                          : f.reviewerOverride
                          ? 'bg-[#EBF3EE]/60 border-[#C7DECF] border-l-4 border-l-[#52796F]'
                          : 'bg-[#FAECE7]/50 border-[#F7D0C4] border-l-4 border-l-[#9E432A]'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#2D322E]">{f.sectionRef}</span>
                          <span className="font-semibold text-[#2D322E]">{f.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {f.reviewerOverride && (
                            <span className="font-mono text-[9px] px-2 py-0.5 rounded font-bold bg-[#335E46] text-white">
                              Adjudicated: {f.reviewerOverride.newStatus}
                            </span>
                          )}
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded font-bold bg-white text-[#2D322E] border border-[#E7E3DC]">
                            {t('common.' + (f.status === 'VERIFIED' ? 'verified' : f.status === 'VIOLATION' ? 'violation' : f.status === 'WARNING' ? 'warning' : 'requiresReview'), f.status)}
                          </span>
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-[#E7E3DC] space-y-1">
                        <span className="text-[10px] uppercase font-bold text-[#7A827B] block">{t('reviews.detectedObservation')}</span>
                        {editingFindingId === f.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editedText}
                              onChange={(e) => setEditedText(e.target.value)}
                              className="w-full p-2 border border-[#52796F] rounded text-xs font-mono"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleDecision(f.id, 'ACCEPT')}
                                className="px-3 py-1 bg-[#52796F] text-white rounded text-[11px] font-semibold cursor-pointer"
                              >
                                {t('reviews.saveCorrection')}
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingFindingId(null)}
                                className="px-3 py-1 bg-white border border-[#E7E3DC] text-[#2D322E] rounded text-[11px] cursor-pointer"
                              >
                                {t('common.cancel')}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[#2D322E] font-mono text-[11px]">{f.detectedText}</p>
                        )}
                      </div>

                      <p className="text-[#535953] leading-relaxed">
                        <strong>{t('reviews.statRequirement')}</strong> {f.statutoryStandardText}. {f.explanation}
                      </p>

                      {/* Adjudication Actions */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E7E3DC]/80">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFindingId(f.id);
                            setEditedText(f.detectedText);
                          }}
                          className="h-8 px-3 bg-white border border-[#E7E3DC] hover:bg-[#FAF8F5] text-[#2D322E] font-semibold text-xs rounded-lg flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#52796F]" />
                          <span>{t('reviews.editText')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDecision(f.id, 'ACCEPT')}
                          className="h-8 px-3 bg-[#EBF3EE] border border-[#C7DECF] hover:bg-[#DFEFE5] text-[#335E46] font-semibold text-xs rounded-lg flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#335E46]" />
                          <span>{t('reviews.overrideVerified')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDecision(f.id, 'REJECT')}
                          className="h-8 px-3 bg-[#FAECE7] border border-[#F7D0C4] hover:bg-[#F7DCD3] text-[#9E432A] font-semibold text-xs rounded-lg flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5 text-[#9E432A]" />
                          <span>{t('reviews.confirmViolation')}</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Inspector Field Observation Notes */}
              <div className="pt-4 border-t border-[#E7E3DC] space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#7A827B]">
                  {t('reviews.notesTitle')}
                </label>
                <textarea
                  value={inspectorNotes || activeCase.inspectorNotes || ''}
                  onChange={(e) => setInspectorNotes(e.target.value)}
                  placeholder={t('reviews.notesPlaceholder')}
                  className="w-full p-3 bg-[#FAF8F5] border border-[#E7E3DC] rounded-xl text-xs text-[#2D322E] focus:outline-none focus:border-[#52796F]"
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
