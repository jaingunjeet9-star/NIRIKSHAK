import { useState, useRef, useEffect, ChangeEvent } from 'react';
import {
  UploadCloud,
  Camera,
  Bolt,
  FileText,
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  Download,
  Sun,
  Gavel,
  Wheat,
  FlaskConical,
  Sprout,
  Maximize2,
  ScanLine,
  RefreshCw,
  Sparkles,
  Plus,
  Trash2,
  Layers,
  Eye,
  Info,
  X,
  ImagePlus,
  ZoomIn,
  RotateCcw,
  Crosshair,
  ShieldCheck,
  Copy,
  Check,
  DollarSign,
} from 'lucide-react';
import { InspectionRecord, BoundingBox, ProductCategory, ImageSide, ComplianceFinding } from '../types';
import { storeImageBinary, getImageBinary } from '../lib/indexedDB';
import { requestJson } from '../lib/api';
import { exportInspectionToPDF } from '../lib/pdfExport';
import { ShowCauseNoticeModal } from './ShowCauseNoticeModal';
import { InspectionReportModal } from './InspectionReportModal';
import { useTranslation } from '../lib/i18n';
import { evaluateCompliance } from '../engine/evaluator';
import { generateInspectionEvidenceHash } from '../lib/cryptoHash';
import { PrecisionAnnotationViewer } from './PrecisionAnnotationViewer';
import { createPresetPackagingSvg, getShortFieldLabel } from '../lib/annotationUtils';

export function normalizeCategory(rawCat?: string): ProductCategory {
  if (!rawCat) return 'GENERAL_PACKAGED_COMMODITY';
  const upper = rawCat.toUpperCase().trim();

  const matchesWord = (keyword: string) => new RegExp(`\\b${keyword}\\b`, 'i').test(upper);

  if (
    upper.includes('STATIONERY') ||
    upper.includes('OFFICE') ||
    upper.includes('PENCIL') ||
    upper.includes('NOTEBOOK') ||
    upper.includes('MARKER') ||
    matchesWord('PEN') ||
    matchesWord('PENS') ||
    upper === 'STATIONERY_OFFICE'
  ) {
    return 'STATIONERY_OFFICE';
  }
  if (
    upper.includes('COSMETIC') ||
    upper.includes('PERSONAL') ||
    upper.includes('BEAUTY') ||
    upper.includes('SKIN') ||
    upper.includes('HAIR') ||
    upper.includes('SUNSCREEN') ||
    upper.includes('SHAMPOO') ||
    upper.includes('CREAM') ||
    upper.includes('LOTION') ||
    upper.includes('MOISTURIZER') ||
    upper.includes('DERMA') ||
    upper.includes('CLEANSER') ||
    matchesWord('WASH') ||
    matchesWord('SOAP') ||
    upper === 'PERSONAL_CARE_COSMETIC'
  ) {
    return 'PERSONAL_CARE_COSMETIC';
  }
  if (
    upper.includes('FOOD') ||
    upper.includes('BEVERAGE') ||
    upper.includes('ALMOND') ||
    upper.includes('BISCUIT') ||
    upper.includes('WATER') ||
    upper.includes('SNACK') ||
    upper.includes('NUTRITION') ||
    upper.includes('ATTA') ||
    upper.includes('FLOUR') ||
    upper.includes('SPICE') ||
    upper.includes('RICE') ||
    upper.includes('SUGAR') ||
    matchesWord('OIL') ||
    upper === 'FOOD_BEVERAGE'
  ) {
    return 'FOOD_BEVERAGE';
  }
  if (
    upper.includes('HOUSEHOLD') ||
    upper.includes('DETERGENT') ||
    upper.includes('CLEANER') ||
    upper.includes('DISHWASH') ||
    upper === 'HOUSEHOLD_COMMODITY'
  ) {
    return 'HOUSEHOLD_COMMODITY';
  }
  if (
    upper.includes('ELECTRONIC') ||
    upper.includes('ELECTRICAL') ||
    upper.includes('BULB') ||
    upper.includes('APPLIANCE') ||
    matchesWord('LED') ||
    upper === 'ELECTRONICS'
  ) {
    return 'ELECTRONICS';
  }
  if (
    upper.includes('APPAREL') ||
    upper.includes('TEXTILE') ||
    upper.includes('GARMENT') ||
    upper.includes('SHIRT') ||
    matchesWord('CLOTH') ||
    matchesWord('CLOTHING') ||
    upper === 'APPAREL_TEXTILE'
  ) {
    return 'APPAREL_TEXTILE';
  }
  if (
    upper.includes('TOY') ||
    upper.includes('GAME') ||
    upper.includes('PUZZLE') ||
    upper.includes('BRICK') ||
    upper.includes('CHILDREN') ||
    upper === 'TOYS_CHILDREN'
  ) {
    return 'TOYS_CHILDREN';
  }
  if (
    upper.includes('HARDWARE') ||
    upper.includes('TOOL') ||
    upper === 'HARDWARE_CONSUMER'
  ) {
    return 'HARDWARE_CONSUMER';
  }
  if (
    upper.includes('FERTILIZER') ||
    upper.includes('CHEMICAL') ||
    upper.includes('UREA') ||
    upper.includes('DAP') ||
    upper.includes('NPK') ||
    upper === 'FERTILIZER_CHEMICAL'
  ) {
    return 'FERTILIZER_CHEMICAL';
  }
  if (
    upper.includes('PESTICIDE') ||
    upper.includes('INSECTICIDE') ||
    upper.includes('CROP PROTECTION') ||
    upper.includes('CROP_PROTECTION') ||
    upper === 'PESTICIDE_CROP_PROTECTION'
  ) {
    return 'PESTICIDE_CROP_PROTECTION';
  }
  if (
    upper.includes('SEED') ||
    upper.includes('AGRICULTURE') ||
    upper === 'SEED_AGRICULTURE'
  ) {
    return 'SEED_AGRICULTURE';
  }

  // --- Drugs & Cosmetics Act categories ---
  if (upper === 'DRUG_SCHEDULE_H1' || upper.includes('SCHEDULE_H1') || upper.includes('SCHEDULE H1')) {
    return 'DRUG_SCHEDULE_H1';
  }
  if (upper === 'DRUG_SCHEDULE_H' || upper.includes('SCHEDULE_H') || upper.includes('SCHEDULE H')) {
    return 'DRUG_SCHEDULE_H';
  }
  if (upper === 'DRUG_SCHEDULE_X' || upper.includes('SCHEDULE_X') || upper.includes('SCHEDULE X')) {
    return 'DRUG_SCHEDULE_X';
  }
  if (upper === 'DRUG_SCHEDULE_G' || upper.includes('SCHEDULE_G') || upper.includes('SCHEDULE G')) {
    return 'DRUG_SCHEDULE_G';
  }
  if (upper === 'DRUG_BIOLOGICAL' || upper.includes('BIOLOGICAL')) {
    return 'DRUG_BIOLOGICAL';
  }
  if (upper === 'DRUG_VETERINARY' || upper.includes('VETERINARY')) {
    return 'DRUG_VETERINARY';
  }
  if (upper === 'DRUG_GENERAL') {
    return 'DRUG_GENERAL';
  }
  if (upper.includes('HOMOEO') || upper === 'HOMOEOPATHIC_MEDICINE') {
    return 'HOMOEOPATHIC_MEDICINE';
  }
  if (upper.includes('AYURVED') || upper === 'AYURVEDIC_MEDICINE') {
    return 'AYURVEDIC_MEDICINE';
  }
  if (upper.includes('SIDDHA') || upper === 'SIDDHA_MEDICINE') {
    return 'SIDDHA_MEDICINE';
  }
  if (upper.includes('UNANI') || upper === 'UNANI_MEDICINE') {
    return 'UNANI_MEDICINE';
  }
  if (upper.includes('IN_VITRO') || upper.includes('DIAGNOSTIC') || upper === 'IN_VITRO_DIAGNOSTIC') {
    return 'IN_VITRO_DIAGNOSTIC';
  }
  if (upper.includes('CONTRACEPTIVE') || upper === 'CONTRACEPTIVE_MECHANICAL') {
    return 'CONTRACEPTIVE_MECHANICAL';
  }
  if (upper.includes('DRESSING') || upper === 'SURGICAL_DRESSING') {
    return 'SURGICAL_DRESSING';
  }
  if (upper.includes('DISINFECTANT')) {
    return 'DISINFECTANT';
  }
  if (upper.includes('DEVICE') || upper === 'MEDICAL_DEVICE') {
    return 'MEDICAL_DEVICE';
  }
  if (upper.includes('PHARMA') || upper.includes('MEDICINE') || upper.includes('TABLET') || upper.includes('CAPSULE')) {
    return 'PHARMACEUTICAL';
  }

  if (upper === 'UNKNOWN') return 'UNKNOWN';
  return 'GENERAL_PACKAGED_COMMODITY';
}

// ─── Multi-Image Pending Slot ────────────────────────────────────────────────
interface PendingImageSlot {
  id: string;
  base64: string;
  mimeType: string;
  fileName: string;
  userLabel?: string;
  previewUrl: string; // same as base64 for uploaded images
}

// ─── Scan Progress Step ──────────────────────────────────────────────────────
interface ScanStep {
  id: string;
  label: string;
  done: boolean;
  active: boolean;
}

// ─── Evidence Modal State ────────────────────────────────────────────────────
interface EvidenceModalState {
  imageIndex: number;
  imageId: string;
  viewLabel: string;
  previewUrl: string;
  fieldLabel: string;
  fieldValue: string;
}

interface InspectionWorkspaceProps {
  currentInspection: InspectionRecord;
  onUpdateInspection: (updated: InspectionRecord) => void;
  onLoadPreset: (presetId: string) => void;
  language: 'EN' | 'HI';
  onBackToCommandCenter?: () => void;
}

const MAX_IMAGES = 4;

// Helper: View label from ImageSide enum
function viewLabel(side?: string): string {
  const map: Record<string, string> = {
    FRONT: 'Front / PDP',
    BACK: 'Back Panel',
    LEFT_SIDE: 'Left Side',
    RIGHT_SIDE: 'Right Side',
    TOP_NECK: 'Top / Neck',
    NECK: 'Neck / Cap',
    BOTTOM: 'Bottom',
    LABEL: 'Label',
    CAP: 'Cap',
    OTHER: 'Other',
    UNKNOWN: 'Unknown',
  };
  return map[side || 'UNKNOWN'] || side || 'View';
}

export function InspectionWorkspace({
  currentInspection,
  onUpdateInspection,
  onLoadPreset,
  language,
}: InspectionWorkspaceProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'upload' | 'camera'>('upload');
  const [selectedTag, setSelectedTag] = useState<BoundingBox | null>(null);
  const [activeWorkspaceImageIndex, setActiveWorkspaceImageIndex] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanSteps, setScanSteps] = useState<ScanStep[]>([]);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [evidenceModal, setEvidenceModal] = useState<EvidenceModalState | null>(null);

  // ── Multi-Image State ──────────────────────────────────────────────────────
  const [pendingImages, setPendingImages] = useState<PendingImageSlot[]>([]);
  const [maxImageAlert, setMaxImageAlert] = useState(false);

  // Slot-level hidden file inputs (one per slot + one for "add new")
  const addFileInputRef = useRef<HTMLInputElement | null>(null);
  const replaceFileInputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null]);

  // Camera multi-capture: captured frames before submission
  const [cameraCaptures, setCameraCaptures] = useState<PendingImageSlot[]>([]);

  // Camera refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Race condition guard
  const activeScanIdRef = useRef<string | null>(null);
  // Last submitted payload for retry
  const lastSubmittedImagesRef = useRef<PendingImageSlot[] | null>(null);

  // ── Image preview from persisted inspection (for existing single-image scans) ──
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Sync preview from persisted inspection record
  useEffect(() => {
    if (currentInspection) {
      const img = currentInspection.images?.[0]?.previewUrl;
      if (img && (img.startsWith('data:image') || img.startsWith('http') || img.startsWith('blob:'))) {
        setUploadedPreview(img);
      } else if (currentInspection.images?.[0]?.id) {
        getImageBinary(currentInspection.images[0].id).then((stored) => {
          if (stored && typeof stored === 'string') {
            setUploadedPreview(stored);
          } else if (stored instanceof Blob) {
            setUploadedPreview(URL.createObjectURL(stored));
          }
        }).catch(() => {});
      } else {
        setUploadedPreview(null);
      }
    }
  }, [currentInspection.id, currentInspection.images]);

  // ── Roadmap Phase 1: Cryptographic Evidence Hash & Price Overcharge ────────
  const [evidenceHash, setEvidenceHash] = useState<string>('');
  const [copiedHash, setCopiedHash] = useState(false);
  const [sellingPriceInput, setSellingPriceInput] = useState<string>(
    currentInspection.extractedFields?.actualSellingPrice !== undefined
      ? String(currentInspection.extractedFields.actualSellingPrice)
      : ''
  );
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);

  // Sync selling price input when inspection changes
  useEffect(() => {
    setSellingPriceInput(
      currentInspection.extractedFields?.actualSellingPrice !== undefined
        ? String(currentInspection.extractedFields.actualSellingPrice)
        : ''
    );
  }, [currentInspection.id, currentInspection.extractedFields?.actualSellingPrice]);

  // Compute immutable SHA-256 evidence digest for chain-of-custody
  useEffect(() => {
    let isCancelled = false;
    generateInspectionEvidenceHash(currentInspection)
      .then((hash) => {
        if (!isCancelled) {
          setEvidenceHash(hash);
          if (!currentInspection.evidenceHash || currentInspection.evidenceHash !== hash) {
            currentInspection.evidenceHash = hash;
            currentInspection.hashAlgorithm = 'SHA-256';
            currentInspection.tamperVerified = true;
          }
        }
      })
      .catch((err) => console.error('[Evidence Hash Error]:', err));
    return () => {
      isCancelled = true;
    };
  }, [
    currentInspection.id,
    currentInspection.updatedAt,
    currentInspection.extractedFields?.actualSellingPrice,
    currentInspection.extractedFields?.mrp,
    currentInspection.extractedFields?.netQuantity,
  ]);

  const handleUpdateSellingPrice = (valStr: string) => {
    setSellingPriceInput(valStr);
    const numVal = parseFloat(valStr);
    const updatedFields = { ...currentInspection.extractedFields };
    if (!isNaN(numVal) && numVal > 0) {
      updatedFields.actualSellingPrice = numVal;
    } else {
      delete updatedFields.actualSellingPrice;
      delete updatedFields.mrpOverchargeAmount;
      delete updatedFields.mrpOverchargePercent;
    }

    const { findings, score, summaryCounts, officialNoticeDraft } = evaluateCompliance(
      updatedFields,
      currentInspection.category,
      currentInspection.isImported,
      currentInspection.boundingBoxes
    );

    const updatedInspection: InspectionRecord = {
      ...currentInspection,
      extractedFields: updatedFields,
      findings,
      completenessScore: score,
      summaryCounts,
      officialNoticeDraft: officialNoticeDraft || currentInspection.officialNoticeDraft,
      updatedAt: new Date().toISOString(),
    };

    onUpdateInspection(updatedInspection);
  };

  const handleLocateViolation = (finding: ComplianceFinding) => {
    let targetBox = currentInspection.boundingBoxes.find((b) => b.id === finding.targetBoundingBoxId);
    if (!targetBox) {
      const rId = (finding.ruleId || '').toLowerCase();
      targetBox = currentInspection.boundingBoxes.find((b) => {
        const f = (b.field || '').toLowerCase();
        const l = (b.label || '').toLowerCase();
        if (rId.includes('mrp') || rId.includes('overcharge') || rId.includes('r18')) return f.includes('mrp') || l.includes('mrp');
        if (rId.includes('06-1a') || rId.includes('name')) return f.includes('product') || f.includes('brand') || l.includes('product');
        if (rId.includes('06-1b') || rId.includes('qty')) return f.includes('quantity') || l.includes('quantity');
        if (rId.includes('06-1c') || rId.includes('mfg')) return f.includes('mfg') || f.includes('packer') || l.includes('mfg');
        if (rId.includes('06-1e') || rId.includes('date')) return f.includes('date') || l.includes('date');
        if (rId.includes('06-1n') || rId.includes('care')) return f.includes('care') || f.includes('phone') || l.includes('care');
        return false;
      });
    }

    if (targetBox) {
      setSelectedTag(targetBox);
      if (targetBox.sourceImageIndex !== undefined) {
        setActiveWorkspaceImageIndex(targetBox.sourceImageIndex);
        if (currentInspection.images?.[targetBox.sourceImageIndex]?.previewUrl) {
          setUploadedPreview(currentInspection.images[targetBox.sourceImageIndex].previewUrl!);
        }
      }
      canvasContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // ── Scan Progress Builder ─────────────────────────────────────────────────
  function buildInitialScanSteps(imageCount: number): ScanStep[] {
    const steps: ScanStep[] = [];
    for (let i = 0; i < imageCount; i++) {
      steps.push({
        id: `ocr-${i}`,
        label: `Image ${i + 1} OCR Analysis`,
        done: false,
        active: i === 0,
      });
    }
    steps.push(
      { id: 'merge', label: 'Combining product information', done: false, active: false },
      { id: 'dedup', label: 'Resolving duplicate fields', done: false, active: false },
      { id: 'conflict', label: 'Checking field conflicts', done: false, active: false },
      { id: 'classify', label: 'Identifying product category', done: false, active: false },
      { id: 'rules', label: 'Selecting applicable statutory rules', done: false, active: false },
      { id: 'compliance', label: 'Running compliance checks', done: false, active: false },
    );
    return steps;
  }

  async function tickScanStep(stepId: string, delay = 400) {
    await new Promise((r) => setTimeout(r, delay));
    setScanSteps((prev) => {
      const idx = prev.findIndex((s) => s.id === stepId);
      if (idx === -1) return prev;
      return prev.map((s, i) => ({
        ...s,
        done: i <= idx ? true : s.done,
        active: i === idx + 1,
      }));
    });
  }

  // ── Camera ─────────────────────────────────────────────────────────────────
  const handleStartCamera = async () => {
    setActiveTab('camera');
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setCameraActive(true);
      } else {
        alert('Camera access is not supported in this browser environment.');
      }
    } catch (err) {
      console.warn('[Camera Access Error]:', err);
      alert('Unable to access device camera. Please upload an image file instead.');
      setActiveTab('upload');
    }
  };

  const handleCaptureCamera = () => {
    if (!videoRef.current) return;
    const totalExisting = pendingImages.length + cameraCaptures.length;
    if (totalExisting >= MAX_IMAGES) {
      setMaxImageAlert(true);
      setTimeout(() => setMaxImageAlert(false), 3000);
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      const newCapture: PendingImageSlot = {
        id: `cam-${Date.now()}`,
        base64: dataUrl,
        mimeType: 'image/jpeg',
        fileName: `capture_view_${cameraCaptures.length + 1}.jpg`,
        previewUrl: dataUrl,
      };
      setCameraCaptures((prev) => [...prev, newCapture]);
    }
  };

  const handleRemoveCameraCapture = (id: string) => {
    setCameraCaptures((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSubmitCameraCaptures = () => {
    if (cameraCaptures.length === 0) return;
    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    setCameraActive(false);
    setActiveTab('upload');
    const combined = [...pendingImages, ...cameraCaptures].slice(0, MAX_IMAGES);
    setPendingImages(combined);
    setCameraCaptures([]);
    // Auto-trigger scan
    handleProcessMultiImage(combined);
  };

  const handleStopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    setCameraActive(false);
    setActiveTab('upload');
    setCameraCaptures([]);
  };

  // ── File Selection ─────────────────────────────────────────────────────────
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('File read error'));
      reader.readAsDataURL(file);
    });
  };

  const handleAddFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const available = MAX_IMAGES - pendingImages.length;
    if (available <= 0) {
      setMaxImageAlert(true);
      setTimeout(() => setMaxImageAlert(false), 3000);
      return;
    }
    const toAdd = Array.from(files).slice(0, available);
    const newSlots: PendingImageSlot[] = [];
    for (const file of toAdd) {
      try {
        await storeImageBinary(`img-${Date.now()}`, file);
        const base64 = await readFileAsBase64(file);
        newSlots.push({
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          base64,
          mimeType: file.type || 'image/jpeg',
          fileName: file.name || 'upload.jpg',
          previewUrl: base64,
        });
      } catch (err) {
        console.error('[File Read Error]:', err);
      }
    }
    const updated = [...pendingImages, ...newSlots];
    setPendingImages(updated);
    // If any files were truncated, show alert
    if (files.length > available) {
      setMaxImageAlert(true);
      setTimeout(() => setMaxImageAlert(false), 4000);
    }
    // Auto-scan if images were added
    if (newSlots.length > 0) {
      handleProcessMultiImage(updated);
    }
  };

  const handleReplaceImage = async (slotIndex: number, file: File) => {
    try {
      const base64 = await readFileAsBase64(file);
      const updated = pendingImages.map((img, i) =>
        i === slotIndex
          ? { ...img, base64, mimeType: file.type || 'image/jpeg', fileName: file.name, previewUrl: base64 }
          : img
      );
      setPendingImages(updated);
    } catch (err) {
      console.error('[Replace Image Error]:', err);
    }
  };

  const handleRemoveImage = (slotIndex: number) => {
    setPendingImages((prev) => prev.filter((_, i) => i !== slotIndex));
  };

  // ── Main Multi-Image Scan ──────────────────────────────────────────────────
  const handleProcessMultiImage = async (images?: PendingImageSlot[]) => {
    const imagesToScan = images ?? pendingImages;
    if (imagesToScan.length === 0) {
      addFileInputRef.current?.click();
      return;
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const scanId = `scan-${Date.now()}-${randomSuffix}`;
    activeScanIdRef.current = scanId;
    lastSubmittedImagesRef.current = imagesToScan;

    const steps = buildInitialScanSteps(imagesToScan.length);
    setScanSteps(steps);

    // Immediate draft inspection to clear stale state
    const freshDraft: InspectionRecord = {
      id: `INSP-SCAN-${Date.now()}`,
      scanId,
      analysisSource: 'uploaded_image',
      batchReference: `BATCH-SCAN-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'ANALYZING',
      inspectorName: 'Field Officer (Station 04)',
      stationNode: 'NIC-METROLOGY-NODE: #DELHI-WEST-04',
      productName:
        imagesToScan.length === 1
          ? `Scan: ${imagesToScan[0].fileName}`
          : `Product Scan (${imagesToScan.length} Views)`,
      category: 'UNKNOWN',
      isImported: false,
      images: imagesToScan.map((img, idx) => ({
        id: `img-draft-${idx}`,
        side: 'FRONT' as ImageSide,
        fileName: img.fileName,
        fileSize: Math.round(img.base64.length * 0.75),
        mimeType: img.mimeType,
        uploadedAt: new Date().toISOString(),
        previewUrl: img.previewUrl,
      })),
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

    onUpdateInspection(freshDraft);
    setIsProcessing(true);
    if (imagesToScan.length === 1) {
      setUploadedPreview(imagesToScan[0].previewUrl);
    }

    try {
      // Tick OCR steps for visual feedback
      for (let i = 0; i < imagesToScan.length; i++) {
        await tickScanStep(`ocr-${i}`, 350);
      }
      await tickScanStep('merge', 250);
      await tickScanStep('dedup', 200);
      await tickScanStep('conflict', 250);

      // Send multi-image payload to backend
      const payload =
        imagesToScan.length === 1
          ? {
              imageBase64: imagesToScan[0].base64,
              mimeType: imagesToScan[0].mimeType,
              fileName: imagesToScan[0].fileName,
            }
          : {
              images: imagesToScan.map((img) => ({
                imageBase64: img.base64,
                mimeType: img.mimeType,
                fileName: img.fileName,
                userLabel: img.userLabel,
              })),
            };

      const res = await requestJson<{ success?: boolean; inspection: InspectionRecord; error?: string; message?: string }>(
        '/api/inspections/scan',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

      // Race condition protection
      if (activeScanIdRef.current !== scanId) {
        console.warn(`[SCAN RACE CONDITION PREVENTED] Ignored scan ${scanId} response.`);
        return;
      }

      await tickScanStep('classify', 200);
      await tickScanStep('rules', 200);
      await tickScanStep('compliance', 200);

      if (res.inspection) {
        // Restore preview URLs from pending slots into result images
        if (res.inspection.images && res.inspection.images.length > 0) {
          res.inspection.images = res.inspection.images.map((img, idx) => ({
            ...img,
            previewUrl: img.previewUrl || (imagesToScan[idx]?.previewUrl ?? ''),
          }));
        } else {
          res.inspection.images = freshDraft.images;
        }

        if (imagesToScan.length === 1) {
          setUploadedPreview(imagesToScan[0].previewUrl);
        } else {
          setUploadedPreview(imagesToScan[0]?.previewUrl ?? null);
        }

        onUpdateInspection(res.inspection);
      }
    } catch (err: unknown) {
      console.error('[Multi-Image Verification Error]:', err);

      if (activeScanIdRef.current !== scanId) return;

      let errorRecord: InspectionRecord;
      if (err && typeof err === 'object' && 'inspection' in err && (err as any).inspection) {
        errorRecord = (err as any).inspection;
      } else {
        const errorMessage =
          err instanceof Error ? err.message : 'Unable to complete image analysis due to network or service error.';
        errorRecord = {
          ...freshDraft,
          status: 'ANALYSIS_ERROR',
          errorMessage: `${errorMessage} Please verify server configuration and retry.`,
        };
      }

      onUpdateInspection(errorRecord);
    } finally {
      if (activeScanIdRef.current === scanId) {
        setIsProcessing(false);
        setScanSteps((prev) => prev.map((s) => ({ ...s, done: true, active: false })));
      }
    }
  };

  const handleRetryScan = () => {
    if (lastSubmittedImagesRef.current && lastSubmittedImagesRef.current.length > 0) {
      handleProcessMultiImage(lastSubmittedImagesRef.current);
    } else if (pendingImages.length > 0) {
      handleProcessMultiImage(pendingImages);
    } else {
      addFileInputRef.current?.click();
    }
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      await exportInspectionToPDF(currentInspection);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('Unable to generate PDF document. Please try again.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const violationsCount = currentInspection.summaryCounts.potentialIssues;
  const currentCategory = currentInspection.category || 'UNKNOWN';

  // Dynamic presets based strictly on active category
  const getCategoryPresets = (rawCat?: string) => {
    const normCat = normalizeCategory(rawCat);
    switch (normCat) {
      case 'STATIONERY_OFFICE':
        return [
          { id: 'INSP-2026-9001', label: t('workspace.presetBallPen'), icon: FileText },
        ];
      case 'PERSONAL_CARE_COSMETIC':
        return [
          { id: 'INSP-2026-9002', label: t('workspace.presetSunscreen'), icon: Sparkles },
          { id: 'INSP-2026-9003', label: t('workspace.presetFacewash'), icon: Sparkles },
          { id: 'INSP-2026-9004', label: t('workspace.presetShampoo'), icon: Sparkles },
          { id: 'INSP-2026-9005', label: t('workspace.presetMoisturizer'), icon: Sparkles },
        ];
      case 'FOOD_BEVERAGE':
        return [
          { id: 'INSP-2026-9006', label: t('workspace.presetBiscuit'), icon: FileText },
          { id: 'INSP-2026-9007', label: t('workspace.presetWater'), icon: FileText },
          { id: 'INSP-2026-9008', label: t('workspace.presetAtta'), icon: FileText },
          { id: 'INSP-2026-9009', label: t('workspace.presetAlmond'), icon: FileText },
        ];
      case 'HOUSEHOLD_COMMODITY':
        return [
          { id: 'INSP-2026-9010', label: t('workspace.presetDetergent'), icon: FileText },
        ];
      case 'ELECTRONICS':
        return [
          { id: 'INSP-2026-9011', label: t('workspace.presetLedBulb'), icon: Bolt },
        ];
      case 'APPAREL_TEXTILE':
        return [
          { id: 'INSP-2026-9012', label: t('workspace.presetTshirt'), icon: FileText },
        ];
      case 'TOYS_CHILDREN':
        return [
          { id: 'INSP-2026-9013', label: t('workspace.presetToy'), icon: Sparkles },
        ];
      case 'SEED_AGRICULTURE':
        return [
          { id: 'INSP-2026-9014', label: t('workspace.presetMaize'), icon: Wheat },
        ];
      case 'FERTILIZER_CHEMICAL':
        return [
          { id: 'INSP-2026-9015', label: t('workspace.presetFertilizer'), icon: FlaskConical },
        ];
      case 'GENERAL_PACKAGED_COMMODITY':
      case 'UNKNOWN':
      default:
        return [
          { id: 'INSP-2026-9001', label: t('workspace.presetBallPen'), icon: FileText },
          { id: 'INSP-2026-9002', label: t('workspace.presetSunscreen'), icon: Sparkles },
          { id: 'INSP-2026-9006', label: t('workspace.presetBiscuit'), icon: FileText },
          { id: 'INSP-2026-9010', label: t('workspace.presetDetergent'), icon: FileText },
          { id: 'INSP-2026-9011', label: t('workspace.presetLedBulb'), icon: Bolt },
          { id: 'INSP-2026-9012', label: t('workspace.presetTshirt'), icon: FileText },
          { id: 'INSP-2026-9013', label: t('workspace.presetToy'), icon: Sparkles },
          { id: 'INSP-2026-9014', label: t('workspace.presetMaize'), icon: Wheat },
          { id: 'INSP-2026-9015', label: t('workspace.presetFertilizer'), icon: FlaskConical },
        ];
    }
  };

  // Dynamic statutory standards checkboxes based on active category
  const getCategoryStandards = (cat: ProductCategory) => {
    switch (cat) {
      case 'PERSONAL_CARE_COSMETIC':
        return [
          {
            id: 'lm',
            title: t('workspace.standards_cosmetic_1_title'),
            desc: t('workspace.standards_cosmetic_1_desc'),
          },
          {
            id: 'cos',
            title: t('workspace.standards_cosmetic_2_title'),
            desc: t('workspace.standards_cosmetic_2_desc'),
          },
          {
            id: 'cdsco',
            title: t('workspace.standards_cosmetic_3_title'),
            desc: t('workspace.standards_cosmetic_3_desc'),
          },
        ];
      case 'SEED_AGRICULTURE':
        return [
          {
            id: 'lm',
            title: t('workspace.standards_seed_1_title'),
            desc: t('workspace.standards_seed_1_desc'),
          },
          {
            id: 'seed',
            title: t('workspace.standards_seed_2_title'),
            desc: t('workspace.standards_seed_2_desc'),
          },
          {
            id: 'csc',
            title: t('workspace.standards_seed_3_title'),
            desc: t('workspace.standards_seed_3_desc'),
          },
        ];
      case 'FERTILIZER_CHEMICAL':
        return [
          {
            id: 'lm',
            title: t('workspace.standards_fertilizer_1_title'),
            desc: t('workspace.standards_fertilizer_1_desc'),
          },
          {
            id: 'fco',
            title: t('workspace.standards_fertilizer_2_title'),
            desc: t('workspace.standards_fertilizer_2_desc'),
          },
          {
            id: 'bis',
            title: t('workspace.standards_fertilizer_3_title'),
            desc: t('workspace.standards_fertilizer_3_desc'),
          },
        ];
      case 'PESTICIDE_CROP_PROTECTION':
        return [
          {
            id: 'lm',
            title: t('workspace.standards_pesticide_1_title'),
            desc: t('workspace.standards_pesticide_1_desc'),
          },
          {
            id: 'cib',
            title: t('workspace.standards_pesticide_2_title'),
            desc: t('workspace.standards_pesticide_2_desc'),
          },
          {
            id: 'poison',
            title: t('workspace.standards_pesticide_3_title'),
            desc: t('workspace.standards_pesticide_3_desc'),
          },
        ];
      case 'FOOD_BEVERAGE':
        return [
          {
            id: 'lm',
            title: t('workspace.standards_food_1_title'),
            desc: t('workspace.standards_food_1_desc'),
          },
          {
            id: 'fssai',
            title: t('workspace.standards_food_2_title'),
            desc: t('workspace.standards_food_2_desc'),
          },
          {
            id: 'veg',
            title: t('workspace.standards_food_3_title'),
            desc: t('workspace.standards_food_3_desc'),
          },
        ];
      default:
        return [
          {
            id: 'lm',
            title: t('workspace.standards_general_1_title'),
            desc: t('workspace.standards_general_1_desc'),
          },
          {
            id: 'coo',
            title: t('workspace.standards_general_2_title'),
            desc: t('workspace.standards_general_2_desc'),
          },
          {
            id: 'usp',
            title: t('workspace.standards_general_3_title'),
            desc: t('workspace.standards_general_3_desc'),
          },
        ];
    }
  };

  // Dynamic dropzone title and subtitle based on active category
  const getDropzoneLabels = (cat: ProductCategory) => {
    switch (cat) {
      case 'PERSONAL_CARE_COSMETIC':
        return {
          title: t('workspace.dropLabelTitle_cosmetic'),
          subtitle: t('workspace.dropLabelSubtitle_cosmetic'),
        };
      case 'SEED_AGRICULTURE':
        return {
          title: t('workspace.dropLabelTitle_seed'),
          subtitle: t('workspace.dropLabelSubtitle_seed'),
        };
      case 'FERTILIZER_CHEMICAL':
        return {
          title: t('workspace.dropLabelTitle_fertilizer'),
          subtitle: t('workspace.dropLabelSubtitle_fertilizer'),
        };
      case 'PESTICIDE_CROP_PROTECTION':
        return {
          title: t('workspace.dropLabelTitle_pesticide'),
          subtitle: t('workspace.dropLabelSubtitle_pesticide'),
        };
      case 'FOOD_BEVERAGE':
        return {
          title: t('workspace.dropLabelTitle_food'),
          subtitle: t('workspace.dropLabelSubtitle_food'),
        };
      default:
        return {
          title: t('workspace.dropLabelTitle_general'),
          subtitle: t('workspace.dropLabelSubtitle_general'),
        };
    }
  };

  const normalizedCategory = normalizeCategory(currentInspection.category);
  const rawCategoryPresets = getCategoryPresets(normalizedCategory);
  const categoryPresets = [...rawCategoryPresets].sort((a, b) => {
    if (a.id === currentInspection.id) return -1;
    if (b.id === currentInspection.id) return 1;
    return 0;
  });
  const categoryStandards = getCategoryStandards(normalizedCategory);
  const dropzoneLabels = getDropzoneLabels(normalizedCategory);

  // ── Evidence modal helper ──────────────────────────────────────────────────
  const openEvidenceModal = (sourceImageIndex: number, sourceImageView: string, fieldLabel: string, fieldValue: string) => {
    // Find the image in results or pending slots
    const resultImg = currentInspection.images?.[sourceImageIndex];
    const previewUrl =
      resultImg?.previewUrl ||
      pendingImages[sourceImageIndex]?.previewUrl ||
      '';

    if (!previewUrl) return;

    setEvidenceModal({
      imageIndex: sourceImageIndex,
      imageId: resultImg?.id || `img-${sourceImageIndex}`,
      viewLabel: sourceImageView || viewLabel(resultImg?.side),
      previewUrl,
      fieldLabel,
      fieldValue,
    });
  };

  // ── Drag & Drop handlers ───────────────────────────────────────────────────
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    handleAddFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // ── Derived: imageCount for multi-image badge ─────────────────────────────
  const resultImageCount = currentInspection.images?.length ?? 0;
  const isMultiImageResult = resultImageCount > 1;

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 md:px-10 py-6 md:py-8 transition-colors">
      {/* Hero Header Section */}
      <section className="mb-6 md:mb-8 border-b border-[#E7E3DC] pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#EBF3EE] border border-[#C7DECF] rounded-lg mb-2.5">
          <span className="w-2 h-2 rounded-full bg-[#52796F] animate-pulse"></span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#335E46]">
            {t('workspace.badgeEngine')}
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl lg:text-[32px] font-bold text-[#2D322E] tracking-tight leading-tight">
          {t('workspace.heroTitle')}
        </h1>
        <p className="mt-2 text-xs md:text-sm text-[#535953] max-w-4xl leading-relaxed">
          {t('workspace.heroSubtitle')}
        </p>
      </section>

      {/* Main Operational Workbench: 5 Cols Left + 7 Cols Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
        {/* LEFT PANEL: Multi-Image Upload & Field Camera Capture (5 Cols) */}
        <section className="lg:col-span-5 flex flex-col gap-5">
          <div className="bg-white border border-[#E7E3DC] rounded-2xl p-5 md:p-6 shadow-xs">
            {/* Mode Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#F6F4EE] rounded-xl border border-[#E7E3DC] mb-4">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('upload');
                  if (streamRef.current) {
                    streamRef.current.getTracks().forEach((t) => t.stop());
                  }
                  setCameraActive(false);
                  setCameraCaptures([]);
                }}
                className={`h-10 text-center text-xs md:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-white text-[#335E46] shadow-xs border border-[#E7E3DC]'
                    : 'text-[#535953] hover:text-[#2D322E]'
                }`}
              >
                <UploadCloud className="w-4 h-4 text-[#52796F]" />
                <span>{t('workspace.tabUpload')}</span>
              </button>

              <button
                type="button"
                onClick={handleStartCamera}
                className={`h-10 text-center text-xs md:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'camera'
                    ? 'bg-white text-[#335E46] shadow-xs border border-[#E7E3DC]'
                    : 'text-[#535953] hover:text-[#2D322E]'
                }`}
              >
                <Camera className="w-4 h-4 text-[#52796F]" />
                <span>{t('workspace.tabCamera')}</span>
              </button>
            </div>

            {/* ── CAMERA TAB: Multi-Capture Mode ── */}
            {activeTab === 'camera' ? (
              <div className="flex flex-col gap-3">
                {/* Viewfinder */}
                <div className="border border-[#DFDBD3] rounded-xl overflow-hidden bg-black relative flex flex-col items-center justify-center min-h-[220px]">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-auto max-h-[240px] object-cover" />
                  {cameraActive && (
                    <div className="absolute top-2 left-2 bg-black/60 text-white font-mono text-[10px] px-2 py-0.5 rounded-full">
                      LIVE • {pendingImages.length + cameraCaptures.length}/{MAX_IMAGES}
                    </div>
                  )}
                </div>

                {/* Captured Thumbnails Row */}
                {cameraCaptures.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {cameraCaptures.map((cap, idx) => (
                      <div key={cap.id} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-[#E7E3DC] bg-[#FAF8F5]">
                        <img src={cap.previewUrl} alt={`Capture ${idx + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                        <span className="absolute top-0.5 left-0.5 bg-[#335E46] text-white text-[9px] font-bold px-1 rounded">
                          {pendingImages.length + idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCameraCapture(cap.id)}
                          className="absolute top-0.5 right-0.5 w-4 h-4 bg-[#9E432A] text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Camera Action Buttons */}
                <div className="flex gap-2">
                  {cameraActive && (pendingImages.length + cameraCaptures.length) < MAX_IMAGES && (
                    <button
                      type="button"
                      onClick={handleCaptureCamera}
                      className="flex-1 h-11 bg-[#52796F] hover:bg-[#45665E] text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>
                        Capture {pendingImages.length + cameraCaptures.length + 1}/{MAX_IMAGES}
                      </span>
                    </button>
                  )}
                  {cameraCaptures.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSubmitCameraCaptures}
                      className="flex-1 h-11 bg-[#335E46] hover:bg-[#2B4D3A] text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Bolt className="w-4 h-4" />
                      <span>Analyze {cameraCaptures.length} View{cameraCaptures.length > 1 ? 's' : ''}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleStopCamera}
                    className="h-11 px-4 bg-white/90 border border-[#E7E3DC] text-[#2D322E] text-xs font-semibold rounded-xl shadow-md cursor-pointer"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            ) : (
              /* ── UPLOAD TAB: Multi-Image Slot Panel ── */
              <div className="flex flex-col gap-4">

                {/* Max-Image Alert Banner */}
                {maxImageAlert && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-[#FBF3E8] border border-[#EED9C4] rounded-xl text-[#8C5E2D] text-xs font-semibold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{t('workspace.maxImagesAlert')}</span>
                  </div>
                )}

                {/* Multi-Upload Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#2D322E]">{t('workspace.uploadMultiTitle')}</p>
                    <p className="text-[11px] text-[#7A827B] mt-0.5 leading-relaxed max-w-xs">
                      {t('workspace.uploadMultiSubtitle')}
                    </p>
                  </div>
                  <span className="font-mono text-[11px] bg-[#EBF3EE] text-[#335E46] border border-[#C7DECF] px-2 py-0.5 rounded font-bold">
                    {pendingImages.length}/{MAX_IMAGES}
                  </span>
                </div>

                {/* 4-Slot Image Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  {Array.from({ length: MAX_IMAGES }).map((_, slotIdx) => {
                    const img = pendingImages[slotIdx];
                    return (
                      <div key={slotIdx} className="relative">
                        {img ? (
                          /* Occupied Slot */
                          <div className="relative rounded-xl border border-[#C7DECF] bg-[#F5F8F6] overflow-hidden group aspect-square">
                            <img
                              src={img.previewUrl}
                              alt={`Image ${slotIdx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {/* Slot overlay info */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
                            {/* Image number badge */}
                            <span className="absolute top-1.5 left-1.5 bg-[#335E46] text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded">
                              IMG {slotIdx + 1}
                            </span>
                            {/* Scan result view label if available */}
                            {currentInspection.images?.[slotIdx]?.detectedView && (
                              <span className="absolute top-1.5 right-7 bg-black/50 text-white text-[9px] px-1 py-0.5 rounded font-mono">
                                {viewLabel(currentInspection.images[slotIdx].detectedView)}
                              </span>
                            )}
                            {/* OCR status */}
                            {currentInspection.images?.[slotIdx]?.ocrStatus && (
                              <span className={`absolute bottom-6 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                                currentInspection.images[slotIdx].ocrStatus === 'READY'
                                  ? 'bg-[#335E46] text-white'
                                  : currentInspection.images[slotIdx].ocrStatus === 'ERROR'
                                  ? 'bg-[#9E432A] text-white'
                                  : 'bg-[#8C5E2D] text-white'
                              }`}>
                                {currentInspection.images[slotIdx].ocrStatus === 'READY'
                                  ? t('workspace.ocrReady')
                                  : t('workspace.ocrPending')}
                              </span>
                            )}
                            {/* Quality status */}
                            {currentInspection.images?.[slotIdx]?.qualityStatus && (
                              <span className={`absolute bottom-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                                currentInspection.images[slotIdx].qualityStatus === 'GOOD'
                                  ? 'bg-[#EBF3EE] text-[#335E46]'
                                  : currentInspection.images[slotIdx].qualityStatus === 'FAIR'
                                  ? 'bg-[#FBF3E8] text-[#8C5E2D]'
                                  : 'bg-[#FAECE7] text-[#9E432A]'
                              }`}>
                                {currentInspection.images[slotIdx].qualityStatus === 'GOOD'
                                  ? t('workspace.qualityGood')
                                  : currentInspection.images[slotIdx].qualityStatus === 'FAIR'
                                  ? t('workspace.qualityFair')
                                  : t('workspace.qualityLow')}
                              </span>
                            )}
                            {/* Action buttons (visible on hover) */}
                            <div className="absolute top-1.5 right-1.5 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {/* Remove */}
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(slotIdx)}
                                title={t('workspace.removeImage')}
                                className="w-6 h-6 bg-[#9E432A] text-white rounded-full flex items-center justify-center shadow-md hover:bg-[#853620] cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                              {/* Replace */}
                              <button
                                type="button"
                                onClick={() => replaceFileInputRefs.current[slotIdx]?.click()}
                                title={t('workspace.replaceImage')}
                                className="w-6 h-6 bg-[#52796F] text-white rounded-full flex items-center justify-center shadow-md hover:bg-[#45665E] cursor-pointer"
                              >
                                <RotateCcw className="w-3 h-3" />
                              </button>
                            </div>
                            {/* Hidden replace input */}
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              className="hidden"
                              ref={(el) => { replaceFileInputRefs.current[slotIdx] = el; }}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) await handleReplaceImage(slotIdx, file);
                                e.target.value = '';
                              }}
                            />
                          </div>
                        ) : (
                          /* Empty Slot */
                          <div
                            onClick={() => addFileInputRef.current?.click()}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            className="aspect-square rounded-xl border-2 border-dashed border-[#DFDBD3] bg-[#FAF8F5] hover:bg-[#F6F4EE] hover:border-[#52796F] transition-all flex flex-col items-center justify-center cursor-pointer group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-white border border-[#E7E3DC] flex items-center justify-center group-hover:scale-105 transition-transform mb-1.5">
                              <ImagePlus className="w-4 h-4 text-[#52796F]" />
                            </div>
                            <p className="text-[10px] font-semibold text-[#535953] text-center px-1">
                              View {slotIdx + 1}
                            </p>
                            <p className="text-[9px] text-[#7A827B] text-center px-1 mt-0.5">
                              {t('workspace.slotDropHint')}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Hidden "Add New" file input (multiple) */}
                <input
                  ref={addFileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    handleAddFiles(e.target.files);
                    e.target.value = '';
                  }}
                />

                {/* Scan Progress Panel (shown while processing) */}
                {isProcessing && scanSteps.length > 0 && (
                  <div className="rounded-xl border border-[#C7DECF] bg-[#F5F8F6] p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <RefreshCw className="w-4 h-4 text-[#52796F] animate-spin" />
                      <span className="text-xs font-bold text-[#335E46] uppercase tracking-wider">
                        Analyzing Product — {pendingImages.length || lastSubmittedImagesRef.current?.length || 1} Image{(pendingImages.length || 1) > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {scanSteps.map((step) => (
                        <div key={step.id} className="flex items-center gap-2">
                          {step.done ? (
                            <CheckCircle className="w-3.5 h-3.5 text-[#335E46] shrink-0" />
                          ) : step.active ? (
                            <RefreshCw className="w-3.5 h-3.5 text-[#52796F] animate-spin shrink-0" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-[#DFDBD3] shrink-0" />
                          )}
                          <span className={`text-[11px] font-mono ${
                            step.done
                              ? 'text-[#335E46] line-through'
                              : step.active
                              ? 'text-[#2D322E] font-semibold'
                              : 'text-[#7A827B]'
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Primary Action Buttons */}
                <div className="flex flex-col gap-2.5">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => {
                      if (pendingImages.length === 0) {
                        addFileInputRef.current?.click();
                      } else {
                        handleProcessMultiImage();
                      }
                    }}
                    className="w-full h-12 bg-[#52796F] hover:bg-[#45665E] active:bg-[#36514B] disabled:opacity-60 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>{t('common.analyzing')}</span>
                      </>
                    ) : pendingImages.length === 0 ? (
                      <>
                        <Bolt className="w-4 h-4" />
                        <span>{t('workspace.startScan')}</span>
                      </>
                    ) : (
                      <>
                        <Bolt className="w-4 h-4" />
                        <span>
                          {t('workspace.analyzeMultiBtn')} ({pendingImages.length} Image{pendingImages.length > 1 ? 's' : ''})
                        </span>
                      </>
                    )}
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleStartCamera}
                      className="flex-1 h-12 bg-[#FAF8F5] border border-[#E7E3DC] hover:bg-[#F6F4EE] active:bg-[#EFECE5] text-[#2D322E] text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-[#52796F]" />
                      <span>{t('workspace.openCamera')}</span>
                    </button>

                    {pendingImages.length > 0 && pendingImages.length < MAX_IMAGES && (
                      <button
                        type="button"
                        onClick={() => addFileInputRef.current?.click()}
                        className="h-12 px-4 bg-[#FAF8F5] border border-[#E7E3DC] hover:bg-[#F6F4EE] text-[#52796F] text-sm font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="text-xs">{t('workspace.addView')}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Dropzone hint (shown when no images added yet) */}
                {pendingImages.length === 0 && !isProcessing && (
                  <div
                    onClick={() => addFileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="border-2 border-dashed border-[#DFDBD3] rounded-xl p-4 text-center bg-[#FAF8F5] hover:bg-[#F6F4EE] transition-all flex flex-col items-center justify-center cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#E7E3DC] flex items-center justify-center text-[#52796F] group-hover:scale-105 transition-transform mb-2.5 shadow-xs">
                      <ScanLine className="w-5 h-5 text-[#52796F]" />
                    </div>
                    <p className="text-sm font-semibold text-[#2D322E]">{dropzoneLabels.title}</p>
                    <p className="text-xs text-[#7A827B] mt-1 max-w-xs">{dropzoneLabels.subtitle}</p>
                    <div className="mt-3 inline-flex items-center gap-1.5 font-mono text-[11px] bg-white px-3 py-1 rounded border border-[#E7E3DC] text-[#535953] shadow-xs">
                      <Maximize2 className="w-3.5 h-3.5 text-[#52796F]" />
                      {t('workspace.dpiHint')}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Dynamic Preset Quick-Test Sample Chips */}
            <div className="mt-6 pt-5 border-t border-[#E7E3DC]">
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#7A827B]">
                  {t('workspace.presetTitle')}
                </label>
                {normalizedCategory !== 'UNKNOWN' && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#EBF3EE] text-[#335E46] border border-[#C7DECF] rounded shadow-2xs">
                    {t('categories.' + normalizedCategory)}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {categoryPresets.map((preset) => {
                  const IconComp = preset.icon;
                  const isSelected = currentInspection.id === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => onLoadPreset(preset.id)}
                      className={`h-9 px-3 bg-[#FAF8F5] hover:bg-[#F2F0E8] border rounded-lg text-left font-mono text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                        isSelected
                          ? 'border-[#52796F] text-[#335E46] font-bold bg-[#EBF3EE] ring-1 ring-[#52796F]'
                          : 'border-[#E7E3DC] text-[#2D322E]'
                      }`}
                    >
                      <IconComp className="w-3.5 h-3.5 text-[#52796F]" />
                      <span>{preset.label}</span>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#52796F] ml-1 animate-pulse"></span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Enforce Statutory Standards Checkboxes */}
            <div className="mt-6 pt-5 border-t border-[#E7E3DC]">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7A827B] mb-2.5">
                {t('workspace.enforceStandardsTitle')}
              </label>
              <div className="space-y-2">
                {categoryStandards.map((std) => (
                  <label
                    key={std.id}
                    className="flex items-start gap-3 p-2 rounded-xl hover:bg-[#FAF8F5] transition-colors cursor-pointer border border-transparent hover:border-[#E7E3DC]"
                  >
                    <input
                      type="checkbox"
                      defaultChecked
                      className="mt-0.5 w-4 h-4 rounded text-[#52796F] focus:ring-[#52796F] border-[#DFDBD3]"
                    />
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-semibold text-[#2D322E]">
                        {std.title}
                      </span>
                      <span className="text-[11px] text-[#7A827B]">
                        {std.desc}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT PANEL: Live Statutory Audit Manifest (7 Cols) */}
        <section className="lg:col-span-7 flex flex-col gap-5">
          <div className="bg-white border border-[#E7E3DC] rounded-2xl overflow-hidden shadow-xs">
            {/* Manifest Header */}
            <div className="p-5 md:p-6 bg-[#FAF8F5] border-b border-[#E7E3DC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-[#335E46] uppercase tracking-wider">
                    {t('workspace.manifestHeaderTitle')}
                  </span>

                  {/* Multi-image scan badge */}
                  {isMultiImageResult && (
                    <span className="px-2 py-0.5 bg-[#335E46] text-white font-mono text-[10px] rounded font-bold flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      {resultImageCount}-IMAGE SCAN
                    </span>
                  )}

                  {currentInspection.summaryCounts.violations > 0 ? (
                    <span className="px-2 py-0.5 bg-[#FAECE7] text-[#9E432A] font-mono text-[11px] rounded font-semibold border border-[#F7D0C4]">
                      {currentInspection.summaryCounts.violations} {t('common.violation')}{currentInspection.summaryCounts.violations > 1 ? 'S' : ''}
                    </span>
                  ) : currentInspection.summaryCounts.warnings > 0 ? (
                    <span className="px-2 py-0.5 bg-[#FBF3E8] text-[#8C5E2D] font-mono text-[11px] rounded font-semibold border border-[#EED9C4]">
                      {currentInspection.summaryCounts.warnings} {t('common.warning')}{currentInspection.summaryCounts.warnings > 1 ? 'S' : ''}
                    </span>
                  ) : currentInspection.summaryCounts.insufficientEvidence > 0 ? (
                    <span className="px-2 py-0.5 bg-[#F6F4EE] text-[#535953] font-mono text-[11px] rounded font-semibold border border-[#E7E3DC]">
                      {currentInspection.summaryCounts.insufficientEvidence} {t('common.insufficientEvidence')}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-[#EBF3EE] text-[#335E46] font-mono text-[11px] rounded font-semibold border border-[#C7DECF]">
                      {t('common.verified')}
                    </span>
                  )}
                </div>
                <h2 className="text-lg md:text-xl font-bold text-[#2D322E] mt-1.5">
                  {currentInspection.productName}
                </h2>
              </div>

              <div className="text-left sm:text-right flex flex-col items-start sm:items-end gap-1.5">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-[#7A827B]">
                    {t('workspace.scanId')}
                  </span>
                  <span className="font-mono text-xs md:text-sm font-semibold text-[#2D322E]">
                    {currentInspection.scanId || currentInspection.batchReference}
                  </span>
                </div>
                {/* SHA-256 Tamper-Evident Evidence Seal */}
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white border border-[#C7DECF] rounded text-[10px] font-mono text-[#335E46] shadow-2xs">
                  <ShieldCheck className="w-3 h-3 text-[#52796F]" />
                  <span className="font-bold">
                    SEAL: {evidenceHash ? `${evidenceHash.slice(0, 8)}...${evidenceHash.slice(-6)}` : 'HASHING...'}
                  </span>
                  {evidenceHash && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(evidenceHash);
                        setCopiedHash(true);
                        setTimeout(() => setCopiedHash(false), 2000);
                      }}
                      className="ml-0.5 text-[#52796F] hover:text-[#335E46] cursor-pointer"
                      title={`Full SHA-256 Evidence Digest: ${evidenceHash}\nClick to copy for statutory evidence dossier`}
                    >
                      {copiedHash ? <Check className="w-3 h-3 text-[#335E46]" /> : <Copy className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ── ROADMAP: MRP OVERCHARGE STATUTORY CONTRAVENTION BANNER ── */}
            {(() => {
              const scannedMrpValue =
                currentInspection.extractedFields?.mrpValue !== undefined
                  ? currentInspection.extractedFields.mrpValue
                  : currentInspection.extractedFields?.mrp
                  ? parseFloat(currentInspection.extractedFields.mrp.replace(/[^0-9.]/g, ''))
                  : undefined;
              const actualPriceVal = currentInspection.extractedFields?.actualSellingPrice;
              const isOvercharging =
                actualPriceVal !== undefined &&
                scannedMrpValue !== undefined &&
                actualPriceVal > scannedMrpValue;
              const overchargeDiff = isOvercharging ? Number((actualPriceVal - scannedMrpValue).toFixed(2)) : 0;
              const overchargePct =
                isOvercharging && scannedMrpValue
                  ? Number(((overchargeDiff / scannedMrpValue) * 100).toFixed(1))
                  : 0;

              if (!isOvercharging) return null;

              return (
                <div className="px-5 py-3.5 bg-[#FAECE7] border-b border-[#F7D0C4] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#9E432A]/10 border border-[#F7D0C4] flex items-center justify-center shrink-0 mt-0.5">
                      <AlertOctagon className="w-5 h-5 text-[#9E432A] animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-[#9E432A] uppercase tracking-wider">
                          🚨 POTENTIAL MRP OVERCHARGE DETECTED
                        </span>
                        <span className="px-2 py-0.5 bg-[#9E432A] text-white font-mono text-[10px] font-bold rounded">
                          CONTRAVENTION: LM ACT SEC 36(1)
                        </span>
                      </div>
                      <p className="text-xs text-[#9E432A]/90 mt-1 leading-relaxed">
                        Declared Package MRP: <strong className="font-semibold">₹{scannedMrpValue?.toFixed(2)}</strong> | Charged Retail Price: <strong className="font-semibold">₹{actualPriceVal?.toFixed(2)}</strong>
                        <br />
                        Consumer Overcharge: <strong className="font-bold text-[#9E432A]">+₹{overchargeDiff.toFixed(2)} (+{overchargePct}%)</strong>. In direct violation of Rule 18(2) of LM(PC) Rules 2011.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNoticeModal(true)}
                    className="shrink-0 h-9 px-3.5 bg-[#9E432A] hover:bg-[#853620] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Gavel className="w-3.5 h-3.5" />
                    <span>Issue Seizure Memo</span>
                  </button>
                </div>
              );
            })()}

            {/* ── MULTI-IMAGE THUMBNAILS STRIP (Shown for multi-image results) ── */}
            {isMultiImageResult && (
              <div className="px-5 py-3 bg-[#F5F8F6] border-b border-[#E7E3DC]">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Layers className="w-3.5 h-3.5 text-[#52796F]" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#535953]">
                    {t('workspace.imagesAnalyzedTitle')}: {resultImageCount}
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {currentInspection.images.map((img, idx) => (
                    <div
                      key={img.id || idx}
                      className="relative rounded-lg overflow-hidden border border-[#E7E3DC] bg-white w-16 h-16 shrink-0 cursor-pointer hover:border-[#52796F] transition-colors group"
                      onClick={() => {
                        if (img.previewUrl) {
                          setEvidenceModal({
                            imageIndex: idx,
                            imageId: img.id,
                            viewLabel: viewLabel(img.detectedView || img.side),
                            previewUrl: img.previewUrl,
                            fieldLabel: `Image ${idx + 1}`,
                            fieldValue: img.detectedView || img.side || '',
                          });
                        }
                      }}
                    >
                      {img.previewUrl ? (
                        <img src={img.previewUrl} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#F6F4EE]">
                          <ScanLine className="w-5 h-5 text-[#7A827B]" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <span className="absolute bottom-0.5 left-0.5 right-0.5 text-center text-white font-mono text-[8px] font-bold truncate px-0.5">
                        Img {idx + 1} • {viewLabel(img.detectedView || img.side)}
                      </span>
                      {/* Quality dot */}
                      <span className={`absolute top-1 right-1 w-2 h-2 rounded-full border border-white ${
                        img.qualityStatus === 'GOOD'
                          ? 'bg-[#52796F]'
                          : img.qualityStatus === 'FAIR'
                          ? 'bg-[#8C5E2D]'
                          : img.qualityStatus === 'LOW_QUALITY'
                          ? 'bg-[#9E432A]'
                          : 'bg-[#7A827B]'
                      }`} />
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                        <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── COVERAGE WARNING BANNER ── */}
            {currentInspection.coverageWarning?.hasWarning && (
              <div className="px-5 py-3 bg-[#FBF3E8] border-b border-[#EED9C4]">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-[#8C5E2D] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-bold text-[#8C5E2D] uppercase tracking-wider">
                      {t('workspace.coverageWarningTitle')}
                    </p>
                    <p className="text-[11px] text-[#8C5E2D] mt-0.5 leading-relaxed">
                      {currentInspection.coverageWarning.message}
                    </p>
                    {currentInspection.coverageWarning.missingViews && currentInspection.coverageWarning.missingViews.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-1">
                        {currentInspection.coverageWarning.missingViews.map((v, i) => (
                          <span key={i} className="text-[10px] bg-white border border-[#EED9C4] text-[#8C5E2D] px-1.5 py-0.5 rounded font-mono">
                            Missing: {v}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── CROSS-IMAGE CONFLICT CARDS ── */}
            {currentInspection.fieldConflicts && currentInspection.fieldConflicts.length > 0 && (
              <div className="px-5 py-3 bg-[#FAECE7] border-b border-[#F7D0C4] space-y-3">
                <div className="flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-[#9E432A]" />
                  <span className="text-[11px] font-bold text-[#9E432A] uppercase tracking-wider">
                    {t('workspace.conflictTitle')} ({currentInspection.fieldConflicts.length})
                  </span>
                </div>
                <p className="text-[11px] text-[#9E432A]/80">{t('workspace.conflictSubtitle')}</p>
                {currentInspection.fieldConflicts.map((conflict, cIdx) => (
                  <div key={cIdx} className="bg-white border border-[#F7D0C4] rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[#9E432A]">{conflict.label}</span>
                      <span className="font-mono text-[10px] bg-[#FAECE7] text-[#9E432A] border border-[#F7D0C4] px-1.5 py-0.5 rounded font-bold">
                        REVIEW REQUIRED
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      {conflict.values.map((val, vIdx) => (
                        <div key={vIdx} className="flex items-center gap-2 text-[11px]">
                          <span className="font-mono bg-[#FAF8F5] border border-[#E7E3DC] text-[#535953] px-1.5 py-0.5 rounded shrink-0">
                            Img {val.imageIndex + 1} • {viewLabel(val.viewType)}
                          </span>
                          <span className="font-semibold text-[#2D322E] truncate">{val.value}</span>
                          {/* View Evidence button */}
                          {currentInspection.images?.[val.imageIndex]?.previewUrl && (
                            <button
                              type="button"
                              onClick={() => openEvidenceModal(val.imageIndex, viewLabel(val.viewType), conflict.label, val.value)}
                              className="shrink-0 text-[10px] text-[#52796F] font-semibold hover:underline flex items-center gap-0.5"
                            >
                              <Eye className="w-3 h-3" />
                              {t('workspace.viewEvidence')}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-[#9E432A]/70 mt-2 leading-relaxed">{conflict.description}</p>
                  </div>
                ))}
              </div>
            )}

            {/* PRODUCT IDENTIFICATION HEADER CARD */}
            <div className="p-4 bg-[#F5F8F6] border-b border-[#E7E3DC]">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 bg-[#335E46] text-white font-mono text-[11px] font-bold uppercase rounded">
                      {t('categories.' + currentInspection.category, currentInspection.category)}
                    </span>

                    {currentInspection.productIdentification?.subcategory && (
                      <span className="px-2 py-0.5 bg-white border border-[#C7DECF] text-[#335E46] font-mono text-[11px] font-semibold rounded">
                        {t('common.type')} {currentInspection.productIdentification.subcategory}
                      </span>
                    )}

                    {currentInspection.productIdentification?.confidence !== undefined && (
                      <span className="px-2 py-0.5 bg-[#EBF3EE] border border-[#C7DECF] text-[#335E46] font-mono text-[11px] font-bold rounded">
                        {t('common.confidence')} {Math.round(currentInspection.productIdentification.confidence * 100)}%
                      </span>
                    )}
                  </div>

                  {currentInspection.productIdentification?.evidence && currentInspection.productIdentification.evidence.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {currentInspection.productIdentification.evidence.map((ev, i) => (
                        <span key={i} className="text-[11px] bg-white text-[#535953] px-2 py-0.5 rounded border border-[#E7E3DC]">
                          ✓ {ev}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <span className="text-[10px] uppercase font-bold text-[#7A827B] block">{t('workspace.appliedFrameworksTitle')}</span>
                  <div className="mt-0.5 space-y-0.5">
                    {(currentInspection.productIdentification?.applicableFrameworks || ['Legal Metrology (Packaged Commodities) Rules 2011']).map((fw, i) => (
                      <span key={i} className="block text-[11px] font-mono font-semibold text-[#335E46]">
                        • {fw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* UNCERTAIN CATEGORY OR ANALYSIS ERROR STATUS BANNERS */}
            {currentInspection.status === 'UNCERTAIN_CATEGORY' && (
              <div className="p-5 bg-[#FAECE7] border-b border-[#F7D0C4] text-[#9E432A]">
                <div className="flex items-start gap-3">
                  <AlertOctagon className="w-6 h-6 text-[#9E432A] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm">{t('workspace.uncertainCategoryTitle')}</h4>
                    <p className="text-xs mt-1 leading-relaxed text-[#9E432A]/90">
                      {currentInspection.errorMessage || t('workspace.uncertainCategoryText')}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => addFileInputRef.current?.click()}
                        className="h-9 px-4 bg-[#9E432A] text-white text-xs font-semibold rounded-lg shadow-xs hover:bg-[#853620]"
                      >
                        {t('workspace.uploadClearerPhoto')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentInspection.status === 'ANALYSIS_ERROR' && (
              <div className="p-6 bg-[#FAECE7] border-b border-[#F7D0C4] text-[#9E432A]">
                <div className="flex items-start gap-3.5">
                  <AlertOctagon className="w-6 h-6 text-[#9E432A] shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-base">{t('workspace.errorCardTitle')}</h3>
                      <span className="font-mono text-xs bg-white px-2 py-0.5 rounded border border-[#F7D0C4] text-[#9E432A] font-semibold">
                        {t('common.analysisError')}
                      </span>
                    </div>
                    <p className="text-sm mt-1.5 leading-relaxed text-[#9E432A]/90">
                      {t('workspace.errorCardSubtitle')}
                    </p>
                    <div className="mt-2.5 p-3 bg-white/80 rounded-xl border border-[#F7D0C4] font-mono text-xs text-[#9E432A] space-y-1">
                      <div><strong className="font-semibold">{t('common.reason')}</strong> {currentInspection.errorMessage || 'Optical analysis service encountered an error.'}</div>
                      {currentInspection.scanId && <div><strong className="font-semibold">{t('common.scanId')}</strong> {currentInspection.scanId}</div>}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleRetryScan}
                        className="h-10 px-5 bg-[#9E432A] hover:bg-[#853620] active:bg-[#6E2A17] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>{t('workspace.retryScan')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => addFileInputRef.current?.click()}
                        className="h-10 px-5 bg-white border border-[#F7D0C4] hover:bg-[#FAF8F5] text-[#9E432A] text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <UploadCloud className="w-3.5 h-3.5 text-[#9E432A]" />
                        <span>{t('workspace.uploadAnotherImage')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Manifest Content */}
            <div className="p-5 md:p-6 space-y-5">
              {/* ── ROADMAP: RETAIL SELLING PRICE OVERCHARGE AUDITOR ── */}
              {(() => {
                const scannedMrpValue =
                  currentInspection.extractedFields?.mrpValue !== undefined
                    ? currentInspection.extractedFields.mrpValue
                    : currentInspection.extractedFields?.mrp
                    ? parseFloat(currentInspection.extractedFields.mrp.replace(/[^0-9.]/g, ''))
                    : undefined;
                const actualPriceVal = currentInspection.extractedFields?.actualSellingPrice;
                const isOvercharging =
                  actualPriceVal !== undefined &&
                  scannedMrpValue !== undefined &&
                  actualPriceVal > scannedMrpValue;
                const overchargeDiff = isOvercharging ? Number((actualPriceVal - scannedMrpValue).toFixed(2)) : 0;
                const overchargePct =
                  isOvercharging && scannedMrpValue
                    ? Number(((overchargeDiff / scannedMrpValue) * 100).toFixed(1))
                    : 0;

                return (
                  <div className="bg-[#FAF8F5] border border-[#E7E3DC] rounded-xl p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div>
                        <span className="text-[11px] font-bold text-[#535953] uppercase tracking-wider flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4 text-[#52796F]" />
                          Retail Selling Price &amp; Overcharging Audit
                        </span>
                        <p className="text-[11px] text-[#7A827B] mt-0.5">
                          Compare actual price charged at retail counter against statutory printed MRP (LM Act Sec 36)
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 self-start sm:self-auto">
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-white border border-[#E7E3DC] rounded text-[#535953]">
                          Printed MRP: <strong className="text-[#2D322E]">{scannedMrpValue !== undefined ? `₹${scannedMrpValue.toFixed(2)}` : 'N/A'}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      <div className="sm:col-span-6 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-mono font-bold text-[#7A827B]">
                          ₹
                        </div>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={sellingPriceInput}
                          onChange={(e) => handleUpdateSellingPrice(e.target.value)}
                          placeholder={scannedMrpValue ? `e.g. ${(scannedMrpValue * 1.2).toFixed(0)} to test overcharge` : 'Enter charged retail price'}
                          className="w-full h-10 pl-7 pr-3 bg-white border border-[#DFDBD3] rounded-lg text-xs font-mono font-semibold text-[#2D322E] focus:outline-none focus:ring-2 focus:ring-[#52796F] focus:border-[#52796F] transition-all"
                        />
                      </div>

                      <div className="sm:col-span-6 flex items-center gap-2 flex-wrap">
                        {scannedMrpValue !== undefined && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleUpdateSellingPrice(String(scannedMrpValue))}
                              className="h-8 px-2.5 bg-white hover:bg-[#F2F0E8] border border-[#E7E3DC] text-[11px] font-mono rounded text-[#535953] transition-colors cursor-pointer"
                            >
                              Exact MRP (₹{scannedMrpValue})
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateSellingPrice(String(Number((scannedMrpValue * 1.2).toFixed(2))))}
                              className="h-8 px-2.5 bg-[#FAECE7] hover:bg-[#F7D0C4] border border-[#F7D0C4] text-[11px] font-mono font-bold rounded text-[#9E432A] transition-colors cursor-pointer"
                              title="Simulate +20% overcharge retail transaction"
                            >
                              +20% Overcharge
                            </button>
                            {sellingPriceInput && (
                              <button
                                type="button"
                                onClick={() => handleUpdateSellingPrice('')}
                                className="h-8 px-2 bg-white hover:bg-[#F2F0E8] border border-[#E7E3DC] text-[11px] font-mono rounded text-[#7A827B] transition-colors cursor-pointer"
                              >
                                Clear
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Real-time Overcharge Status Pill */}
                    {actualPriceVal !== undefined && scannedMrpValue !== undefined && (
                      <div className="mt-3 pt-2.5 border-t border-[#E7E3DC] flex items-center justify-between text-xs flex-wrap gap-2">
                        {isOvercharging ? (
                          <div className="flex items-center gap-2 text-[#9E432A]">
                            <span className="w-2 h-2 rounded-full bg-[#9E432A] animate-ping" />
                            <span className="font-bold">
                              🚨 OVERCHARGE DETECTED: +₹{overchargeDiff.toFixed(2)} (+{overchargePct}% above printed MRP)
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-[#335E46]">
                            <CheckCircle className="w-4 h-4 text-[#335E46]" />
                            <span className="font-semibold">
                              ✓ Charged price within legal maximum retail ceiling (Rule 18 compliant)
                            </span>
                          </div>
                        )}
                        <span className="text-[10px] font-mono text-[#7A827B]">
                          Compounding fine ref: LM Act Sec 36(1)
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Scanned Mockup Visual with OCR Bounding Boxes */}
              <div className="bg-[#FAF8F5] border border-[#E7E3DC] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-[#535953] uppercase tracking-wider flex items-center gap-1.5">
                    <ScanLine className="w-4 h-4 text-[#52796F]" />
                    {t('workspace.opticalDetectionTitle')}
                  </span>
                  <span className="font-mono text-[11px] text-[#7A827B]">
                    {t('common.source')} {currentInspection.analysisSource === 'preset' ? t('common.presetSample') : t('common.livePayload')}
                  </span>
                </div>

                {/* Visual Label Canvas Container */}
                <div ref={canvasContainerRef} className="bg-white border border-[#E7E3DC] rounded-xl p-5 text-xs relative space-y-4">
                  {/* Precision Bounding Box & Multi-Image Annotation Viewer */}
                  {(() => {
                    const workspaceViewerImages =
                      currentInspection.images && currentInspection.images.length > 0 && currentInspection.images.some((img) => Boolean(img.previewUrl))
                        ? currentInspection.images.map((img, idx) => ({
                            id: img.id || `img-${idx}`,
                            previewUrl: img.previewUrl,
                            side: img.side || (idx === 0 ? 'FRONT' : 'OTHER'),
                            fileName: img.fileName,
                          }))
                        : [
                            {
                              id: 'img-main',
                              previewUrl: uploadedPreview || createPresetPackagingSvg(currentInspection),
                              side: 'FRONT',
                              fileName: currentInspection.productName || 'package_view.jpg',
                            },
                          ];

                    return (
                      <div className="mb-4">
                        <PrecisionAnnotationViewer
                          images={workspaceViewerImages}
                          boundingBoxes={currentInspection.boundingBoxes}
                          selectedBox={selectedTag}
                          onSelectBox={(box) => setSelectedTag(box)}
                          activeImageIndex={activeWorkspaceImageIndex}
                          onSelectImageIndex={(idx) => {
                            setActiveWorkspaceImageIndex(idx);
                            if (workspaceViewerImages[idx]?.previewUrl) {
                              setUploadedPreview(workspaceViewerImages[idx].previewUrl);
                            }
                          }}
                          language={language}
                        />
                      </div>
                    );
                  })()}

                  {/* Label Header Graphic Representation */}
                  <div className="flex justify-between border-b border-dashed border-[#E7E3DC] pb-3 mb-4">
                    <div>
                      <span className="font-mono text-sm md:text-base font-bold text-[#2D322E]">
                        {currentInspection.extractedFields.productName || currentInspection.productName}
                      </span>
                      <p className="text-xs text-[#7A827B] mt-0.5">
                        {t('common.brand')} {currentInspection.extractedFields.brandName || currentInspection.productIdentification?.brandName || 'Declared Brand'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="px-2.5 py-1 bg-[#F6F4EE] border border-[#E7E3DC] font-mono text-xs font-semibold text-[#2D322E] rounded">
                        {t('common.ref')} {currentInspection.extractedFields.lotNumber || currentInspection.extractedFields.batchNumber || currentInspection.batchReference}
                      </span>
                    </div>
                  </div>

                  {/* Bounding Box Cards Grid (Dynamic) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {currentInspection.boundingBoxes.length > 0 ? (
                      currentInspection.boundingBoxes.map((box, idx) => {
                        const isVerified = box.status === 'VERIFIED';
                        const isIssue = box.status === 'VIOLATION' || box.status === 'POTENTIAL_ISSUE';
                        const isSelected = selectedTag?.id === box.id;

                        return (
                          <div
                            key={box.id || idx}
                            onClick={() => setSelectedTag(box)}
                            className={`p-3 rounded-lg border border-dashed relative cursor-pointer transition-all ${
                              isSelected
                                ? 'ring-2 ring-[#52796F] bg-[#FAF8F5]'
                                : isVerified
                                ? 'border-[#C7DECF] bg-[#EBF3EE] hover:border-[#52796F]'
                                : isIssue
                                ? 'border-[#F7D0C4] bg-[#FAECE7] hover:border-[#9E432A]'
                                : 'border-[#EED9C4] bg-[#FBF3E8] hover:border-[#8C5E2D]'
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1.5">
                              <span
                                className={`font-mono text-[11px] font-semibold ${
                                  isVerified ? 'text-[#335E46]' : isIssue ? 'text-[#9E432A]' : 'text-[#8C5E2D]'
                                }`}
                              >
                                {box.displayLabel || getShortFieldLabel(box.field, box.label)}
                              </span>
                              <div className="flex items-center gap-1">
                                {/* Source image badge (multi-image scans) */}
                                {box.sourceImageIndex !== undefined && isMultiImageResult && (
                                  <span className="font-mono text-[9px] bg-white border border-[#E7E3DC] text-[#535953] px-1 py-0.5 rounded">
                                    Img {box.sourceImageIndex + 1}
                                  </span>
                                )}
                                <span
                                  className={`px-1.5 py-0.5 bg-white font-mono text-[10px] font-bold rounded border ${
                                    isVerified
                                      ? 'text-[#335E46] border-[#C7DECF]'
                                      : isIssue
                                      ? 'text-[#9E432A] border-[#F7D0C4]'
                                      : 'text-[#8C5E2D] border-[#EED9C4]'
                                  }`}
                                >
                                  {isVerified ? t('common.pass') : isIssue ? t('common.violation') : t('common.review')}
                                </span>
                              </div>
                            </div>
                            <p
                              className={`font-mono text-xs md:text-sm font-semibold ${
                                isIssue ? 'text-[#9E432A]' : 'text-[#2D322E]'
                              }`}
                            >
                              {box.value}
                            </p>
                            <p
                              className={`text-[11px] mt-0.5 ${
                                isVerified ? 'text-[#535953]' : isIssue ? 'text-[#9E432A]/90' : 'text-[#8C5E2D]'
                              }`}
                            >
                              {t('workspace.ocrConfidence')}: {box.confidence > 0 && box.confidence <= 1 ? Math.round(box.confidence * 100) : Math.round(box.confidence || 95)}% ({viewLabel(box.sourceSide)} Panel)
                            </p>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-span-2 p-4 text-center text-xs text-[#7A827B] bg-[#FAF8F5] border border-[#E7E3DC] rounded-lg">
                        {t('workspace.noBoundingBoxes')}
                      </div>
                    )}
                  </div>

                  {/* Physical Label Metadata Footer */}
                  <div className="mt-4 pt-3 border-t border-[#E7E3DC] flex flex-wrap justify-between text-[#7A827B] font-mono text-[11px]">
                    <span>{t('common.station')}: {currentInspection.stationNode}</span>
                    <span>{t('common.inspector')}: {currentInspection.inspectorName}</span>
                    <span>{t('common.date')}: {new Date(currentInspection.createdAt).toLocaleDateString(language === 'HI' ? 'hi-IN' : 'en-GB')}</span>
                  </div>
                </div>
              </div>

              {/* Detailed Rule Validation Checklist */}
              <div className="space-y-3">
                {currentInspection.findings.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#7A827B] bg-[#FAF8F5] border border-[#E7E3DC] rounded-xl">
                    {t('workspace.noFindings')}
                  </div>
                ) : (
                  currentInspection.findings.map((finding) => (
                    <div
                      key={finding.id}
                      className={`bg-white border rounded-xl p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3 transition-colors ${
                        finding.status === 'VERIFIED'
                          ? 'border-[#E7E3DC] hover:border-[#DFDBD3]'
                          : finding.status === 'VIOLATION' || finding.status === 'POTENTIAL_ISSUE'
                          ? 'border-[#E7E3DC] border-l-4 border-l-[#9E432A] hover:border-[#DFDBD3]'
                          : 'border-[#E7E3DC] border-l-4 border-l-[#8C5E2D] hover:border-[#DFDBD3]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {finding.status === 'VERIFIED' ? (
                          <CheckCircle className="w-5 h-5 text-[#335E46] shrink-0 mt-0.5" />
                        ) : finding.status === 'VIOLATION' || finding.status === 'POTENTIAL_ISSUE' ? (
                          <AlertOctagon className="w-5 h-5 text-[#9E432A] shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-[#8C5E2D] shrink-0 mt-0.5" />
                        )}

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                                finding.status === 'VERIFIED'
                                  ? 'text-[#335E46] bg-[#EBF3EE] border-[#C7DECF]'
                                  : finding.status === 'VIOLATION' || finding.status === 'POTENTIAL_ISSUE'
                                  ? 'text-[#9E432A] bg-[#FAECE7] border-[#F7D0C4]'
                                  : 'text-[#8C5E2D] bg-[#FBF3E8] border-[#EED9C4]'
                              }`}
                            >
                              {finding.sectionRef}
                            </span>
                            <span
                              className={`text-sm font-semibold ${
                                finding.status === 'VIOLATION' || finding.status === 'POTENTIAL_ISSUE' ? 'text-[#9E432A]' : 'text-[#2D322E]'
                              }`}
                            >
                              {finding.title}
                            </span>
                            {/* Conflict indicator */}
                            {finding.hasConflict && (
                              <span className="font-mono text-[10px] bg-[#FAECE7] text-[#9E432A] border border-[#F7D0C4] px-1.5 py-0.5 rounded">
                                ⚠ CONFLICT
                              </span>
                            )}
                            {/* PDP violation indicator */}
                            {finding.isPdpViolation && (
                              <span className="font-mono text-[10px] bg-[#FBF3E8] text-[#8C5E2D] border border-[#EED9C4] px-1.5 py-0.5 rounded">
                                PDP REQUIRED
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-[#535953] mt-1 leading-relaxed">
                            {finding.detectedText}. {finding.explanation}
                          </p>

                          {/* Source Image Tracking (multi-image scans) */}
                          {finding.sourceImageIndex !== undefined && isMultiImageResult && (
                            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono text-[10px] bg-[#EBF3EE] text-[#335E46] border border-[#C7DECF] px-1.5 py-0.5 rounded flex items-center gap-1">
                                <ScanLine className="w-3 h-3" />
                                Source: Image {finding.sourceImageIndex + 1}
                                {finding.sourceImageView ? ` — ${viewLabel(finding.sourceImageView)}` : ''}
                              </span>
                              {/* View Evidence button */}
                              {currentInspection.images?.[finding.sourceImageIndex]?.previewUrl && (
                                <button
                                  type="button"
                                  onClick={() => openEvidenceModal(
                                    finding.sourceImageIndex!,
                                    finding.sourceImageView || '',
                                    finding.title,
                                    finding.detectedText
                                  )}
                                  className="font-mono text-[10px] text-[#52796F] hover:text-[#335E46] font-semibold flex items-center gap-0.5 hover:underline"
                                >
                                  <Eye className="w-3 h-3" />
                                  {t('workspace.viewEvidence')}
                                </button>
                              )}
                            </div>
                          )}

                          {/* Conflict Details */}
                          {finding.conflictDetails && (
                            <p className="text-[10px] text-[#9E432A]/80 mt-1 leading-relaxed">{finding.conflictDetails}</p>
                          )}

                          {/* Statutory Rationale (Explainability: Why this rule applies) */}
                          {finding.statutoryRationale && (
                            <div className="mt-2.5 p-2.5 bg-[#FAF8F5] rounded-lg border border-[#E7E3DC] flex items-start gap-2 text-[11px] text-[#535953] leading-relaxed">
                              <Gavel className="w-3.5 h-3.5 text-[#52796F] shrink-0 mt-0.5" />
                              <div>
                                <strong className="font-semibold text-[#2D322E]">Statutory Rationale: </strong>
                                {finding.statutoryRationale}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-end gap-2 shrink-0">
                        <span
                          className={`px-2.5 py-1 font-mono text-[11px] font-bold rounded border ${
                            finding.status === 'VERIFIED'
                              ? 'bg-[#EBF3EE] border-[#C7DECF] text-[#335E46]'
                              : finding.status === 'VIOLATION' || finding.status === 'POTENTIAL_ISSUE'
                              ? 'bg-[#FAECE7] border-[#F7D0C4] text-[#9E432A]'
                              : 'bg-[#FBF3E8] border-[#EED9C4] text-[#8C5E2D]'
                          }`}
                        >
                          {t('common.' + (finding.status === 'VERIFIED' ? 'verified' : finding.status === 'VIOLATION' ? 'violation' : finding.status === 'WARNING' ? 'warning' : 'requiresReview'), finding.status)}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleLocateViolation(finding)}
                          className="h-8 px-2.5 bg-[#FAF8F5] hover:bg-[#F2F0E8] border border-[#E7E3DC] text-[#335E46] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                          title="Locate violation coordinates on packaging image"
                        >
                          <Crosshair className="w-3.5 h-3.5 text-[#52796F]" />
                          <span>Locate on Label</span>
                        </button>

                        {(finding.status === 'VIOLATION' || finding.status === 'POTENTIAL_ISSUE') && (
                          <button
                            type="button"
                            onClick={() => setShowNoticeModal(true)}
                            className="h-8 px-3 bg-[#FAF8F5] hover:bg-[#F2F0E8] border border-[#E7E3DC] text-[#2D322E] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                          >
                            <Gavel className="w-3.5 h-3.5 text-[#9E432A]" />
                            <span>{t('workspace.generateNotice')}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Manifest Footer Actions (48px+ Ergonomic Touch Targets) */}
            <div className="p-5 md:p-6 bg-[#FAF8F5] border-t border-[#E7E3DC] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="h-12 px-5 bg-[#52796F] hover:bg-[#45665E] active:bg-[#36514B] text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition-all shadow-xs"
                  title="Export official inspection summary as downloadable PDF document"
                >
                  {isExportingPDF ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-white" />
                      <span>{t('workspace.exportPdfDone')}</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>{t('workspace.exportPdf')}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowReportModal(true)}
                  className="h-12 px-4 bg-white border border-[#E7E3DC] hover:bg-[#F6F4EE] text-[#2D322E] text-sm font-semibold rounded-xl flex items-center gap-2 transition-all shadow-xs"
                >
                  <FileText className="w-4 h-4 text-[#52796F]" />
                  <span>{t('workspace.viewOfficialReport')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Statutory Guidelines Quick Reference Cards (Dynamic Category-based) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white border border-[#E7E3DC] rounded-xl shadow-xs">
              <span className="font-mono text-xs font-bold text-[#335E46] block">
                LM(PC) RULES 2011
              </span>
              <p className="text-xs text-[#535953] mt-1.5 leading-relaxed">
                Rule 6 declarations mandatory for all consumer packaging over 50g / 50ml.
              </p>
            </div>

            {currentInspection.category === 'PERSONAL_CARE_COSMETIC' ? (
              <>
                <div className="p-4 bg-white border border-[#E7E3DC] rounded-xl shadow-xs">
                  <span className="font-mono text-xs font-bold text-[#335E46] block">
                    COSMETICS RULES 2020
                  </span>
                  <p className="text-xs text-[#535953] mt-1.5 leading-relaxed">
                    Rule 34 requires mandatory INCI ingredient list &amp; CDSCO Mfg License.
                  </p>
                </div>

                <div className="p-4 bg-white border border-[#E7E3DC] rounded-xl shadow-xs">
                  <span className="font-mono text-xs font-bold text-[#335E46] block">
                    CDSCO REGULATION
                  </span>
                  <p className="text-xs text-[#535953] mt-1.5 leading-relaxed">
                    Personal care and sunscreen labeling must not make unauthorized drug claims.
                  </p>
                </div>
              </>
            ) : currentInspection.category === 'FOOD_BEVERAGE' ? (
              <>
                <div className="p-4 bg-white border border-[#E7E3DC] rounded-xl shadow-xs">
                  <span className="font-mono text-xs font-bold text-[#335E46] block">
                    FSSAI REGULATION 2020
                  </span>
                  <p className="text-xs text-[#535953] mt-1.5 leading-relaxed">
                    14-digit FSSAI license number and FSSAI logo mandatory on principal display panel.
                  </p>
                </div>

                <div className="p-4 bg-white border border-[#E7E3DC] rounded-xl shadow-xs">
                  <span className="font-mono text-xs font-bold text-[#335E46] block">
                    VEG / NON-VEG LOGO
                  </span>
                  <p className="text-xs text-[#535953] mt-1.5 leading-relaxed">
                    Green circle or brown triangle symbol mandatory on all packaged food.
                  </p>
                </div>
              </>
            ) : currentInspection.category === 'SEED_AGRICULTURE' ? (
              <>
                <div className="p-4 bg-white border border-[#E7E3DC] rounded-xl shadow-xs">
                  <span className="font-mono text-xs font-bold text-[#335E46] block">
                    SEEDS ACT 1966
                  </span>
                  <p className="text-xs text-[#535953] mt-1.5 leading-relaxed">
                    Section 6(a) prescribes strict minimum limits of germination and purity tags.
                  </p>
                </div>

                <div className="p-4 bg-white border border-[#E7E3DC] rounded-xl shadow-xs">
                  <span className="font-mono text-xs font-bold text-[#335E46] block">
                    SEEDS RULES 1968
                  </span>
                  <p className="text-xs text-[#535953] mt-1.5 leading-relaxed">
                    Rule 10 requires certified class tag and 9-month statutory test validity period.
                  </p>
                </div>
              </>
            ) : currentInspection.category === 'FERTILIZER_CHEMICAL' ? (
              <>
                <div className="p-4 bg-white border border-[#E7E3DC] rounded-xl shadow-xs">
                  <span className="font-mono text-xs font-bold text-[#335E46] block">
                    FCO ORDER 1985
                  </span>
                  <p className="text-xs text-[#535953] mt-1.5 leading-relaxed">
                    Clause 19 prohibits manufacture and sale of non-standard chemical fertilizers.
                  </p>
                </div>

                <div className="p-4 bg-white border border-[#E7E3DC] rounded-xl shadow-xs">
                  <span className="font-mono text-xs font-bold text-[#335E46] block">
                    BIS STANDARDS
                  </span>
                  <p className="text-xs text-[#535953] mt-1.5 leading-relaxed">
                    Bureau of Indian Standards ISI Mark IS:5406 mandatory on fertilizer bags.
                  </p>
                </div>
              </>
            ) : currentInspection.category === 'PESTICIDE_CROP_PROTECTION' ? (
              <>
                <div className="p-4 bg-white border border-[#E7E3DC] rounded-xl shadow-xs">
                  <span className="font-mono text-xs font-bold text-[#335E46] block">
                    INSECTICIDES ACT 1968
                  </span>
                  <p className="text-xs text-[#535953] mt-1.5 leading-relaxed">
                    Section 9 registration and CIB&amp;RC approval required for all bio/chemical pesticides.
                  </p>
                </div>

                <div className="p-4 bg-white border border-[#E7E3DC] rounded-xl shadow-xs">
                  <span className="font-mono text-xs font-bold text-[#335E46] block">
                    ANTIDOTE WARNING
                  </span>
                  <p className="text-xs text-[#535953] mt-1.5 leading-relaxed">
                    Rule 19 requires mandatory poison label and emergency antidote statement.
                  </p>
                </div>
              </>
            ) : currentInspection.category === 'ELECTRONICS' ? (
              <>
                <div className="p-4 bg-white border border-[#E7E3DC] rounded-xl shadow-xs">
                  <span className="font-mono text-xs font-bold text-[#335E46] block">
                    BIS CRO 2012
                  </span>
                  <p className="text-xs text-[#535953] mt-1.5 leading-relaxed">
                    Compulsory Registration Scheme requires R-XXXXXXXX registration mark and standard model details.
                  </p>
                </div>

                <div className="p-4 bg-white border border-[#E7E3DC] rounded-xl shadow-xs">
                  <span className="font-mono text-xs font-bold text-[#335E46] block">
                    BEE ENERGY LABEL
                  </span>
                  <p className="text-xs text-[#535953] mt-1.5 leading-relaxed">
                    BEE Star Rating label and power consumption figures mandatory for notified appliances.
                  </p>
                </div>
              </>
            ) : currentInspection.category === 'TOYS_CHILDREN' ? (
              <>
                <div className="p-4 bg-white border border-[#E7E3DC] rounded-xl shadow-xs">
                  <span className="font-mono text-xs font-bold text-[#335E46] block">
                    TOYS QCO 2020
                  </span>
                  <p className="text-xs text-[#535953] mt-1.5 leading-relaxed">
                    Mandatory Bureau of Indian Standards ISI safety mark (IS 9873) on packaging.
                  </p>
                </div>

                <div className="p-4 bg-white border border-[#E7E3DC] rounded-xl shadow-xs">
                  <span className="font-mono text-xs font-bold text-[#335E46] block">
                    SAFETY WARNINGS
                  </span>
                  <p className="text-xs text-[#535953] mt-1.5 leading-relaxed">
                    Age classification and small parts choking hazard warning pictogram mandatory.
                  </p>
                </div>
              </>
            ) : currentInspection.category === 'APPAREL_TEXTILE' ? (
              <>
                <div className="p-4 bg-white border border-[#E7E3DC] rounded-xl shadow-xs">
                  <span className="font-mono text-xs font-bold text-[#335E46] block">
                    TEXTILE ORDER
                  </span>
                  <p className="text-xs text-[#535953] mt-1.5 leading-relaxed">
                    Mandatory percentage declaration of fibre composition (e.g. 100% Cotton).
                  </p>
                </div>

                <div className="p-4 bg-white border border-[#E7E3DC] rounded-xl shadow-xs">
                  <span className="font-mono text-xs font-bold text-[#335E46] block">
                    STANDARD SIZING
                  </span>
                  <p className="text-xs text-[#535953] mt-1.5 leading-relaxed">
                    International standard garment size (S, M, L, XL) or chest/waist dimensions in cm.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="p-4 bg-white border border-[#E7E3DC] rounded-xl shadow-xs">
                  <span className="font-mono text-xs font-bold text-[#335E46] block">
                    UNIT SALE PRICE (USP)
                  </span>
                  <p className="text-xs text-[#535953] mt-1.5 leading-relaxed">
                    Rule 6(2) mandates declaration of Unit Sale Price (₹/unit or ₹/kg) for multi-unit packs.
                  </p>
                </div>

                <div className="p-4 bg-white border border-[#E7E3DC] rounded-xl shadow-xs">
                  <span className="font-mono text-xs font-bold text-[#335E46] block">
                    RULE 6(1)(n) GRIEVANCE
                  </span>
                  <p className="text-xs text-[#535953] mt-1.5 leading-relaxed">
                    Name, address, telephone helpline, and email of grievance officer mandatory on every package.
                  </p>
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      {/* ── EVIDENCE IMAGE MODAL ── */}
      {evidenceModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setEvidenceModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#E7E3DC] bg-[#FAF8F5]">
              <div>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#52796F]" />
                  <span className="font-bold text-sm text-[#2D322E]">{t('workspace.viewEvidence')}</span>
                  <span className="font-mono text-[10px] bg-[#EBF3EE] text-[#335E46] border border-[#C7DECF] px-1.5 py-0.5 rounded">
                    Image {evidenceModal.imageIndex + 1} — {evidenceModal.viewLabel}
                  </span>
                </div>
                <p className="text-[11px] text-[#7A827B] mt-0.5">
                  Field: <strong>{evidenceModal.fieldLabel}</strong>
                  {evidenceModal.fieldValue ? ` — ${evidenceModal.fieldValue}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEvidenceModal(null)}
                className="w-8 h-8 rounded-lg bg-[#F6F4EE] hover:bg-[#EFECE5] flex items-center justify-center text-[#535953] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Evidence Image */}
            <div className="p-4 bg-black/5 flex items-center justify-center min-h-[200px] max-h-[420px] overflow-hidden">
              <img
                src={evidenceModal.previewUrl}
                alt={`Evidence — ${evidenceModal.fieldLabel}`}
                className="max-w-full max-h-[380px] object-contain rounded-xl shadow-md"
              />
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-[#FAF8F5] border-t border-[#E7E3DC] flex items-center justify-between">
              <span className="font-mono text-[11px] text-[#7A827B]">
                Source: Image {evidenceModal.imageIndex + 1} • {evidenceModal.viewLabel}
              </span>
              <button
                type="button"
                onClick={() => setEvidenceModal(null)}
                className="h-8 px-4 bg-[#52796F] text-white text-xs font-semibold rounded-lg hover:bg-[#45665E] cursor-pointer"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Show-Cause Notice Modal */}
      {showNoticeModal && currentInspection.officialNoticeDraft && (
        <ShowCauseNoticeModal
          noticeDraft={currentInspection.officialNoticeDraft}
          productName={currentInspection.productName}
          batchReference={currentInspection.batchReference}
          onClose={() => setShowNoticeModal(false)}
        />
      )}

      {/* Official Inspection Report Modal */}
      {showReportModal && (
        <InspectionReportModal
          inspection={currentInspection}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}
