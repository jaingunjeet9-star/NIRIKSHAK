import { useState } from 'react';
import { X, Image as ImageIcon, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { InspectionRecord, BoundingBox } from '../../types';

interface EvidenceViewerModalProps {
  inspection: InspectionRecord;
  targetBoundingBoxId?: string;
  targetField?: string;
  onClose: () => void;
}

export function EvidenceViewerModal({
  inspection,
  targetBoundingBoxId,
  targetField,
  onClose,
}: EvidenceViewerModalProps) {
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  const images = inspection.images && inspection.images.length > 0 ? inspection.images : [];
  const currentImage = images[activeImgIndex];
  const previewUrl = currentImage?.previewUrl || (images.length === 0 ? undefined : undefined);

  // Match bounding boxes belonging to active image view or field
  const boxes = (inspection.boundingBoxes || []).filter((b) => {
    if (images.length > 1) {
      if (b.sourceImageIndex !== undefined) return b.sourceImageIndex === activeImgIndex;
      if (b.sourceImageId && currentImage && b.sourceImageId === currentImage.id) return true;
    }
    return true;
  });

  const targetBox = boxes.find(
    (b) => b.id === targetBoundingBoxId || (targetField && b.field === targetField)
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 md:p-6 overflow-y-auto">
      <div className="bg-white border border-[#E7E3DC] rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E7E3DC] flex items-center justify-between bg-[#FAF8F5]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#EBF3EE] border border-[#C7DECF] rounded text-[10px] font-mono font-bold text-[#335E46]">
                EVIDENCE VIEWER
              </span>
              <span className="text-xs font-mono font-semibold text-[#7A827B]">
                {inspection.id}
              </span>
            </div>
            <h3 className="text-base font-bold text-[#2D322E] mt-0.5">
              {inspection.productName}
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
          {/* Multi-Image Tab Selector if multiple images exist */}
          {images.length > 1 && (
            <div className="flex items-center gap-2 p-1.5 bg-[#FAF8F5] rounded-xl border border-[#E7E3DC]">
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  type="button"
                  onClick={() => setActiveImgIndex(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeImgIndex === idx
                      ? 'bg-white text-[#2D322E] shadow-2xs border border-[#E7E3DC]'
                      : 'text-[#7A827B] hover:text-[#2D322E]'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>
                    Image {idx + 1} ({img.side || 'PANEL'})
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Evidence Canvas Display */}
          {previewUrl ? (
            <div className="relative bg-[#1A1D1A] rounded-xl overflow-hidden min-h-[350px] flex items-center justify-center border border-[#E7E3DC]">
              <img
                src={previewUrl}
                alt={`Scanned evidence for ${inspection.productName}`}
                className="max-h-[500px] w-auto object-contain"
              />

              {/* Bounding Box Overlays */}
              {boxes.map((box) => {
                const isTarget = box.id === targetBoundingBoxId || (targetField && box.field === targetField);
                const isViolation = box.status === 'VIOLATION';

                let borderColor = 'border-[#52796F] bg-[#52796F]/20';
                let pillBg = 'bg-[#335E46] text-white';

                if (isViolation) {
                  borderColor = 'border-[#9E432A] bg-[#9E432A]/30 animate-pulse';
                  pillBg = 'bg-[#9E432A] text-white';
                } else if (isTarget) {
                  borderColor = 'border-[#8C5E2D] bg-[#8C5E2D]/30 ring-2 ring-[#8C5E2D]';
                  pillBg = 'bg-[#8C5E2D] text-white';
                }

                return (
                  <div
                    key={box.id}
                    className={`absolute border-2 rounded-xs ${borderColor}`}
                    style={{
                      left: `${box.x}%`,
                      top: `${box.y}%`,
                      width: `${box.width}%`,
                      height: `${box.height}%`,
                    }}
                  >
                    <span
                      className={`absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold shadow-xs whitespace-nowrap ${pillBg}`}
                    >
                      {box.displayLabel || box.label} ({box.confidence}%)
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center bg-[#FAF8F5] border border-[#E7E3DC] rounded-xl space-y-2">
              <ShieldAlert className="w-8 h-8 text-[#7A827B] mx-auto opacity-60" />
              <h4 className="text-sm font-bold text-[#2D322E]">Evidence image unavailable</h4>
              <p className="text-xs text-[#7A827B]">
                No physical photograph was uploaded or preserved for this inspection record.
              </p>
            </div>
          )}

          {/* Highlights Summary */}
          {targetBox && (
            <div className="p-3.5 bg-[#FBF3E8] border border-[#EED9C4] rounded-xl text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#8C5E2D]">
                <AlertTriangle className="w-4 h-4 shrink-0 text-[#8C5E2D]" />
                <span>Target Evidence Highlight: {targetBox.displayLabel || targetBox.label}</span>
              </div>
              <p className="text-[#535953] font-mono">
                Detected Text Value: "{targetBox.value}" (Confidence: {targetBox.confidence}%, Status: {targetBox.status})
              </p>
            </div>
          )}

          {/* Box Legend */}
          <div className="flex items-center justify-between text-[11px] text-[#7A827B] pt-2 border-t border-[#E7E3DC]">
            <span>
              Showing {boxes.length} bounding box annotations for Panel {activeImgIndex + 1}
            </span>
            <div className="flex items-center gap-3 font-medium">
              <span className="flex items-center gap-1 text-[#335E46]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#335E46]" /> Verified Compliant
              </span>
              <span className="flex items-center gap-1 text-[#9E432A]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#9E432A]" /> Flagged Violation
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
