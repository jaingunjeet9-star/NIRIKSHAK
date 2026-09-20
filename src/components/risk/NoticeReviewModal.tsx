import { useState } from 'react';
import { X, Download, FileText, CheckCircle2, AlertOctagon, Lock, Eye } from 'lucide-react';
import { ComplianceDocument, DocumentStatus, InspectionRecord, ComplianceFinding } from '../../types';
import { requestJson } from '../../lib/api';
import { exportNoticeToPDF } from '../../lib/noticePdfExport';

interface NoticeReviewModalProps {
  inspection: InspectionRecord;
  finding: ComplianceFinding;
  manufacturerName: string;
  manufacturerAddress?: string;
  manufacturerId: string;
  existingDocument?: ComplianceDocument;
  onClose: () => void;
  onSaved?: (doc: ComplianceDocument) => void;
}

/**
 * MANUFACTURER MEMO / NOTICE MODAL — IMMUTABLE
 *
 * This modal generates and previews the formal Manufacturer Memo/Notice PDF.
 * The document is NEVER editable. There is NO textarea for document body.
 * The PDF follows the "Form of Seizure Memo" reference format.
 *
 * Actions available:
 *   - Save Memo Record (persists to server document store)
 *   - Download PDF (immutable formal PDF)
 *
 * NOT a compliance report. Compliance reports use InspectionReportModal.
 */
export function NoticeReviewModal({
  inspection,
  finding,
  manufacturerName,
  manufacturerAddress,
  manufacturerId,
  existingDocument,
  onClose,
  onSaved,
}: NoticeReviewModalProps) {
  const [status, setStatus] = useState<DocumentStatus>(
    existingDocument?.status || 'DRAFT'
  );
  const [saving, setSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [savedDoc, setSavedDoc] = useState<ComplianceDocument | null>(
    existingDocument || null
  );

  // Build the document payload from real inspection + finding data
  const buildPayload = (targetStatus: DocumentStatus) => ({
    documentType: 'MEMO' as const,
    status: targetStatus,
    manufacturerId,
    manufacturerName,
    manufacturerAddress:
      manufacturerAddress ||
      inspection.extractedFields?.manufacturerAddress ||
      inspection.extractedFields?.packerAddress ||
      '',
    inspectionId: inspection.id,
    productName: inspection.productName,
    brandName:
      inspection.extractedFields?.brandName ||
      inspection.productIdentification?.brandName ||
      '',
    violationFindingId: finding.id,
    ruleId: finding.ruleId,
    sectionRef: finding.sectionRef || finding.ruleId,
    ruleTitle: finding.title,
    ruleCategory: finding.actName || 'Legal Metrology',
    severity: finding.severity,
    findingStatus: finding.status,
    detectedText: finding.detectedText || '',
    statutoryStandardText: finding.statutoryStandardText || '',
    evidenceRef: `Package View — ${finding.sourceImageView || 'PDP'} (${inspection.images?.length || 1} Scanned Image)`,
    inspectorName: inspection.inspectorName || 'Field Inspector (Station 04)',
    stationNode: inspection.stationNode || 'NIC-METROLOGY-NODE: #DELHI-WEST-04',
    inspectionDate: inspection.createdAt,
    documentBody: '',  // Memo/Notice has no free-text body
    // Extended fields for memo PDF
    batchReference: inspection.batchReference || inspection.extractedFields?.batchNumber || inspection.extractedFields?.lotNumber || '',
    netQuantity: inspection.extractedFields?.netQuantity || '',
    mrp: inspection.extractedFields?.mrp || '',
    explanation: finding.explanation || finding.statutoryRationale || '',
    groundsForAction: '',
  });

  const handleSaveMemoRecord = async () => {
    setSaving(true);
    try {
      const res = await requestJson<{ success: boolean; document: ComplianceDocument }>(
        '/api/documents',
        {
          method: 'POST',
          body: JSON.stringify(buildPayload(status)),
        }
      );
      if (res.document) {
        setSavedDoc(res.document);
        setStatus(res.document.status);
        if (onSaved) onSaved(res.document);
      }
    } catch (err) {
      console.error('Failed to save memo record:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsExporting(true);
    try {
      // Ensure a record exists in the server store first
      let currentDoc = savedDoc;
      if (!currentDoc) {
        const res = await requestJson<{ success: boolean; document: ComplianceDocument }>(
          '/api/documents',
          {
            method: 'POST',
            body: JSON.stringify(buildPayload(status)),
          }
        );
        currentDoc = res.document;
        setSavedDoc(res.document);
        if (onSaved && res.document) onSaved(res.document);
      }

      if (currentDoc) {
        await exportNoticeToPDF(currentDoc);
      }
    } catch (err) {
      console.error('Failed to generate Memo/Notice PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const memoRef = savedDoc?.documentId || `NIR-MEMO-${new Date().getFullYear()}-DRAFT`;
  const inspDate = new Date(inspection.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 md:p-6 overflow-y-auto">
      <div className="bg-white border border-[#E7E3DC] rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E7E3DC] flex items-center justify-between bg-[#FAF8F5]">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-[#2D322E] border border-[#2D322E] rounded text-[10px] font-mono font-bold text-white flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                IMMUTABLE · MEMO / NOTICE
              </span>
              <span className="text-xs font-mono font-bold text-[#335E46]">
                {memoRef}
              </span>
            </div>
            <h3 className="text-base font-bold text-[#2D322E] mt-0.5">
              Manufacturer Memo / Notice — Formal Seizure Document
            </h3>
            <p className="text-[11px] text-[#7A827B] mt-0.5">
              Immutable PDF · "Form of Seizure Memo" format · Legal Metrology Act, 2009
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-[#E7E3DC] flex items-center justify-center text-[#7A827B] hover:text-[#2D322E] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Immutability Notice */}
        <div className="px-6 py-3 bg-[#2D322E] flex items-center gap-3">
          <Lock className="w-4 h-4 text-[#C7DECF] shrink-0" />
          <p className="text-[11px] text-[#C7DECF] leading-relaxed">
            This document is generated from verified inspection data and is <strong className="text-white">not editable</strong>. The PDF will be produced in the official "Form of Seizure Memo" format as per Legal Metrology Act, 2009 / Packaged Commodities Rules, 2011. Only the workflow status can be updated below.
          </p>
        </div>

        {/* Document Preview Panel */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">

          {/* Status Selector — the ONLY control */}
          <div className="p-4 bg-[#FAF8F5] border border-[#E7E3DC] rounded-xl flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-[#7A827B] uppercase tracking-wider mb-1">
                Memo Workflow Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DocumentStatus)}
                className="w-full h-10 px-3 bg-white border border-[#E7E3DC] rounded-lg text-xs font-semibold text-[#2D322E] focus:outline-none focus:border-[#52796F]"
              >
                <option value="DRAFT">Draft (Inspector Preview)</option>
                <option value="REVIEWED">Reviewed (Supervisor Verified)</option>
                <option value="ISSUED">Issued (Served to Establishment)</option>
              </select>
            </div>
            <span
              className={`px-3 py-1.5 text-[10px] font-mono font-bold rounded border whitespace-nowrap ${status === 'ISSUED'
                  ? 'bg-[#FAECE7] text-[#9E432A] border-[#F7D0C4]'
                  : status === 'REVIEWED'
                    ? 'bg-[#EBF3EE] text-[#335E46] border-[#C7DECF]'
                    : 'bg-[#FBF3E8] text-[#8C5E2D] border-[#EED9C4]'
                }`}
            >
              {status}
            </span>
          </div>

          {/* Formal Memo Structure Preview */}
          <div className="border border-[#E7E3DC] rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-[#FAF8F5] border-b border-[#E7E3DC] flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#52796F]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#52796F]">Document Preview — Formal Memo Structure</span>
            </div>

            <div className="p-5 font-mono text-[11px] space-y-4 bg-white">

              {/* Document Header */}
              <div className="text-center space-y-1">
                <p className="font-bold text-sm text-[#2D322E]">FORM OF SEIZURE MEMO</p>
                <p className="text-[10px] text-[#7A827B]">(Under Section 15 of the Legal Metrology Act, 2009 / Packaged Commodities Rules, 2011)</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div><span className="font-bold">MEMO NO:</span> {memoRef}</div>
                <div><span className="font-bold">DATE:</span> {inspDate}</div>
              </div>

              {/* Section 1 */}
              <div className="space-y-1">
                <p className="font-bold text-[#2D322E] border-b border-[#E7E3DC] pb-1">1. DETAILS OF THE INSPECTING OFFICER</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                  <div><span className="text-[#7A827B]">Name of Inspector:</span> <span className="text-[#2D322E]">{inspection.inspectorName || '___________________'}</span></div>
                  <div><span className="text-[#7A827B]">Designation:</span> <span className="text-[#2D322E]">Legal Metrology Officer (LMO)</span></div>
                  <div><span className="text-[#7A827B]">Station / Node:</span> <span className="text-[#2D322E]">{inspection.stationNode || '___________________'}</span></div>
                </div>
              </div>

              {/* Section 2 */}
              <div className="space-y-1">
                <p className="font-bold text-[#2D322E] border-b border-[#E7E3DC] pb-1">2. DETAILS OF THE ESTABLISHMENT / ACCUSED</p>
                <div className="space-y-1 text-[10px]">
                  <div><span className="text-[#7A827B]">Name of Establishment:</span> <span className="font-semibold text-[#2D322E]">{manufacturerName}</span></div>
                  <div><span className="text-[#7A827B]">Address:</span> <span className="text-[#2D322E]">{manufacturerAddress || inspection.extractedFields?.manufacturerAddress || '___________________'}</span></div>
                  <div><span className="text-[#7A827B]">Nature of Business:</span> <span className="text-[#2D322E]">Packaged Commodity Manufacturer / Marketer</span></div>
                </div>
              </div>

              {/* Section 3 — Product Table */}
              <div className="space-y-1">
                <p className="font-bold text-[#2D322E] border-b border-[#E7E3DC] pb-1">3. PARTICULARS OF SEIZED ARTICLES / GOODS</p>
                <div className="border border-[#E7E3DC] rounded overflow-hidden text-[10px]">
                  <div className="grid grid-cols-6 bg-[#FAF8F5] border-b border-[#E7E3DC] font-bold text-[#535953]">
                    <div className="p-1.5 border-r border-[#E7E3DC]">S.No.</div>
                    <div className="p-1.5 border-r border-[#E7E3DC] col-span-2">Product & Brand</div>
                    <div className="p-1.5 border-r border-[#E7E3DC]">Batch/Lot</div>
                    <div className="p-1.5 border-r border-[#E7E3DC]">MRP (₹)</div>
                    <div className="p-1.5">Violation</div>
                  </div>
                  <div className="grid grid-cols-6 text-[#2D322E]">
                    <div className="p-1.5 border-r border-[#E7E3DC] text-[#535953]">1</div>
                    <div className="p-1.5 border-r border-[#E7E3DC] col-span-2 font-semibold">
                      {inspection.productName}
                      {inspection.extractedFields?.brandName ? ` — ${inspection.extractedFields.brandName}` : ''}
                    </div>
                    <div className="p-1.5 border-r border-[#E7E3DC]">{inspection.batchReference || inspection.extractedFields?.batchNumber || '—'}</div>
                    <div className="p-1.5 border-r border-[#E7E3DC]">{inspection.extractedFields?.mrp || '—'}</div>
                    <div className="p-1.5 text-[#9E432A] font-semibold">{finding.sectionRef}: {finding.title}</div>
                  </div>
                </div>
              </div>

              {/* Section 5 — Grounds */}
              <div className="space-y-1">
                <p className="font-bold text-[#2D322E] border-b border-[#E7E3DC] pb-1">5. GROUNDS / REASONS</p>
                <div className="text-[10px] text-[#535953] bg-[#FAF8F5] p-2.5 rounded border border-[#E7E3DC] leading-relaxed">
                  <span className="font-semibold text-[#9E432A]">Finding:</span>{' '}
                  {finding.detectedText ? `"${finding.detectedText}"` : 'Declaration absent from physical package'}.{' '}
                  {finding.explanation || finding.statutoryRationale || ''}
                </div>
              </div>

              {/* Section 7 Preview */}
              <div className="space-y-1">
                <p className="font-bold text-[#2D322E] border-b border-[#E7E3DC] pb-1">7. SIGNATURES & ACKNOWLEDGEMENTS</p>
                <div className="grid grid-cols-3 gap-2 text-[9px] text-[#7A827B]">
                  <div className="border border-[#E7E3DC] rounded p-2">
                    <p className="font-bold text-[#535953]">A. WITNESS DETAILS</p>
                    <p className="mt-1">1. Signature: ____________</p>
                    <p>2. Signature: ____________</p>
                  </div>
                  <div className="border border-[#E7E3DC] rounded p-2">
                    <p className="font-bold text-[#535953]">B. ACKNOWLEDGEMENT</p>
                    <p className="mt-1 italic">"I hereby acknowledge that a copy of this seizure memo has been handed over to me..."</p>
                  </div>
                  <div className="border border-[#E7E3DC] rounded p-2">
                    <p className="font-bold text-[#535953]">C. INSPECTING OFFICER</p>
                    <p className="mt-1">Name: {inspection.inspectorName || '____________'}</p>
                    <p>Designation: LMO / Inspector</p>
                    <p>Official Stamp: _______</p>
                  </div>
                </div>
              </div>

              <p className="text-[9px] text-[#7A827B] text-center pt-2 border-t border-[#E7E3DC]">
                + Annexure — Inventory Sheet (Page 2)  ·  Full PDF: 3 pages
              </p>
            </div>
          </div>

          {/* Violation detail card */}
          <div className="p-4 bg-[#FAECE7] border border-[#F7D0C4] rounded-xl text-xs space-y-2">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-[#9E432A] shrink-0" />
              <span className="font-bold text-[#9E432A] uppercase tracking-wide text-[10px]">Violation that triggered this Memo</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono">
              <div>
                <span className="text-[10px] text-[#9E432A]/70 uppercase font-bold block">Rule</span>
                <span className="text-[#9E432A] font-semibold">{finding.sectionRef || finding.ruleId}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#9E432A]/70 uppercase font-bold block">Severity</span>
                <span className="text-[#9E432A] font-semibold">{finding.severity}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#9E432A]/70 uppercase font-bold block">Inspection ID</span>
                <span className="text-[#535953]">{inspection.id}</span>
              </div>
            </div>
            <div>
              <span className="text-[10px] text-[#9E432A]/70 uppercase font-bold block">Observed Value</span>
              <span className="text-[#9E432A]">"{finding.detectedText || 'Declaration absent from physical package'}"</span>
            </div>
            <div>
              <span className="text-[10px] text-[#9E432A]/70 uppercase font-bold block">Statutory Standard</span>
              <span className="text-[#535953]">{finding.statutoryStandardText}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#E7E3DC] bg-[#FAF8F5] flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-[#7A827B] font-mono">
            {savedDoc ? (
              <span className="text-[#335E46] font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Memo saved: {savedDoc.documentId}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[#8C5E2D]">
                <Lock className="w-3 h-3" /> Memo not yet saved to records
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveMemoRecord}
              disabled={saving}
              className="h-10 px-4 bg-white border border-[#E7E3DC] hover:bg-[#FAF8F5] rounded-xl text-xs font-semibold text-[#2D322E] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <FileText className="w-4 h-4 text-[#52796F]" />
              <span>{saving ? 'Saving...' : 'Save Memo Record'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="h-10 px-5 bg-[#335E46] hover:bg-[#284B37] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Generating PDF...' : 'Download Memo PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
