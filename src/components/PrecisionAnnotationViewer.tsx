import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../lib/i18n';
import {
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Sparkles,
  Info,
} from 'lucide-react';
import { BoundingBox, InspectionImageRecord } from '../types';
import {
  getShortFieldLabel,
  getFieldCategory,
  FIELD_CATEGORY_FILTERS,
  FieldCategory,
  normalizeBoxCoords,
} from '../lib/annotationUtils';

interface PrecisionAnnotationViewerProps {
  images: Array<{
    id: string;
    previewUrl?: string;
    side?: string;
    fileName?: string;
  }>;
  boundingBoxes: BoundingBox[];
  selectedBox: BoundingBox | null;
  onSelectBox: (box: BoundingBox | null) => void;
  activeImageIndex?: number;
  onSelectImageIndex?: (index: number) => void;
  language?: 'EN' | 'HI';
}

export const PrecisionAnnotationViewer: React.FC<PrecisionAnnotationViewerProps> = ({
  images,
  boundingBoxes,
  selectedBox,
  onSelectBox,
  activeImageIndex: externalActiveIdx,
  onSelectImageIndex,
  language = 'EN',
}) => {
  const { t } = useTranslation();
  // Annotation visibility toggle: ON by default
  const [showAnnotations, setShowAnnotations] = useState<boolean>(true);

  // Active image index
  const [internalActiveIdx, setInternalActiveIdx] = useState<number>(0);
  const activeIdx = externalActiveIdx !== undefined ? externalActiveIdx : internalActiveIdx;

  const setActiveIdx = (idx: number) => {
    if (onSelectImageIndex) {
      onSelectImageIndex(idx);
    } else {
      setInternalActiveIdx(idx);
    }
  };

  // Zoom levels: 50%, 75%, 100%, 125%, 150%, 200%
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Active category filter
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<FieldCategory>('all');
  const [showFilterMenu, setShowFilterMenu] = useState<boolean>(false);

  // Popover state
  const [hoveredBox, setHoveredBox] = useState<BoundingBox | null>(null);

  // Container refs
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // If selectedBox changes and points to a different image, automatically switch view & turn annotations ON
  useEffect(() => {
    if (selectedBox) {
      if (selectedBox.sourceImageIndex !== undefined && selectedBox.sourceImageIndex !== activeIdx) {
        setActiveIdx(selectedBox.sourceImageIndex);
      }
      // Guarantee annotations are visible if a box was targeted
      setShowAnnotations(true);
    }
  }, [selectedBox]);

  // Current active image
  const currentImage = images[activeIdx] || images[0];
  const previewUrl = currentImage?.previewUrl || '';

  // Filter bounding boxes for the current image
  const imageBoxes = boundingBoxes.filter((b) => {
    if (images.length <= 1) return true;
    if (b.sourceImageIndex !== undefined) {
      return b.sourceImageIndex === activeIdx;
    }
    if (b.sourceImageId && currentImage?.id) {
      return b.sourceImageId === currentImage.id;
    }
    // Fallback if not explicitly indexed: show on view 0
    return activeIdx === 0;
  });

  // Apply category filter
  const filteredBoxes = imageBoxes.filter((b) => {
    if (activeCategoryFilter === 'all') return true;
    const cat = b.category || getFieldCategory(b.field, b.label);
    return cat === activeCategoryFilter;
  });

  // View label helper
  const getViewLabel = (side?: string, idx?: number) => {
    const s = (side || '').toUpperCase();
    if (s.includes('FRONT')) return language === 'HI' ? 'मुख्य मुख (Front)' : 'Front Panel (PDP)';
    if (s.includes('BACK')) return language === 'HI' ? 'पिछला भाग (Back)' : 'Back Panel';
    if (s.includes('LEFT')) return language === 'HI' ? 'बायां भाग (Left Side)' : 'Left Side';
    if (s.includes('RIGHT')) return language === 'HI' ? 'दायां भाग (Right Side)' : 'Right Side';
    if (s.includes('TOP') || s.includes('NECK')) return language === 'HI' ? 'ऊपरी भाग / नेक' : 'Top / Neck Panel';
    if (s.includes('BOTTOM')) return language === 'HI' ? 'निचला भाग (Bottom)' : 'Bottom Panel';
    return `View ${(idx ?? 0) + 1}`;
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(200, prev + 25));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(50, prev - 25));
  const handleZoomReset = () => setZoomLevel(100);

  // Map filter category id to i18n key
  const getCatLabel = (id: string): string => {
    const keyMap: Record<string, string> = {
      all: 'annotations.allFields',
      pricing: 'annotations.pricingMrp',
      product: 'annotations.product',
      dates: 'annotations.dates',
      batch: 'annotations.batchLot',
      manufacturer: 'annotations.manufacturer',
      contact: 'annotations.contact',
      legal: 'annotations.legal',
      safety: 'annotations.safety',
    };
    return t(keyMap[id] || 'annotations.filter');
  };

  return (
    <div className="bg-[#FAF8F5] border border-[#E7E3DC] rounded-xl overflow-hidden shadow-xs flex flex-col">
      {/* ── Top Control Bar ────────────────────────────────────────────── */}
      <div className="bg-[#F6F4EE] border-b border-[#E7E3DC] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Multi-Image Selector Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {images.length > 1 ? (
            images.map((img, idx) => {
              const isActive = idx === activeIdx;
              const boxCountForImg = boundingBoxes.filter(
                (b) => b.sourceImageIndex === idx || (b.sourceImageId && b.sourceImageId === img.id)
              ).length;

              return (
                <button
                  key={img.id || idx}
                  type="button"
                  onClick={() => {
                    setActiveIdx(idx);
                    onSelectBox(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer border ${isActive
                      ? 'bg-white text-[#2D322E] border-[#52796F] shadow-xs font-bold ring-1 ring-[#52796F]/30'
                      : 'bg-[#FAF8F5] hover:bg-white text-[#535953] border-[#E7E3DC]'
                    }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-[#52796F]' : 'bg-[#DFDBD3]'}`} />
                  <span>Image {idx + 1}: {getViewLabel(img.side, idx)}</span>
                  {boxCountForImg > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#EBF3EE] text-[#335E46] border border-[#C7DECF]">
                      {boxCountForImg}
                    </span>
                  )}
                </button>
              );
            })
          ) : (
            <div className="flex items-center gap-2 text-xs font-semibold text-[#2D322E]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#52796F]" />
              <span>{getViewLabel(currentImage?.side, 0)}</span>
              {imageBoxes.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-[#EBF3EE] text-[#335E46] border border-[#C7DECF]">
                  {imageBoxes.length} {t('annotations.statutoryFieldsDetected')}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: Toggle Switch & Viewer Tools */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Optional Category Filter */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFilterMenu((v) => !v)}
              className={`h-8 px-2.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer ${activeCategoryFilter !== 'all'
                  ? 'bg-[#52796F] text-white border-[#52796F]'
                  : 'bg-white hover:bg-[#F2F0E8] text-[#535953] border-[#DFDBD3]'
                }`}
              title="Filter visible bounding boxes by statutory group"
            >
              <Filter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {getCatLabel(activeCategoryFilter)}
              </span>
            </button>

            {showFilterMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-[#DFDBD3] rounded-xl shadow-lg z-50 py-1.5 text-xs">
                <div className="px-3 py-1 font-bold text-[#7A827B] uppercase tracking-wider text-[10px] border-b border-[#E7E3DC] mb-1">
                  {t('annotations.filterAnnotations')}
                </div>
                {FIELD_CATEGORY_FILTERS.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setActiveCategoryFilter(cat.id);
                      setShowFilterMenu(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[#F6F4EE] transition-colors ${activeCategoryFilter === cat.id ? 'font-bold text-[#52796F] bg-[#F5F8F6]' : 'text-[#2D322E]'
                      }`}
                  >
                    <span>{getCatLabel(cat.id)}</span>
                    {activeCategoryFilter === cat.id && <span className="w-1.5 h-1.5 rounded-full bg-[#52796F]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center bg-white border border-[#DFDBD3] rounded-lg p-0.5 text-xs">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 50}
              className="w-7 h-7 flex items-center justify-center text-[#535953] hover:text-[#2D322E] hover:bg-[#F6F4EE] rounded disabled:opacity-40 cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleZoomReset}
              className="px-2 h-7 font-mono font-bold text-[11px] text-[#2D322E] hover:bg-[#F6F4EE] rounded cursor-pointer"
              title="Reset Zoom"
            >
              {zoomLevel}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 200}
              className="w-7 h-7 flex items-center justify-center text-[#535953] hover:text-[#2D322E] hover:bg-[#F6F4EE] rounded disabled:opacity-40 cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ── MANDATORY PRIMARY TOGGLE: BOUNDARY BOXES [ ON / OFF ] ── */}
          <div className="flex items-center gap-2 bg-white border border-[#DFDBD3] rounded-xl px-3 py-1 shadow-xs">
            <div className="flex items-center gap-1.5">
              <Layers className={`w-4 h-4 ${showAnnotations ? 'text-[#52796F]' : 'text-[#7A827B]'}`} />
              <span className="text-xs font-bold text-[#2D322E] uppercase tracking-wide">
                {t('annotations.boundaryBoxes')}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowAnnotations((prev) => !prev);
                if (showAnnotations) onSelectBox(null);
              }}
              className={`relative inline-flex h-6 w-16 items-center rounded-full p-0.5 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#52796F] focus:ring-offset-1 ${showAnnotations ? 'bg-[#52796F]' : 'bg-[#DFDBD3]'
                }`}
              title={showAnnotations ? 'Switch to Clean Original View' : 'Switch to Annotated View'}
            >
              <span
                className={`absolute text-[10px] font-bold font-mono tracking-wider transition-opacity ${showAnnotations ? 'left-2 text-white opacity-100' : 'right-2 text-[#535953] opacity-100'
                  }`}
              >
                {showAnnotations ? t('annotations.on') : t('annotations.off')}
              </span>
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${showAnnotations ? 'translate-x-10' : 'translate-x-0'
                  }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ── Status Header Pill bar ────────────────────────────────────── */}
      <div className="bg-[#FAF8F5] border-b border-[#E7E3DC] px-4 py-2 flex items-center justify-between text-xs text-[#7A827B]">
        <div className="flex items-center gap-2">
          {showAnnotations ? (
            <span className="flex items-center gap-1.5 text-[#335E46] font-semibold bg-[#EBF3EE] px-2 py-0.5 rounded-md border border-[#C7DECF]">
              <Eye className="w-3.5 h-3.5 text-[#335E46]" />
              {t('annotations.annotatedView')} ({filteredBoxes.length} {t('annotations.fieldsCount')})
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[#535953] font-semibold bg-white px-2 py-0.5 rounded-md border border-[#DFDBD3]">
              <EyeOff className="w-3.5 h-3.5 text-[#7A827B]" />
              {t('annotations.cleanView')}
            </span>
          )}

          {activeCategoryFilter !== 'all' && showAnnotations && (
            <span className="font-mono text-[11px] text-[#52796F]">
              Filtered: {FIELD_CATEGORY_FILTERS.find((f) => f.id === activeCategoryFilter)?.label}
            </span>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#52796F]" /> {t('annotations.verified')}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#8C5E2D]" /> {t('annotations.viewEvidence')}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#9E432A]" /> {t('annotations.violation')}
          </span>
        </div>
      </div>

      {/* ── Canvas Container with Lockstep Scaling & Precision Overlay ── */}
      <div
        ref={viewerContainerRef}
        className="relative w-full min-h-[380px] max-h-[620px] overflow-auto bg-[#1C201D] flex items-center justify-center p-4 select-none"
      >
        {previewUrl ? (
          <div
            className="relative transition-transform duration-200 ease-out origin-center"
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'center center',
            }}
          >
            {/* Base Image Container (inline-block ensures overlay bounds strictly equal rendered image dimensions) */}
            <div className="relative inline-block max-w-full shadow-2xl rounded-lg overflow-hidden border border-white/20 bg-black/40">
              <img
                ref={imageRef}
                src={previewUrl}
                alt="Product View"
                className="block max-h-[540px] max-w-full w-auto h-auto select-none pointer-events-none"
                draggable={false}
              />

              {/* ── Precision Annotation Overlay (Only rendered when ON) ── */}
              {showAnnotations && (
                <div className="absolute inset-0 pointer-events-auto">
                  {filteredBoxes.map((box, idx) => {
                    const coords = normalizeBoxCoords(box);
                    const shortLabel = box.displayLabel || getShortFieldLabel(box.field, box.label);
                    const isSelected = selectedBox?.id === box.id;
                    const isHovered = hoveredBox?.id === box.id;

                    const isViolation = box.status === 'VIOLATION';
                    const isReview =
                      (box.status as string) === 'REVIEW_REQUIRED' ||
                      box.status === 'REQUIRES_MANUAL_REVIEW' ||
                      box.status === 'INSUFFICIENT_EVIDENCE' ||
                      box.status === 'POTENTIAL_ISSUE' ||
                      box.status === 'WARNING' ||
                      box.status === 'LOW_CONFIDENCE';
                    const isVerified = box.status === 'VERIFIED';

                    // Dynamic colors
                    let borderColor = 'border-[#52796F]';
                    let bgColor = 'bg-[#52796F]/15';
                    let badgeBg = 'bg-[#335E46] text-white';

                    if (isViolation) {
                      borderColor = 'border-[#9E432A]';
                      bgColor = 'bg-[#9E432A]/20';
                      badgeBg = 'bg-[#9E432A] text-white';
                    } else if (isReview) {
                      borderColor = 'border-[#8C5E2D]';
                      bgColor = 'bg-[#8C5E2D]/20';
                      badgeBg = 'bg-[#8C5E2D] text-white';
                    }

                    return (
                      <div
                        key={box.id || idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectBox(isSelected ? null : box);
                        }}
                        onMouseEnter={() => setHoveredBox(box)}
                        onMouseLeave={() => setHoveredBox(null)}
                        style={{
                          left: `${coords.x}%`,
                          top: `${coords.y}%`,
                          width: `${coords.width}%`,
                          height: `${coords.height}%`,
                        }}
                        className={`absolute border-2 rounded transition-all cursor-pointer group ${borderColor} ${bgColor} ${isSelected
                            ? 'ring-4 ring-white ring-offset-2 ring-offset-black/60 shadow-2xl z-30 scale-[1.02] animate-pulse !bg-white/30'
                            : isHovered
                              ? 'ring-2 ring-white/80 shadow-lg z-20 scale-[1.01] bg-white/20'
                              : 'hover:border-white z-10'
                          }`}
                      >
                        {/* Short 1-2 Word Label Badge (Strictly Canonical) */}
                        <div
                          className={`absolute -top-3.5 left-0.5 px-1.5 py-0.5 rounded font-mono text-[9px] font-bold shadow-md truncate max-w-[130px] flex items-center gap-1 ${badgeBg} ${isSelected ? 'scale-110 ring-1 ring-white' : ''
                            }`}
                        >
                          <span>{shortLabel}</span>
                          {box.confidence && (
                            <span className="opacity-80 text-[8px]">
                              {Math.round(box.confidence > 1 ? box.confidence : box.confidence * 100)}%
                            </span>
                          )}
                        </div>

                        {/* Optional Polygon SVG outline if available */}
                        {box.polygon && box.polygon.length > 2 && (
                          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                            <polygon
                              points={box.polygon.map((p) => `${p.x},${p.y}`).join(' ')}
                              fill="none"
                              stroke={isViolation ? '#9E432A' : isReview ? '#8C5E2D' : '#52796F'}
                              strokeWidth="2"
                              strokeDasharray="3 3"
                            />
                          </svg>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Compact Information Popover on Click ── */}
            {showAnnotations && selectedBox && (() => {
              const selCoords = normalizeBoxCoords(selectedBox);
              return (
                <div
                  className="absolute z-40 bg-white border border-[#DFDBD3] rounded-xl shadow-2xl p-3.5 w-64 max-w-[90vw] text-[#2D322E] animate-in fade-in zoom-in-95 duration-150"
                  style={{
                    left: `${Math.min(70, Math.max(5, selCoords.x))}%`,
                    top: `${Math.min(75, Math.max(5, selCoords.y + selCoords.height + 2))}%`,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-start justify-between gap-2 border-b border-[#E7E3DC] pb-2 mb-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A827B]">
                        {t('annotations.statutoryDeclaration')}
                      </span>
                      <h4 className="text-sm font-bold text-[#2D322E]">
                        {selectedBox.displayLabel || getShortFieldLabel(selectedBox.field, selectedBox.label)}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectBox(null)}
                      className="text-[#7A827B] hover:text-[#2D322E] p-1 rounded-md hover:bg-[#F6F4EE] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] text-[#7A827B] block font-mono">{t('annotations.detectedOcrText')}</span>
                      <p className="font-mono font-bold text-xs text-[#2D322E] bg-[#FAF8F5] p-1.5 rounded border border-[#E7E3DC] break-words">
                        {selectedBox.value || t('annotations.detectedOnPackaging')}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#E7E3DC]">
                      <span className="text-[#535953] font-mono">{t('annotations.status')}</span>
                      <span
                        className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${selectedBox.status === 'VERIFIED'
                            ? 'bg-[#EBF3EE] text-[#335E46] border border-[#C7DECF]'
                            : selectedBox.status === 'VIOLATION'
                              ? 'bg-[#FAECE7] text-[#9E432A] border border-[#F7D0C4]'
                              : 'bg-[#FBF3E8] text-[#8C5E2D] border border-[#EED9C4]'
                          }`}
                      >
                        {selectedBox.status === 'VERIFIED'
                          ? t('annotations.passVerified')
                          : selectedBox.status === 'VIOLATION'
                            ? t('annotations.violation')
                            : t('annotations.reviewRequired')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#535953] font-mono">{t('annotations.confidence')}</span>
                      <span className="font-mono font-bold text-[#2D322E]">
                        {Math.round(
                          selectedBox.confidence > 1 ? selectedBox.confidence : (selectedBox.confidence || 0.95) * 100
                        )}
                        %
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#535953] font-mono">{t('annotations.sourceView')}</span>
                      <span className="font-mono text-[#535953]">
                        Image {(selectedBox.sourceImageIndex ?? activeIdx) + 1} ({getViewLabel(selectedBox.sourceSide, selectedBox.sourceImageIndex)})
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="text-center text-white/60 text-xs py-12">
            <Info className="w-8 h-8 mx-auto mb-2 text-white/40" />
            <p>{t('annotations.noPreview')}</p>
          </div>
        )}
      </div>

      {/* ── Bottom Help Hint ────────────────────────────────────────────── */}
      <div className="px-4 py-2 bg-[#F6F4EE] border-t border-[#E7E3DC] flex items-center justify-between text-[11px] text-[#7A827B]">
        <span>
          {t('annotations.hintText')}
        </span>
        <span className="font-mono text-[10px]">
          {t('annotations.layerVer')}
        </span>
      </div>
    </div>
  );
};
