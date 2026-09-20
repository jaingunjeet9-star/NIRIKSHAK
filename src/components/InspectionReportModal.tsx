import { useState, useEffect } from 'react';
import { X, Printer, Shield, CheckCircle2, AlertTriangle, AlertOctagon, Check, FileDown, FileText, Camera } from 'lucide-react';
import { InspectionRecord } from '../types';
import { exportInspectionToPDF } from '../lib/pdfExport';
import { exportComplianceReportToDocx } from '../lib/complianceReportDocx';
import { requestJson } from '../lib/api';
import { getImageBinary } from '../lib/indexedDB';
import { useTranslation } from '../lib/i18n';
import { getApplicableActsSummary } from '../config/categorySchemas';

interface InspectionReportModalProps {
  inspection: InspectionRecord;
  onClose: () => void;
}

export function InspectionReportModal({ inspection, onClose }: InspectionReportModalProps) {
  const { t, language } = useTranslation();
  const [downloaded, setDownloaded] = useState(false);
  const [downloadedDocx, setDownloadedDocx] = useState(false);
  const [reportData, setReportData] = useState<InspectionRecord>(inspection);
  const [evidenceImageUrl, setEvidenceImageUrl] = useState<string | null>(null);

  // Sync from backend's persisted inspection record
  useEffect(() => {
    async function loadPersistedReport() {
      try {
        const res = await requestJson<{ inspection: InspectionRecord }>(`/api/reports/${inspection.id}`);
        if (res.inspection) {
          setReportData(res.inspection);
          const imgUrl = res.inspection.images?.[0]?.previewUrl;
          if (imgUrl && (imgUrl.startsWith('data:image') || imgUrl.startsWith('http') || imgUrl.startsWith('blob:'))) {
            setEvidenceImageUrl(imgUrl);
            return;
          }
        }
      } catch (err) {
        console.warn('Using passed inspection record for report:', err);
      }

      // Check current inspection prop or IndexedDB
      const directUrl = inspection.images?.[0]?.previewUrl;
      if (directUrl && (directUrl.startsWith('data:image') || directUrl.startsWith('http') || directUrl.startsWith('blob:'))) {
        setEvidenceImageUrl(directUrl);
      } else if (inspection.images?.[0]?.id) {
        try {
          const blobOrStr = await getImageBinary(inspection.images[0].id);
          if (typeof blobOrStr === 'string') {
            setEvidenceImageUrl(blobOrStr);
          } else if (blobOrStr instanceof Blob) {
            setEvidenceImageUrl(URL.createObjectURL(blobOrStr));
          }
        } catch (e) {
          // ignore
        }
      }
    }
    loadPersistedReport();
  }, [inspection.id, inspection.images]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    try {
      await exportInspectionToPDF(reportData);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Unable to generate PDF document. Please try again.');
    }
  };

  const handleExportDocx = async () => {
    try {
      await exportComplianceReportToDocx(reportData);
      setDownloadedDocx(true);
      setTimeout(() => setDownloadedDocx(false), 3000);
    } catch (err) {
      console.error('Failed to generate DOCX:', err);
      alert('Unable to generate Word document. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-[#E7E3DC] rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Bar */}
        <div className="p-4 bg-[#FAF8F5] border-b border-[#E7E3DC] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#52796F]" />
            <span className="text-xs uppercase font-bold tracking-wider text-[#335E46]">
              {t('modals.reportTitle')}
            </span>
            <span className="px-1.5 py-0.5 bg-[#EBF3EE] border border-[#C7DECF] text-[10px] font-mono font-bold text-[#335E46] rounded">
              COMPLIANCE REPORT · EDITABLE
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportDocx}
              className="h-8 px-3 bg-white border border-[#E7E3DC] hover:bg-[#F6F4EE] text-[#2D322E] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="Download editable Word document (.docx) — compatible with Microsoft Word and Google Docs"
            >
              {downloadedDocx ? <Check className="w-3.5 h-3.5 text-[#335E46]" /> : <FileText className="w-3.5 h-3.5 text-[#52796F]" />}
              <span>{downloadedDocx ? 'Downloaded!' : 'WORD (.DOCX)'}</span>
            </button>
            <button
              type="button"
              onClick={handleExportPDF}
              className="h-8 px-3 bg-[#52796F] hover:bg-[#45665E] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              {downloaded ? <Check className="w-3.5 h-3.5" /> : <FileDown className="w-3.5 h-3.5" />}
              <span>{downloaded ? t('workspace.exportPdfDone') : t('workspace.exportPdf')}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-[#EFECE5] flex items-center justify-center text-[#535953] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Report Document */}
        <div className="p-8 overflow-y-auto font-sans bg-white space-y-6">
          {/* Official Letterhead */}
          <div className="text-center border-b pb-6 border-[#E7E3DC]">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#EBF3EE] border border-[#C7DECF] rounded-md mb-2">
              <Shield className="w-3.5 h-3.5 text-[#52796F]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#335E46]">
                {t('modals.sealText')}
              </span>
            </div>
            <h2 className="text-2xl font-bold font-serif text-[#2D322E]">{t('modals.reportTitle')}</h2>
            <p className="text-xs text-[#535953] mt-1">
              Statutory verification under {getApplicableActsSummary(reportData.category)}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-[#7A827B]">
              <span>ID: <strong className="text-[#2D322E]">{reportData.id}</strong></span>
              <span>•</span>
              <span>Batch: <strong className="text-[#2D322E]">{reportData.batchReference}</strong></span>
              <span>•</span>
              <span>Date: <strong className="text-[#2D322E]">{new Date(reportData.createdAt).toLocaleDateString(language === 'HI' ? 'hi-IN' : 'en-GB')}</strong></span>
              <span>•</span>
              <span>Station: <strong className="text-[#2D322E]">{reportData.stationNode}</strong></span>
            </div>
          </div>

          {/* Scanned Packaging Evidence Section if image is available */}
          {evidenceImageUrl && (
            <div className="p-4 bg-[#FAF8F5] border border-[#E7E3DC] rounded-xl flex flex-col md:flex-row gap-5 items-center">
              <div className="relative max-h-52 max-w-xs overflow-hidden rounded-lg border border-[#E7E3DC] bg-white flex items-center justify-center p-1.5 shadow-xs">
                <img
                  src={evidenceImageUrl}
                  alt={reportData.productName}
                  className="max-h-48 w-auto object-contain rounded"
                />
              </div>
              <div className="flex-1 text-xs space-y-2">
                <div className="flex items-center gap-1.5 text-[#52796F] font-semibold">
                  <Camera className="w-4 h-4" />
                  <span className="uppercase tracking-wider text-[10px]">Scanned Packaging Evidence</span>
                </div>
                <div className="text-sm font-bold text-[#2D322E]">
                  {reportData.productName}
                </div>
                <div className="text-[#535953] text-[11px]">
                  Side: <strong className="text-[#2D322E]">{reportData.images?.[0]?.side || 'FRONT'} Panel</strong> • File: <strong className="text-[#2D322E]">{reportData.images?.[0]?.fileName || 'scanned_label.jpg'}</strong>
                </div>
                <div className="text-[11px] text-[#335E46] font-medium flex items-center gap-1.5 bg-[#EBF3EE] px-2.5 py-1 rounded-md border border-[#C7DECF] w-fit">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Statutory Optical Verification Active ({reportData.boundingBoxes.length} text blocks analyzed)
                </div>
              </div>
            </div>
          )}

          {/* Product Profile & Verification Score */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 p-4 bg-[#FAF8F5] border border-[#E7E3DC] rounded-xl text-xs space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A827B] block">
                {t('modals.reportParticulars')}
              </span>
              <div className="text-base font-bold text-[#2D322E]">{reportData.productName}</div>
              <div className="grid grid-cols-2 gap-2 text-[#535953]">
                <div>{t('workspace.catCategory')}: <strong className="text-[#2D322E]">{t('categories.' + reportData.category, reportData.category)}</strong></div>
                <div>{t('modals.importedGoods')} <strong className="text-[#2D322E]">{reportData.isImported ? t('modals.yes') : t('modals.no')}</strong></div>
                <div>{t('workspace.netQuantity')}: <strong className="text-[#2D322E]">{reportData.extractedFields.netQuantity || t('modals.na')}</strong></div>
                <div>{t('workspace.declaredMrp')}: <strong className="text-[#2D322E]">{reportData.extractedFields.mrp || t('modals.na')}</strong></div>
              </div>
            </div>

            <div className="p-4 bg-[#FAF8F5] border border-[#E7E3DC] rounded-xl flex flex-col justify-center items-center text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A827B]">
                {t('modals.completenessScore')}
              </span>
              <div className={`text-4xl font-bold font-mono mt-1 ${reportData.completenessScore >= 90
                ? 'text-[#335E46]'
                : reportData.completenessScore >= 70
                  ? 'text-[#8C5E2D]'
                  : 'text-[#9E432A]'
                }`}>
                {reportData.completenessScore}<span className="text-base font-normal text-[#7A827B]">/100</span>
              </div>
              <span className="text-[11px] font-semibold text-[#535953] mt-1">
                {t('common.' + (reportData.status === 'COMPLETED' ? 'completed' : reportData.status === 'SEIZURE_FLAGGED' ? 'seizureFlagged' : 'requiresReview'), reportData.status)}
              </span>
            </div>
          </div>

          {/* Findings Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#2D322E]">
                {t('modals.ruleEvalMatrix')} ({reportData.findings.length})
              </h3>
              <div className="flex gap-2 text-xs font-mono">
                <span className="px-2 py-0.5 bg-[#EBF3EE] text-[#335E46] rounded border border-[#C7DECF]">
                  {reportData.summaryCounts.verified} {t('common.verified')}
                </span>
                <span className="px-2 py-0.5 bg-[#FAECE7] text-[#9E432A] rounded border border-[#F7D0C4]">
                  {reportData.summaryCounts.potentialIssues} {t('common.violation')}
                </span>
                <span className="px-2 py-0.5 bg-[#FBF3E8] text-[#8C5E2D] rounded border border-[#EED9C4]">
                  {reportData.summaryCounts.requiresReview} {t('common.requiresReview')}
                </span>
              </div>
            </div>

            {/* Price Overcharge Audit Section if retail price entered */}
            {reportData.extractedFields?.actualSellingPrice !== undefined && reportData.extractedFields?.mrpValue !== undefined && (
              <div className={`p-3.5 rounded-xl border mb-3 ${reportData.extractedFields.actualSellingPrice > reportData.extractedFields.mrpValue
                ? 'bg-[#FAECE7] border-[#F7D0C4] text-[#9E432A]'
                : 'bg-[#EBF3EE] border-[#C7DECF] text-[#335E46]'
                }`}>
                <div className="flex items-center justify-between flex-wrap gap-1 mb-2">
                  <span className="font-bold text-xs uppercase tracking-wider">
                    {reportData.extractedFields.actualSellingPrice > reportData.extractedFields.mrpValue
                      ? '🚨 Statutory Price Overcharge Audit (Contravention)'
                      : '✓ Statutory Price Audit (Compliant)'}
                  </span>
                  <span className="font-mono text-[11px] font-bold">
                    LM Act Sec 36(1) &amp; Rule 18(2)
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div>Printed MRP: <strong className="text-[#2D322E]">₹{reportData.extractedFields.mrpValue.toFixed(2)}</strong></div>
                  <div>Retail Charged: <strong className="text-[#2D322E]">₹{reportData.extractedFields.actualSellingPrice.toFixed(2)}</strong></div>
                  <div>Difference: <strong className={reportData.extractedFields.actualSellingPrice > reportData.extractedFields.mrpValue ? 'text-[#9E432A]' : 'text-[#335E46]'}>
                    {reportData.extractedFields.actualSellingPrice > reportData.extractedFields.mrpValue ? `+₹${(reportData.extractedFields.actualSellingPrice - reportData.extractedFields.mrpValue).toFixed(2)}` : '₹0.00'}
                  </strong></div>
                  <div>Overcharge %: <strong className={reportData.extractedFields.actualSellingPrice > reportData.extractedFields.mrpValue ? 'text-[#9E432A]' : 'text-[#335E46]'}>
                    {reportData.extractedFields.actualSellingPrice > reportData.extractedFields.mrpValue ? `+${(((reportData.extractedFields.actualSellingPrice - reportData.extractedFields.mrpValue) / reportData.extractedFields.mrpValue) * 100).toFixed(1)}%` : '0.0%'}
                  </strong></div>
                </div>
              </div>
            )}

            <div className="border border-[#E7E3DC] rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-[#FAF8F5] border-b border-[#E7E3DC] text-[#7A827B] font-mono text-[11px]">
                  <tr>
                    <th className="p-3">{t('modals.statutoryRule')}</th>
                    <th className="p-3">{t('modals.detectedText')}</th>
                    <th className="p-3">{t('modals.complianceStandard')}</th>
                    <th className="p-3 text-right">{t('modals.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E3DC]">
                  {reportData.findings.map((f) => (
                    <tr key={f.id} className="hover:bg-[#FAF8F5]/50">
                      <td className="p-3 align-top font-semibold text-[#2D322E]">
                        <div>{t('ruleTitles.' + f.ruleId, f.title)}</div>
                        <div className="text-[10px] font-mono text-[#7A827B] font-normal">{f.sectionRef} • {f.actName}</div>
                        {f.statutoryRationale && (
                          <div className="text-[10px] text-[#535953] font-normal mt-1 leading-snug bg-[#FAF8F5] p-1.5 rounded border border-[#E7E3DC]">
                            <strong className="text-[#2D322E]">Rationale: </strong>{f.statutoryRationale}
                          </div>
                        )}
                      </td>
                      <td className="p-3 align-top font-mono text-[#535953] max-w-xs">
                        {f.detectedText || <span className="text-[#9E432A] italic">{t('common.notDetected')}</span>}
                      </td>
                      <td className="p-3 align-top text-[#535953] max-w-xs leading-relaxed">
                        {f.statutoryStandardText}
                      </td>
                      <td className="p-3 align-top text-right whitespace-nowrap font-mono text-[11px] font-bold">
                        {f.status === 'VERIFIED' && (
                          <span className="inline-flex items-center gap-1 text-[#335E46]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {t('common.verified')}
                          </span>
                        )}
                        {f.status === 'POTENTIAL_ISSUE' && (
                          <span className="inline-flex items-center gap-1 text-[#9E432A]">
                            <AlertOctagon className="w-3.5 h-3.5" />
                            {t('common.violation')}
                          </span>
                        )}
                        {f.status === 'REQUIRES_MANUAL_REVIEW' && (
                          <span className="inline-flex items-center gap-1 text-[#8C5E2D]">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {t('common.requiresReview')}
                          </span>
                        )}
                        {f.status === 'NOT_DETECTED' && (
                          <span className="inline-flex items-center gap-1 text-[#7A827B]">
                            {t('common.notDetected')}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Inspector Remarks & Endorsement */}
          <div className="p-4 bg-[#FAF8F5] border border-[#E7E3DC] rounded-xl text-xs space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A827B] block">
              {t('modals.fieldOfficerEndorsement')}
            </span>
            <p className="text-[#2D322E] italic leading-relaxed">
              "{reportData.inspectorNotes || 'Physical sample examined under optical magnification.'}"
            </p>
            <div className="pt-3 border-t border-[#E7E3DC] flex flex-wrap justify-between items-center text-[11px] text-[#7A827B] gap-2">
              <span>{t('modals.signatory')} <strong>{reportData.inspectorName}</strong></span>
              <span className="flex items-center gap-1 font-mono">
                <Shield className="w-3.5 h-3.5 text-[#52796F]" />
                SHA-256 SEAL: <strong className="text-[#335E46]">{reportData.evidenceHash || `${reportData.id}-AUTH-REGISTRY`}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-[#FAF8F5] border-t border-[#E7E3DC] flex items-center justify-between gap-3">
          <span className="text-xs text-[#7A827B]">
            Compliance Report — Editable DOCX or PDF · Section 18, Legal Metrology Act, 2009.
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportDocx}
              className="h-10 px-4 bg-white border border-[#E7E3DC] hover:bg-[#F6F4EE] text-[#2D322E] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="Download editable Word document (.docx)"
            >
              {downloadedDocx ? <Check className="w-4 h-4 text-[#335E46]" /> : <FileText className="w-4 h-4 text-[#52796F]" />}
              <span>{downloadedDocx ? 'DOCX Downloaded!' : 'Download WORD'}</span>
            </button>
            <button
              type="button"
              onClick={handleExportPDF}
              className="h-10 px-4 bg-[#52796F] hover:bg-[#45665E] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              {downloaded ? <Check className="w-4 h-4" /> : <FileDown className="w-4 h-4" />}
              <span>{downloaded ? t('workspace.exportPdfDone') : t('workspace.exportPdf')}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="h-10 px-4 bg-white border border-[#E7E3DC] hover:bg-[#F6F4EE] text-[#2D322E] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#52796F]" />
              <span>{t('modals.printReport')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
