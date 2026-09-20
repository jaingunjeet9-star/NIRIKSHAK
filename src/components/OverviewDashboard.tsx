import { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  ArrowUpRight,
  Download,
  Trash2,
  AlertTriangle,
  X,
  ScanLine,
  FlaskConical,
  Search,
  Filter,
  Calendar,
  RotateCcw,
  FileText,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  FileCode,
  Layers,
  Sparkles,
  AlertOctagon,
  Building2,
  User,
  Tag,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { InspectionRecord, hasUnresolvedFindings, ComplianceDocument } from '../types';
import { exportInspectionToPDF } from '../lib/pdfExport';
import { exportComplianceReportToDocx } from '../lib/complianceReportDocx';
import { exportNoticeToPDF } from '../lib/noticePdfExport';
import { useTranslation } from '../lib/i18n';
import { useUserSession } from '../lib/userSession';
import { requestJson } from '../lib/api';

interface OverviewDashboardProps {
  inspections: InspectionRecord[];
  onSelectInspection: (inspection: InspectionRecord) => void;
  onOpenScanner: () => void;
  onDeleteInspection: (inspectionId: string) => Promise<void>;
  showDemoData?: boolean;
}

// ── Delete Confirmation Dialog ─────────────────────────────────────────────
interface DeleteConfirmDialogProps {
  inspection: InspectionRecord;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

function DeleteConfirmDialog({ inspection, onConfirm, onCancel, isDeleting }: DeleteConfirmDialogProps) {
  const { t } = useTranslation();
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-[#E7E3DC]">
        <div className="flex items-start justify-between p-6 border-b border-[#E7E3DC] bg-[#FFF7F5]">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAECE7] flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-5 h-5 text-[#9E432A]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#2D322E] leading-tight">{t('overview.deleteTitle')}</h2>
              <p className="text-xs text-[#9E432A] font-semibold mt-0.5 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {t('overview.deleteWarning')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="p-1 hover:bg-[#F2F0E8] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4 text-[#7A827B]" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-[#535953]">{t('overview.deleteBody')}</p>

          <div className="bg-[#FAF8F5] border border-[#E7E3DC] rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A827B]">{t('overview.colBatchRef')}</span>
              <span className="font-mono font-bold text-sm text-[#9E432A]">{inspection.batchReference}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A827B]">{t('overview.colInspId')}</span>
              <span className="font-mono text-xs text-[#535953]">{inspection.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A827B]">{t('overview.colProductLabel')}</span>
              <span className="text-xs font-semibold text-[#2D322E] text-right max-w-[200px] truncate">{inspection.productName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A827B]">{t('overview.colInspector')}</span>
              <span className="text-xs text-[#535953]">{inspection.inspectorName}</span>
            </div>
          </div>

          <div className="bg-[#FAECE7] border border-[#F7D0C4] rounded-xl px-4 py-3 text-xs text-[#9E432A] font-medium leading-relaxed">
            {t('overview.deleteAuditNotice')}
          </div>
        </div>

        <div className="px-6 pb-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="h-10 px-5 bg-white border border-[#E7E3DC] hover:bg-[#F2F0E8] text-[#535953] text-sm font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="h-10 px-5 bg-[#9E432A] hover:bg-[#87381F] text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isDeleting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{t('overview.deletingBtn')}</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>{t('overview.deleteConfirmBtn')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Detail Slide-over Modal ──────────────────────────────────────────────────
interface DetailModalProps {
  inspection: InspectionRecord;
  onClose: () => void;
  onInspect: (insp: InspectionRecord) => void;
  onExportPDF: (insp: InspectionRecord) => void;
  onExportDocx: (insp: InspectionRecord) => void;
  onExportMemo: (insp: InspectionRecord) => void;
}

function InspectionDetailModal({
  inspection,
  onClose,
  onInspect,
  onExportPDF,
  onExportDocx,
  onExportMemo,
}: DetailModalProps) {
  const { t } = useTranslation();
  const mfgName =
    inspection.extractedFields?.manufacturerName ||
    inspection.extractedFields?.packerName ||
    inspection.extractedFields?.brandName ||
    t('overview.directPacker');
  const violationsCount = inspection.summaryCounts?.violations || inspection.summaryCounts?.potentialIssues || 0;
  const hasNotice = violationsCount > 0 || inspection.status === 'SEIZURE_FLAGGED';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-[#E7E3DC]">
        {/* Modal Header */}
        <div className="flex items-start justify-between p-6 border-b border-[#E7E3DC] bg-[#FAF8F5] sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#EBF3EE] text-[#335E46] border border-[#C7DECF]">
                {inspection.id}
              </span>
              <span className="text-[10px] font-mono text-[#7A827B]">
                {new Date(inspection.createdAt).toLocaleString('en-IN')}
              </span>
              {violationsCount > 0 ? (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#FAECE7] text-[#9E432A] border border-[#F7D0C4]">
                  {violationsCount} VIOLATION{violationsCount > 1 ? 'S' : ''}
                </span>
              ) : (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#EBF3EE] text-[#335E46] border border-[#C7DECF]">
                  VERIFIED
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-[#2D322E] mt-1.5">{inspection.productName}</h2>
            <p className="text-xs text-[#7A827B] flex items-center gap-1 mt-0.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>{mfgName}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-[#F2F0E8] rounded-xl text-[#7A827B] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAF8F5] border border-[#E7E3DC] p-4 rounded-xl">
            <div>
              <span className="text-[10px] font-bold uppercase text-[#7A827B]">Batch Reference</span>
              <p className="font-mono text-xs font-bold text-[#2D322E] mt-0.5">{inspection.batchReference}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-[#7A827B]">Compliance Score</span>
              <p className="font-mono text-xs font-bold text-[#335E46] mt-0.5">{inspection.completenessScore}/100</p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-[#7A827B]">Product Category</span>
              <p className="font-mono text-xs text-[#535953] mt-0.5">{inspection.category}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-[#7A827B]">Inspector</span>
              <p className="text-xs text-[#535953] mt-0.5 truncate">{inspection.inspectorName}</p>
            </div>
          </div>

          {/* Stored Package Images Grid */}
          <div>
            <h3 className="text-xs font-bold text-[#7A827B] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#52796F]" />
              <span>Package Evidence Images ({inspection.images?.length || 0})</span>
            </h3>
            {inspection.images && inspection.images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {inspection.images.map((img, idx) => (
                  <div key={img.id || idx} className="border border-[#E7E3DC] rounded-xl overflow-hidden bg-[#F6F4EE] aspect-square relative group">
                    {img.previewUrl ? (
                      <img src={img.previewUrl} alt={img.fileName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-[#7A827B] text-xs font-mono p-2 text-center">
                        <ScanLine className="w-6 h-6 mb-1 text-[#52796F]" />
                        <span>{img.fileName || `View ${idx + 1}`}</span>
                      </div>
                    )}
                    <span className="absolute bottom-1.5 left-1.5 bg-black/60 text-white font-mono text-[9px] px-1.5 py-0.5 rounded">
                      {img.side || `VIEW ${idx + 1}`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#7A827B] italic">No image binaries attached to this audit record.</p>
            )}
          </div>

          {/* Extracted Product Metadata */}
          <div>
            <h3 className="text-xs font-bold text-[#7A827B] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#52796F]" />
              <span>Extracted Statutory Label Declarations</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 bg-[#FAF8F5] border border-[#E7E3DC] rounded-lg">
                <span className="text-[10px] text-[#7A827B] block">MRP</span>
                <span className="font-semibold font-mono text-[#2D322E]">{inspection.extractedFields?.mrp || 'Not Declared'}</span>
              </div>
              <div className="p-2.5 bg-[#FAF8F5] border border-[#E7E3DC] rounded-lg">
                <span className="text-[10px] text-[#7A827B] block">Net Quantity</span>
                <span className="font-semibold text-[#2D322E]">{inspection.extractedFields?.netQuantity || 'Not Declared'}</span>
              </div>
              <div className="p-2.5 bg-[#FAF8F5] border border-[#E7E3DC] rounded-lg">
                <span className="text-[10px] text-[#7A827B] block">Manufacturing Date</span>
                <span className="font-semibold text-[#2D322E]">{inspection.extractedFields?.mfgMonthYear || inspection.extractedFields?.packingDate || 'Not Declared'}</span>
              </div>
              <div className="p-2.5 bg-[#FAF8F5] border border-[#E7E3DC] rounded-lg">
                <span className="text-[10px] text-[#7A827B] block">Expiry / Use Before</span>
                <span className="font-semibold text-[#2D322E]">{inspection.extractedFields?.expiryDate || inspection.extractedFields?.useBeforeDate || 'N/A'}</span>
              </div>
              <div className="p-2.5 bg-[#FAF8F5] border border-[#E7E3DC] rounded-lg">
                <span className="text-[10px] text-[#7A827B] block">Customer Care</span>
                <span className="font-semibold text-[#2D322E] truncate block">{inspection.extractedFields?.consumerCarePhone || inspection.extractedFields?.consumerCareEmail || 'Not Declared'}</span>
              </div>
              <div className="p-2.5 bg-[#FAF8F5] border border-[#E7E3DC] rounded-lg">
                <span className="text-[10px] text-[#7A827B] block">License / Reg</span>
                <span className="font-semibold text-[#2D322E] truncate block">{inspection.extractedFields?.fssaiLicenseNumber || inspection.extractedFields?.cosmeticMfgLicense || 'Not Declared'}</span>
              </div>
            </div>
          </div>

          {/* Compliance Findings Summary */}
          {inspection.findings && inspection.findings.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-[#7A827B] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#52796F]" />
                <span>Statutory Audit Findings ({inspection.findings.length})</span>
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {inspection.findings.map((f) => (
                  <div
                    key={f.id}
                    className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                      f.status === 'VIOLATION' || f.status === 'POTENTIAL_ISSUE'
                        ? 'bg-[#FAECE7] border-[#F7D0C4] text-[#9E432A]'
                        : 'bg-[#EBF3EE] border-[#C7DECF] text-[#335E46]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-bold font-mono text-[11px]">
                        <span>[{f.sectionRef || f.ruleId}]</span>
                        <span>{f.title}</span>
                      </div>
                      <p className="mt-1 leading-relaxed opacity-90">{f.explanation || f.detectedText}</p>
                    </div>
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-white/60 shrink-0">
                      {f.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-6 bg-[#FAF8F5] border-t border-[#E7E3DC] flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => { onClose(); onInspect(inspection); }}
            className="h-10 px-5 bg-[#52796F] hover:bg-[#45665E] text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <span>Inspect in Scanner</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onExportPDF(inspection)}
              className="h-9 px-3 bg-white border border-[#E7E3DC] hover:bg-[#F2F0E8] text-[#335E46] font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Summary PDF</span>
            </button>

            <button
              type="button"
              onClick={() => onExportDocx(inspection)}
              className="h-9 px-3 bg-white border border-[#E7E3DC] hover:bg-[#F2F0E8] text-[#2D322E] font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <FileCode className="w-3.5 h-3.5 text-[#52796F]" />
              <span>DOCX Report</span>
            </button>

            {hasNotice && (
              <button
                type="button"
                onClick={() => onExportMemo(inspection)}
                className="h-9 px-3 bg-[#FAECE7] border border-[#F7D0C4] hover:bg-[#F7D0C4] text-[#9E432A] font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>Download Memo PDF</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard Component ───────────────────────────────────────────────
export function OverviewDashboard({
  inspections,
  onSelectInspection,
  onOpenScanner,
  onDeleteInspection,
  showDemoData = false,
}: OverviewDashboardProps) {
  const { t } = useTranslation();
  const { canDelete, currentUser } = useUserSession();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedManufacturer, setSelectedManufacturer] = useState('ALL');
  const [selectedDateRange, setSelectedDateRange] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedViolationFilter, setSelectedViolationFilter] = useState('ALL');
  const [selectedInspector, setSelectedInspector] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Facets state
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableManufacturers, setAvailableManufacturers] = useState<string[]>([]);
  const [availableInspectors, setAvailableInspectors] = useState<string[]>([]);

  // UI / Action state
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filteredInspections, setFilteredInspections] = useState<InspectionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [pendingDelete, setPendingDelete] = useState<InspectionRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [detailRecord, setDetailRecord] = useState<InspectionRecord | null>(null);
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);
  const [generatingDocxId, setGeneratingDocxId] = useState<string | null>(null);
  const [generatingMemoId, setGeneratingMemoId] = useState<string | null>(null);

  // High-level KPI calculation
  const totalInspections = inspections.length;
  const reviewCount = inspections.filter(hasUnresolvedFindings).length;
  const verifiedCount = inspections.filter(
    (i) => !hasUnresolvedFindings(i) && i.summaryCounts?.violations === 0 && i.status === 'COMPLETED'
  ).length;
  const flaggedCount = inspections.filter(
    (i) => (i.summaryCounts?.violations || 0) > 0 || i.status === 'SEIZURE_FLAGGED'
  ).length;
  const complianceRate = totalInspections > 0 ? Math.round((verifiedCount / totalInspections) * 100) : 0;

  // ── Execute Server-backed Query ───────────────────────────────────────────
  const fetchFilteredInspections = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams();
      params.set('includeDemo', String(showDemoData));
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (selectedCategory !== 'ALL') params.set('category', selectedCategory);
      if (selectedManufacturer !== 'ALL') params.set('manufacturer', selectedManufacturer);
      if (selectedStatus !== 'ALL') params.set('status', selectedStatus);
      if (selectedViolationFilter !== 'ALL') params.set('violationFilter', selectedViolationFilter);
      if (selectedInspector !== 'ALL') params.set('inspector', selectedInspector);
      if (selectedDateRange !== 'ALL') params.set('dateRange', selectedDateRange);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (sortBy) params.set('sortBy', sortBy);
      params.set('page', String(page));
      params.set('limit', String(pageSize));

      const res = await requestJson<{
        inspections: InspectionRecord[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        availableCategories?: string[];
        availableManufacturers?: string[];
        availableInspectors?: string[];
      }>(`/api/inspections?${params.toString()}`);

      if (res && Array.isArray(res.inspections)) {
        setFilteredInspections(res.inspections);
        setTotalCount(res.total ?? res.inspections.length);
        setTotalPages(res.totalPages || Math.ceil((res.total ?? res.inspections.length) / pageSize) || 1);
        if (res.availableCategories) setAvailableCategories(res.availableCategories);
        if (res.availableManufacturers) setAvailableManufacturers(res.availableManufacturers);
        if (res.availableInspectors) setAvailableInspectors(res.availableInspectors);
      } else {
        setFilteredInspections([]);
        setTotalCount(0);
        setTotalPages(1);
      }
    } catch (err: unknown) {
      console.warn('[Search API Fallback]: Querying local cache:', err);
      setFetchError('Unable to connect to server archive. Displaying cached records.');

      // Local fallback filter if backend request fails
      let list = [...inspections];
      if (searchQuery.trim()) {
        const terms = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
        list = list.filter((i) => {
          const parts: string[] = [
            i.productName || '',
            i.batchReference || '',
            i.id || '',
            i.scanId || '',
            i.status || '',
            i.category || '',
            i.inspectorName || '',
            i.extractedFields?.productName || '',
            i.extractedFields?.brandName || '',
            i.extractedFields?.manufacturerName || '',
            i.extractedFields?.packerName || '',
            i.extractedFields?.batchNumber || '',
            i.extractedFields?.mrp || '',
            i.productIdentification?.subcategory || '',
            i.productIdentification?.brandName || '',
            i.productIdentification?.productName || '',
          ];
          if (Array.isArray(i.findings)) {
            i.findings.forEach((f) => {
              parts.push(f.ruleId || '', f.sectionRef || '', f.title || '', f.status || '', f.actName || '');
            });
          }
          const text = parts.join(' ').toLowerCase();
          return terms.every((t) => text.includes(t));
        });
      }
      setFilteredInspections(list);
      setTotalCount(list.length);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [
    searchQuery,
    selectedCategory,
    selectedManufacturer,
    selectedStatus,
    selectedViolationFilter,
    selectedInspector,
    selectedDateRange,
    startDate,
    endDate,
    sortBy,
    page,
    pageSize,
    inspections,
    showDemoData,
  ]);

  useEffect(() => {
    fetchFilteredInspections();
  }, [fetchFilteredInspections]);

  // Reset page to 1 whenever filters change
  const handleFilterChange = (setter: (val: any) => void, value: any) => {
    setter(value);
    setPage(1);
  };

  const handleClearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedManufacturer('ALL');
    setSelectedDateRange('ALL');
    setStartDate('');
    setEndDate('');
    setSelectedStatus('ALL');
    setSelectedViolationFilter('ALL');
    setSelectedInspector('ALL');
    setSortBy('newest');
    setPage(1);
  };

  const activeFiltersCount =
    (searchQuery.trim() ? 1 : 0) +
    (selectedCategory !== 'ALL' ? 1 : 0) +
    (selectedManufacturer !== 'ALL' ? 1 : 0) +
    (selectedDateRange !== 'ALL' ? 1 : 0) +
    (selectedStatus !== 'ALL' ? 1 : 0) +
    (selectedViolationFilter !== 'ALL' ? 1 : 0) +
    (selectedInspector !== 'ALL' ? 1 : 0) +
    (startDate || endDate ? 1 : 0);

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await onDeleteInspection(pendingDelete.id);
      setPendingDelete(null);
      fetchFilteredInspections();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete inspection record.';
      setDeleteError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportPDF = async (insp: InspectionRecord) => {
    if (generatingPdfId) return;
    setGeneratingPdfId(insp.id);
    try {
      await exportInspectionToPDF(insp);
    } catch (err) {
      console.error('[PDF Export] Error:', err);
    } finally {
      setGeneratingPdfId(null);
    }
  };

  const handleExportDocx = async (insp: InspectionRecord) => {
    if (generatingDocxId) return;
    setGeneratingDocxId(insp.id);
    try {
      await exportComplianceReportToDocx(insp);
    } catch (err) {
      console.error('[DOCX Export] Error:', err);
    } finally {
      setGeneratingDocxId(null);
    }
  };

  const handleExportMemo = async (insp: InspectionRecord) => {
    if (generatingMemoId) return;
    setGeneratingMemoId(insp.id);
    try {
      const firstViolation = insp.findings?.find(
        (f) => f.status === 'VIOLATION' || f.status === 'POTENTIAL_ISSUE'
      );
      const mfgName =
        insp.extractedFields?.manufacturerName ||
        insp.extractedFields?.packerName ||
        insp.extractedFields?.brandName ||
        'Manufacturer (To Be Identified)';

      const memoDoc: ComplianceDocument = {
        documentId: `NIR-MEMO-${new Date(insp.createdAt || Date.now()).getFullYear()}-${String(insp.id).slice(-6)}`,
        documentType: 'MEMO',
        status: 'DRAFT',
        manufacturerId: insp.id,
        manufacturerName: mfgName,
        manufacturerAddress: insp.extractedFields?.manufacturerAddress || insp.extractedFields?.packerAddress || '',
        inspectionId: insp.id,
        productName: insp.productName,
        brandName: insp.extractedFields?.brandName || '',
        violationFindingId: firstViolation?.id || 'v-01',
        ruleId: firstViolation?.ruleId || 'RULE-06-1A',
        sectionRef: firstViolation?.sectionRef || firstViolation?.ruleId || 'Sec 18',
        ruleTitle: firstViolation?.title || 'Statutory Declaration Non-Compliance',
        ruleCategory: firstViolation?.actName || 'Legal Metrology',
        severity: firstViolation?.severity || 'HIGH',
        findingStatus: firstViolation?.status || 'POTENTIAL_ISSUE',
        detectedText: firstViolation?.detectedText || '',
        statutoryStandardText: firstViolation?.statutoryStandardText || '',
        evidenceRef: `Package View — ${firstViolation?.sourceImageView || 'PDP'} (${insp.images?.length || 1} Scanned Images)`,
        inspectorName: insp.inspectorName || 'Field Inspector (Station 04)',
        stationNode: insp.stationNode || 'NIC-METROLOGY-NODE: #DELHI-WEST-04',
        inspectionDate: insp.createdAt,
        documentBody: '',
        batchReference: insp.batchReference || insp.extractedFields?.batchNumber || '',
        netQuantity: insp.extractedFields?.netQuantity || '',
        mrp: insp.extractedFields?.mrp || '',
        explanation: firstViolation?.explanation || firstViolation?.statutoryRationale || '',
        groundsForAction: '',
        createdAt: insp.createdAt || new Date().toISOString(),
        createdBy: insp.inspectorName || 'Field Inspector',
      };
      await exportNoticeToPDF(memoDoc);
    } catch (err) {
      console.error('[Notice Memo Export] Error:', err);
    } finally {
      setGeneratingMemoId(null);
    }
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 md:px-10 py-6 md:py-8 space-y-6 md:space-y-8">
      {/* Delete Confirmation Dialog */}
      {pendingDelete && (
        <DeleteConfirmDialog
          inspection={pendingDelete}
          onConfirm={handleConfirmDelete}
          onCancel={() => { if (!isDeleting) { setPendingDelete(null); setDeleteError(null); } }}
          isDeleting={isDeleting}
        />
      )}

      {/* Record Detail Modal */}
      {detailRecord && (
        <InspectionDetailModal
          inspection={detailRecord}
          onClose={() => setDetailRecord(null)}
          onInspect={onSelectInspection}
          onExportPDF={handleExportPDF}
          onExportDocx={handleExportDocx}
          onExportMemo={handleExportMemo}
        />
      )}

      {/* Delete Error Toast */}
      {deleteError && (
        <div className="fixed bottom-6 right-6 z-50 bg-white border border-[#F7D0C4] rounded-2xl shadow-lg px-5 py-4 flex items-start gap-3 max-w-sm">
          <AlertTriangle className="w-5 h-5 text-[#9E432A] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[#2D322E]">{t('overview.deleteFailed')}</p>
            <p className="text-xs text-[#7A827B] mt-0.5">{deleteError}</p>
          </div>
          <button type="button" onClick={() => setDeleteError(null)} className="ml-2 p-1 hover:bg-[#F2F0E8] rounded-lg cursor-pointer">
            <X className="w-3.5 h-3.5 text-[#7A827B]" />
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7E3DC] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#EBF3EE] border border-[#C7DECF] rounded-lg mb-2">
            <Shield className="w-3.5 h-3.5 text-[#52796F]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#335E46]">
              {t('overview.badgeCenter')}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#2D322E] tracking-tight">
            {t('overview.title')}
          </h2>
          <p className="text-xs md:text-sm text-[#535953] mt-1">
            {t('overview.subtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenScanner}
          className="h-11 px-5 bg-[#52796F] hover:bg-[#45665E] text-white text-xs md:text-sm font-semibold rounded-xl flex items-center gap-2 transition-all shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <span>{t('overview.launchScanner')}</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <div className="p-5 bg-white border border-[#E7E3DC] rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A827B]">
            {t('overview.statTotal')}
          </span>
          <div className="text-3xl font-bold font-mono text-[#2D322E] mt-2">
            {totalInspections}
          </div>
          <p className="text-xs text-[#535953] mt-1">
            {t('overview.statTotalSub')}
          </p>
        </div>

        <div className="p-5 bg-white border border-[#E7E3DC] rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A827B]">
            {t('overview.statCompliance')}
          </span>
          <div className="text-3xl font-bold font-mono text-[#335E46] mt-2">
            {totalInspections > 0 ? `${complianceRate}%` : 'N/A'}
          </div>
          <p className="text-xs text-[#535953] mt-1">
            {verifiedCount} {t('overview.statComplianceSub')}
          </p>
        </div>

        <div className="p-5 bg-white border border-[#E7E3DC] rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A827B]">
            {t('overview.statFlagged')}
          </span>
          <div className="text-3xl font-bold font-mono text-[#9E432A] mt-2">
            {flaggedCount}
          </div>
          <p className="text-xs text-[#535953] mt-1">
            {t('overview.statFlaggedSub')}
          </p>
        </div>

        <div className="p-5 bg-white border border-[#E7E3DC] rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A827B]">
            {t('overview.statReviews')}
          </span>
          <div className="text-3xl font-bold font-mono text-[#8C5E2D] mt-2">
            {reviewCount}
          </div>
          <p className="text-xs text-[#535953] mt-1">
            {t('overview.statReviewsSub')}
          </p>
        </div>
      </div>

      {/* ── SEARCH & RETRIEVAL INSPECTION ARCHIVE SECTION ── */}
      <div className="bg-white border border-[#E7E3DC] rounded-2xl overflow-hidden shadow-xs">
        {/* Table / Archive Header */}
        <div className="p-5 md:p-6 bg-[#FAF8F5] border-b border-[#E7E3DC] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#2D322E]">
                {t('overview.tableTitle')}
              </h3>
              <p className="text-xs text-[#7A827B]">
                Search, filter, and retrieve past statutory inspection records, scanned products & compliance reports
              </p>
            </div>
            {!canDelete && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] text-[#7A827B] font-medium bg-[#F6F4EE] border border-[#E7E3DC] px-3 py-1.5 rounded-lg self-start sm:self-auto">
                <Shield className="w-3 h-3" />
                {t('overview.deleteRoleHint')}
              </span>
            )}
          </div>

          {/* Search Bar + Filter Toggle Row */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Bar */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-[#7A827B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
                placeholder="Search products, manufacturers, inspection IDs, batch numbers..."
                className="w-full h-11 pl-10 pr-9 bg-white border border-[#E7E3DC] focus:border-[#52796F] focus:ring-1 focus:ring-[#52796F] rounded-xl text-xs md:text-sm text-[#2D322E] outline-none transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleFilterChange(setSearchQuery, '')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#7A827B] hover:text-[#2D322E] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setIsFilterDrawerOpen((prev) => !prev)}
              className={`h-11 px-4 border rounded-xl text-xs md:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                isFilterDrawerOpen || activeFiltersCount > 0
                  ? 'bg-[#EBF3EE] border-[#52796F] text-[#335E46]'
                  : 'bg-white border-[#E7E3DC] hover:bg-[#F6F4EE] text-[#2D322E]'
              }`}
            >
              <Filter className="w-4 h-4 text-[#52796F]" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#335E46] text-white font-mono text-[10px] font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => handleFilterChange(setSortBy, e.target.value)}
              className="h-11 px-3 bg-white border border-[#E7E3DC] rounded-xl text-xs font-semibold text-[#2D322E] outline-none cursor-pointer hover:bg-[#F6F4EE] transition-all shadow-2xs"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="productName">Sort: Product Name (A–Z)</option>
              <option value="manufacturer">Sort: Manufacturer (A–Z)</option>
              <option value="score">Sort: Score (High to Low)</option>
            </select>
          </div>

          {/* Collapsible Advanced Filters Panel */}
          {isFilterDrawerOpen && (
            <div className="p-4 bg-white border border-[#E7E3DC] rounded-xl space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                {/* Category Filter */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#7A827B] mb-1">
                    Product Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => handleFilterChange(setSelectedCategory, e.target.value)}
                    className="w-full h-9 px-2.5 bg-[#FAF8F5] border border-[#E7E3DC] rounded-lg text-xs text-[#2D322E] outline-none"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="FOOD_BEVERAGE">Food & Beverage</option>
                    <option value="PERSONAL_CARE_COSMETIC">Personal Care & Cosmetic</option>
                    <option value="STATIONERY_OFFICE">Stationery & Office</option>
                    <option value="HOUSEHOLD_COMMODITY">Household Commodity</option>
                    <option value="ELECTRONICS">Electronics & Electrical</option>
                    <option value="APPAREL_TEXTILE">Apparel & Textile</option>
                    <option value="TOYS_CHILDREN">Toys & Children</option>
                    <option value="SEED_AGRICULTURE">Seed & Agriculture</option>
                    <option value="FERTILIZER_CHEMICAL">Fertilizer & Chemical</option>
                    <option value="PHARMACEUTICAL">Pharmaceutical</option>
                    {availableCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Manufacturer Filter */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#7A827B] mb-1">
                    Manufacturer / Packer
                  </label>
                  <select
                    value={selectedManufacturer}
                    onChange={(e) => handleFilterChange(setSelectedManufacturer, e.target.value)}
                    className="w-full h-9 px-2.5 bg-[#FAF8F5] border border-[#E7E3DC] rounded-lg text-xs text-[#2D322E] outline-none"
                  >
                    <option value="ALL">All Manufacturers</option>
                    {availableManufacturers.map((mfg) => (
                      <option key={mfg} value={mfg}>{mfg}</option>
                    ))}
                  </select>
                </div>

                {/* Compliance Status Filter */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#7A827B] mb-1">
                    Compliance Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => handleFilterChange(setSelectedStatus, e.target.value)}
                    className="w-full h-9 px-2.5 bg-[#FAF8F5] border border-[#E7E3DC] rounded-lg text-xs text-[#2D322E] outline-none"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="COMPLETED">Completed / Verified</option>
                    <option value="SEIZURE_FLAGGED">Seizure Flagged</option>
                    <option value="NEEDS_REVIEW">Requires Review</option>
                    <option value="DRAFT">Draft</option>
                  </select>
                </div>

                {/* Violation Filter */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#7A827B] mb-1">
                    Violation Filter
                  </label>
                  <select
                    value={selectedViolationFilter}
                    onChange={(e) => handleFilterChange(setSelectedViolationFilter, e.target.value)}
                    className="w-full h-9 px-2.5 bg-[#FAF8F5] border border-[#E7E3DC] rounded-lg text-xs text-[#2D322E] outline-none"
                  >
                    <option value="ALL">All Records</option>
                    <option value="NO_VIOLATIONS">No Violations (Clean)</option>
                    <option value="HAS_VIOLATIONS">Has Violations</option>
                    <option value="CRITICAL">Critical Violations / Seizures</option>
                  </select>
                </div>
              </div>

              {/* Date Filter Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-[#E7E3DC]">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#7A827B] mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#52796F]" />
                    <span>Inspection Date Range</span>
                  </label>
                  <select
                    value={selectedDateRange}
                    onChange={(e) => handleFilterChange(setSelectedDateRange, e.target.value)}
                    className="w-full h-9 px-2.5 bg-[#FAF8F5] border border-[#E7E3DC] rounded-lg text-xs text-[#2D322E] outline-none"
                  >
                    <option value="ALL">All Time</option>
                    <option value="TODAY">Today</option>
                    <option value="7DAYS">Last 7 Days</option>
                    <option value="30DAYS">Last 30 Days</option>
                    <option value="90DAYS">Last 90 Days</option>
                    <option value="CUSTOM">Custom Range</option>
                  </select>
                </div>

                {selectedDateRange === 'CUSTOM' && (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#7A827B] mb-1">From Date</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => handleFilterChange(setStartDate, e.target.value)}
                        className="w-full h-9 px-2.5 bg-[#FAF8F5] border border-[#E7E3DC] rounded-lg text-xs text-[#2D322E] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#7A827B] mb-1">To Date</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => handleFilterChange(setEndDate, e.target.value)}
                        className="w-full h-9 px-2.5 bg-[#FAF8F5] border border-[#E7E3DC] rounded-lg text-xs text-[#2D322E] outline-none"
                      />
                    </div>
                  </>
                )}

                {/* Inspector Filter */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#7A827B] mb-1 flex items-center gap-1">
                    <User className="w-3 h-3 text-[#52796F]" />
                    <span>Inspecting Officer</span>
                  </label>
                  <select
                    value={selectedInspector}
                    onChange={(e) => handleFilterChange(setSelectedInspector, e.target.value)}
                    className="w-full h-9 px-2.5 bg-[#FAF8F5] border border-[#E7E3DC] rounded-lg text-xs text-[#2D322E] outline-none"
                  >
                    <option value="ALL">All Inspectors</option>
                    {availableInspectors.map((inspName) => (
                      <option key={inspName} value={inspName}>{inspName}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Active Filter Badges Bar */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A827B]">Active Filters:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EBF3EE] text-[#335E46] border border-[#C7DECF] font-mono text-[11px]">
                  Search: "{searchQuery}"
                  <button type="button" onClick={() => handleFilterChange(setSearchQuery, '')} className="hover:text-[#9E432A] cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedCategory !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EBF3EE] text-[#335E46] border border-[#C7DECF] text-[11px]">
                  Category: {selectedCategory}
                  <button type="button" onClick={() => handleFilterChange(setSelectedCategory, 'ALL')} className="hover:text-[#9E432A] cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedManufacturer !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EBF3EE] text-[#335E46] border border-[#C7DECF] text-[11px]">
                  Mfg: {selectedManufacturer}
                  <button type="button" onClick={() => handleFilterChange(setSelectedManufacturer, 'ALL')} className="hover:text-[#9E432A] cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedStatus !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EBF3EE] text-[#335E46] border border-[#C7DECF] text-[11px]">
                  Status: {selectedStatus}
                  <button type="button" onClick={() => handleFilterChange(setSelectedStatus, 'ALL')} className="hover:text-[#9E432A] cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedViolationFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FAECE7] text-[#9E432A] border border-[#F7D0C4] text-[11px]">
                  Violations: {selectedViolationFilter}
                  <button type="button" onClick={() => handleFilterChange(setSelectedViolationFilter, 'ALL')} className="hover:text-[#9E432A] cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="text-[11px] font-bold text-[#9E432A] hover:underline cursor-pointer ml-1 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear All</span>
              </button>
            </div>
          )}
        </div>

        {/* ── TABLE DATA / ARCHIVE LIST ── */}
        <div className="overflow-x-auto relative min-h-[220px]">
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs z-20 flex items-center justify-center">
              <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-[#E7E3DC] shadow-md text-xs font-semibold text-[#335E46]">
                <span className="w-4 h-4 border-2 border-[#52796F]/30 border-t-[#52796F] rounded-full animate-spin" />
                <span>Searching inspection archive...</span>
              </div>
            </div>
          )}

          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] border-b border-[#E7E3DC] font-mono text-[#7A827B] text-[11px]">
              <tr>
                <th className="p-4">{t('overview.colBatch')}</th>
                <th className="p-4">{t('overview.colProduct')}</th>
                <th className="p-4">{t('overview.colCategory')}</th>
                <th className="p-4">{t('overview.colScore')}</th>
                <th className="p-4">{t('overview.colStatus')}</th>
                <th className="p-4 text-right">{t('overview.colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E3DC]">
              {fetchError ? (
                /* Error State */
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#FAECE7] border border-[#F7D0C4] flex items-center justify-center text-[#9E432A]">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-[#2D322E]">Unable to retrieve inspection history</h4>
                        <p className="text-xs text-[#7A827B]">{fetchError}</p>
                      </div>
                      <button
                        type="button"
                        onClick={fetchFilteredInspections}
                        className="h-9 px-4 bg-[#52796F] hover:bg-[#43645C] text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Retry Search</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredInspections.length === 0 ? (
                /* No Results State */
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#F6F4EE] border border-[#E7E3DC] flex items-center justify-center text-[#7A827B]">
                        <ScanLine className="w-6 h-6 text-[#52796F]" />
                      </div>
                      {searchQuery.trim() ? (
                        <div className="space-y-2">
                          <h4 className="font-bold text-sm text-[#2D322E]">No matching inspection records found.</h4>
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EBF3EE] border border-[#C7DECF] rounded-full text-xs font-mono text-[#335E46]">
                            <span>Search: "{searchQuery.trim()}"</span>
                          </div>
                          <div className="pt-2 text-xs text-[#535953] text-left max-w-xs mx-auto space-y-1 bg-[#FAF8F5] p-3 rounded-xl border border-[#E7E3DC]">
                            <span className="font-bold text-[#2D322E] block mb-1">Suggestions:</span>
                            <p>• Check spelling</p>
                            <p>• Try a broader product name</p>
                            <p>• Clear filters</p>
                          </div>
                        </div>
                      ) : totalInspections === 0 ? (
                        <div className="space-y-2">
                          <h4 className="font-bold text-sm text-[#2D322E]">No inspection records available yet.</h4>
                          <p className="text-xs text-[#7A827B]">
                            Start a new inspection to create your first statutory audit record.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <h4 className="font-semibold text-sm text-[#2D322E]">No inspections match selected filters</h4>
                          <p className="text-xs text-[#7A827B]">
                            Try broadening your filter criteria.
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        {activeFiltersCount > 0 && (
                          <button
                            type="button"
                            onClick={handleClearAllFilters}
                            className="h-9 px-4 bg-[#FAF8F5] border border-[#E7E3DC] hover:bg-[#F6F4EE] text-[#52796F] text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Clear All Filters</span>
                          </button>
                        )}
                        {totalInspections === 0 && (
                          <button
                            type="button"
                            onClick={onOpenScanner}
                            className="h-9 px-4 bg-[#52796F] hover:bg-[#43645C] text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                            <span>Start New Scan</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                /* Data Rows */
                filteredInspections.map((insp) => {
                  const isDemo = insp.analysisSource === 'preset' || Boolean((insp as any).isDemoData);
                  const mfg = insp.extractedFields?.manufacturerName || insp.extractedFields?.packerName || insp.extractedFields?.brandName || t('overview.directPacker');
                  const violationsCount = insp.summaryCounts?.violations || insp.summaryCounts?.potentialIssues || 0;
                  const hasNotice = violationsCount > 0 || insp.status === 'SEIZURE_FLAGGED';

                  return (
                    <tr key={insp.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                      {/* Batch & Inspection ID */}
                      <td className="p-4 font-mono font-semibold text-[#2D322E]">
                        <div className="flex items-center gap-1.5">
                          <span>{insp.batchReference}</span>
                          {isDemo && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D]">
                              <FlaskConical className="w-2.5 h-2.5" />
                              DEMO
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#7A827B] flex items-center gap-1 mt-0.5">
                          <span>{insp.id}</span>
                          <span className="text-[9px] text-[#7A827B]">• {new Date(insp.createdAt).toLocaleDateString('en-IN')}</span>
                        </div>
                      </td>

                      {/* Product & Manufacturer */}
                      <td className="p-4">
                        <div className="font-semibold text-[#2D322E] flex items-center gap-1.5">
                          <span>{insp.productName}</span>
                        </div>
                        <div className="text-[#7A827B] text-[11px] truncate max-w-[200px]" title={mfg}>
                          {mfg}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-4 font-mono text-[11px] text-[#535953]">
                        {t('categories.' + insp.category, insp.category)}
                      </td>

                      {/* Score */}
                      <td className="p-4">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded ${
                            insp.completenessScore >= 90
                              ? 'bg-[#EBF3EE] text-[#335E46]'
                              : insp.completenessScore >= 70
                              ? 'bg-[#FBF3E8] text-[#8C5E2D]'
                              : 'bg-[#FAECE7] text-[#9E432A]'
                          }`}
                        >
                          {insp.completenessScore}/100
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`px-2.5 py-1 font-mono text-[10px] font-bold rounded border ${
                              insp.status === 'COMPLETED'
                                ? 'bg-[#EBF3EE] border-[#C7DECF] text-[#335E46]'
                                : insp.status === 'SEIZURE_FLAGGED'
                                ? 'bg-[#FAECE7] border-[#F7D0C4] text-[#9E432A]'
                                : 'bg-[#FBF3E8] border-[#EED9C4] text-[#8C5E2D]'
                            }`}
                          >
                            {t('common.' + (insp.status === 'COMPLETED' ? 'completed' : insp.status === 'SEIZURE_FLAGGED' ? 'seizureFlagged' : 'requiresReview'), insp.status)}
                          </span>
                          {violationsCount > 0 && (
                            <span className="text-[9px] font-bold font-mono text-[#9E432A]">
                              {violationsCount} Violation{violationsCount > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {/* View Record Details */}
                          <button
                            type="button"
                            onClick={() => setDetailRecord(insp)}
                            title="View complete historical details, evidence images & findings"
                            className="h-8 px-2.5 bg-white hover:bg-[#F2F0E8] border border-[#E7E3DC] text-[#2D322E] font-semibold text-xs rounded-lg transition-colors inline-flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#52796F]" />
                            <span>Details</span>
                          </button>

                          {/* PDF Summary Report */}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleExportPDF(insp); }}
                            disabled={generatingPdfId === insp.id}
                            title="Download Statutory Inspection Summary (PDF)"
                            className="h-8 px-2 bg-white hover:bg-[#F2F0E8] border border-[#E7E3DC] text-[#335E46] font-semibold text-xs rounded-lg transition-colors inline-flex items-center gap-1 shadow-xs cursor-pointer disabled:opacity-60"
                          >
                            {generatingPdfId === insp.id ? (
                              <span className="w-3.5 h-3.5 border-2 border-[#52796F]/30 border-t-[#52796F] rounded-full animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                            <span>{t('overview.btnPdf')}</span>
                          </button>

                          {/* DOCX Compliance Report */}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleExportDocx(insp); }}
                            disabled={generatingDocxId === insp.id}
                            title="Download Editable Compliance Report (DOCX)"
                            className="h-8 px-2 bg-white hover:bg-[#F2F0E8] border border-[#E7E3DC] text-[#2D322E] font-semibold text-xs rounded-lg transition-colors inline-flex items-center gap-1 shadow-xs cursor-pointer disabled:opacity-60"
                          >
                            {generatingDocxId === insp.id ? (
                              <span className="w-3.5 h-3.5 border-2 border-[#52796F]/30 border-t-[#52796F] rounded-full animate-spin" />
                            ) : (
                              <FileCode className="w-3.5 h-3.5 text-[#52796F]" />
                            )}
                            <span>DOCX</span>
                          </button>

                          {/* Manufacturer Notice PDF (only if violations exist) */}
                          {hasNotice && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleExportMemo(insp); }}
                              disabled={generatingMemoId === insp.id}
                              title="Download Official Seizure / Notice PDF"
                              className="h-8 px-2 bg-[#FAECE7] hover:bg-[#F7D0C4] border border-[#F7D0C4] text-[#9E432A] font-semibold text-xs rounded-lg transition-colors inline-flex items-center gap-1 shadow-xs cursor-pointer disabled:opacity-60"
                            >
                              {generatingMemoId === insp.id ? (
                                <span className="w-3.5 h-3.5 border-2 border-[#9E432A]/30 border-t-[#9E432A] rounded-full animate-spin" />
                              ) : (
                                <AlertOctagon className="w-3.5 h-3.5" />
                              )}
                              <span>Notice</span>
                            </button>
                          )}

                          {/* Inspect in Scanner */}
                          <button
                            type="button"
                            onClick={() => onSelectInspection(insp)}
                            title="Open this exact historical inspection record in Scanner"
                            className="h-8 px-3 bg-white hover:bg-[#F2F0E8] border border-[#E7E3DC] text-[#2D322E] font-semibold text-xs rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <span>{t('overview.btnInspect')}</span>
                            <ArrowUpRight className="w-3.5 h-3.5 text-[#52796F]" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!canDelete) {
                                setDeleteError(`Deletion requires Administrator or Supervisor role. Your active role is ${currentUser.role}.`);
                                return;
                              }
                              setPendingDelete(insp);
                              setDeleteError(null);
                            }}
                            title={canDelete ? "Delete this inspection record permanently" : "Requires Administrator or Supervisor role"}
                            className="h-8 px-2 bg-white hover:bg-[#FAECE7] border border-[#E7E3DC] hover:border-[#F7D0C4] text-[#9E432A] font-semibold text-xs rounded-lg transition-colors inline-flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── PAGINATION BAR ── */}
        <div className="p-4 bg-[#FAF8F5] border-t border-[#E7E3DC] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-[#7A827B] font-mono">
            Showing <strong className="text-[#2D322E]">{totalCount > 0 ? (page - 1) * pageSize + 1 : 0}</strong>–
            <strong className="text-[#2D322E]">{Math.min(page * pageSize, totalCount)}</strong> of{' '}
            <strong className="text-[#2D322E]">{totalCount}</strong> inspection records
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 px-3 bg-white border border-[#E7E3DC] hover:bg-[#F2F0E8] text-[#2D322E] font-semibold rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
              let pNum = idx + 1;
              if (totalPages > 5 && page > 3) {
                pNum = page - 2 + idx;
                if (pNum > totalPages) pNum = totalPages - (4 - idx);
              }

              return (
                <button
                  key={pNum}
                  type="button"
                  onClick={() => setPage(pNum)}
                  className={`w-8 h-8 font-mono text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    page === pNum
                      ? 'bg-[#52796F] text-white shadow-2xs'
                      : 'bg-white border border-[#E7E3DC] hover:bg-[#F2F0E8] text-[#2D322E]'
                  }`}
                >
                  {pNum}
                </button>
              );
            })}

            <button
              type="button"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 px-3 bg-white border border-[#E7E3DC] hover:bg-[#F2F0E8] text-[#2D322E] font-semibold rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
