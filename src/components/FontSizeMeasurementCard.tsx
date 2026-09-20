import { useState } from 'react';
import {
  Ruler,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Eye,
  Sliders,
  Scale,
  Maximize2,
  BookOpen,
} from 'lucide-react';
import { FontSizeMeasurementResult, ReferenceObjectProfile } from '../types';

interface FontSizeMeasurementCardProps {
  isEnabled: boolean;
  onToggleEnabled: (enabled: boolean) => void;
  result?: FontSizeMeasurementResult;
  activeProfile: ReferenceObjectProfile | null;
  onOpenSetupModal: () => void;
  onOpenSlidesModal: () => void;
}

export function FontSizeMeasurementCard({
  isEnabled,
  onToggleEnabled,
  result,
  activeProfile,
  onOpenSetupModal,
  onOpenSlidesModal,
}: FontSizeMeasurementCardProps) {
  const [showDetails, setShowDetails] = useState(true);

  return (
    <div className="bg-white border border-[#E7E3DC] rounded-2xl p-5 md:p-6 shadow-xs space-y-4">
      {/* Header & Toggle Control */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E7E3DC] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#52796F]/10 border border-[#52796F]/30 text-[#52796F] flex items-center justify-center">
            <Ruler className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-bold text-[#2D322E] tracking-tight flex items-center gap-2">
              Physical Declaration Font-Size Verification
            </h3>
            <p className="text-[11px] font-medium text-[#7A827B]">
              Legal Metrology Calibration & Computer Vision Scale
            </p>
          </div>
        </div>

        {/* Toggle Switch Button */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#2D322E]">
            FONT SIZE VERIFICATION
          </span>
          <button
            type="button"
            onClick={() => onToggleEnabled(!isEnabled)}
            className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isEnabled ? 'bg-[#52796F]' : 'bg-[#DFDBD3]'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                isEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
          <span
            className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
              isEnabled
                ? 'bg-[#EBF3EE] text-[#335E46] border border-[#C7DECF]'
                : 'bg-[#FAF8F5] text-[#7A827B] border border-[#E7E3DC]'
            }`}
          >
            {isEnabled ? 'ON' : 'OFF'}
          </span>
        </div>
      </div>

      {/* OFF STATE BANNER */}
      {!isEnabled && (
        <div className="p-4 bg-[#FAF8F5] border border-[#E7E3DC] rounded-xl flex items-center justify-between gap-3 text-xs text-[#535953]">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#8C5E2D] shrink-0" />
            <div>
              <span className="font-bold text-[#2D322E] block">
                PHYSICAL FONT-SIZE VERIFICATION NOT PERFORMED
              </span>
              <span className="text-[11px] text-[#7A827B]">
                Font measurement pipeline is disabled. Result defaulting to MANUAL VERIFICATION REQUIRED.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onToggleEnabled(true)}
            className="px-3 py-1.5 bg-[#52796F] text-white font-bold text-[11px] rounded-lg shadow-xs cursor-pointer hover:bg-[#45665E] shrink-0"
          >
            Turn ON
          </button>
        </div>
      )}

      {/* ON STATE WITHOUT ACTIVE PROFILE */}
      {isEnabled && (!activeProfile || !activeProfile.isActive) && (
        <div className="p-4 bg-[#FFFBEB] border border-[#FCD34D] rounded-xl flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-[#92400E]">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-[#B45309] shrink-0" />
            <div>
              <span className="font-bold text-[#92400E] block">
                Reference Object Setup Required
              </span>
              <span className="text-[11px] text-[#B45309]">
                To perform physical font-size verification, the inspector must register a verified physical reference object profile.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenSlidesModal}
              className="px-3 py-1.5 bg-white border border-[#FCD34D] text-[#92400E] font-semibold text-[11px] rounded-lg shadow-xs cursor-pointer hover:bg-[#FEF3C7]"
            >
              Learn How It Works
            </button>
            <button
              type="button"
              onClick={onOpenSetupModal}
              className="px-3.5 py-1.5 bg-[#B45309] text-white font-bold text-[11px] rounded-lg shadow-xs cursor-pointer hover:bg-[#78350F]"
            >
              Set Up Reference Object
            </button>
          </div>
        </div>
      )}

      {/* ON STATE WITH RESULT */}
      {isEnabled && activeProfile && activeProfile.isActive && result && (
        <div className="space-y-4">
          {/* Summary Status Strip */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
              result.status === 'VERIFIED'
                ? 'bg-[#EBF3EE] border-[#C7DECF] text-[#335E46]'
                : result.status === 'VIOLATION'
                ? 'bg-[#FAECE7] border-[#F7D0C4] text-[#9E432A]'
                : 'bg-[#FFFBEB] border-[#FCD34D] text-[#92400E]'
            }`}
          >
            <div className="flex items-center gap-3">
              {result.status === 'VERIFIED' ? (
                <CheckCircle2 className="w-5 h-5 text-[#335E46]" />
              ) : result.status === 'VIOLATION' ? (
                <XCircle className="w-5 h-5 text-[#9E432A]" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-[#B45309]" />
              )}
              <div>
                <span className="font-mono text-xs font-bold uppercase tracking-wider block">
                  {result.status === 'VERIFIED'
                    ? 'PHYSICAL FONT SIZE — VERIFIED'
                    : result.status === 'VIOLATION'
                    ? 'PHYSICAL FONT SIZE — NON-COMPLIANT'
                    : 'MANUAL VERIFICATION REQUIRED'}
                </span>
                <span className="text-[11px] font-medium opacity-90">
                  {result.summaryMessage}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenSetupModal}
                className="px-2.5 py-1 bg-white/80 border border-current text-[11px] font-bold rounded-lg cursor-pointer hover:bg-white"
              >
                Profile: {activeProfile.name.slice(0, 18)}...
              </button>
            </div>
          </div>

          {/* Scale Calibration Details Grid */}
          {result.performed && result.scalePxPerMm > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs p-3 bg-[#FAF8F5] border border-[#E7E3DC] rounded-xl">
              <div>
                <span className="text-[10px] text-[#7A827B] uppercase block">Calibrated Scale</span>
                <span className="font-bold text-[#2D322E]">{result.scalePxPerMm} px / mm</span>
              </div>
              <div>
                <span className="text-[10px] text-[#7A827B] uppercase block">Resolution</span>
                <span className="font-bold text-[#2D322E]">{result.scaleMmPerPx} mm / px</span>
              </div>
              <div>
                <span className="text-[10px] text-[#7A827B] uppercase block">Marker ID</span>
                <span className="font-bold text-[#2D322E]">ID #{result.detectedMarker?.markerId ?? 0}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#7A827B] uppercase block">Scale Uncertainty</span>
                <span className="font-bold text-[#335E46]">±{result.scaleUncertaintyPercent}%</span>
              </div>
            </div>
          )}

          {/* Measured Fields Breakdown Table */}
          {result.measuredFields.length > 0 && (
            <div className="border border-[#E7E3DC] rounded-xl overflow-hidden">
              <div className="px-4 py-2 bg-[#F6F4EE] border-b border-[#E7E3DC] flex items-center justify-between text-[11px] font-bold text-[#2D322E]">
                <span>FIELD DECLARATION</span>
                <span>MEASURED HEIGHT (MM) VS STATUTORY REQ</span>
              </div>
              <div className="divide-y divide-[#E7E3DC]">
                {result.measuredFields.map((field, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <span className="font-bold text-[#2D322E] block">{field.label}</span>
                      <span className="font-mono text-[11px] text-[#7A827B]">
                        "{field.detectedText}"
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right font-mono text-[11px]">
                        <span className={`font-bold block ${field.status === 'VIOLATION' ? 'text-[#9E432A]' : 'text-[#335E46]'}`}>
                          {field.glyphHeightMm} mm
                        </span>
                        <span className="text-[#7A827B] text-[10px]">
                          Min Req: {field.requiredMinHeightMm} mm
                        </span>
                      </div>

                      <span
                        className={`px-2 py-0.5 font-mono text-[10px] font-bold rounded ${
                          field.status === 'VERIFIED'
                            ? 'bg-[#EBF3EE] text-[#335E46] border border-[#C7DECF]'
                            : 'bg-[#FAECE7] text-[#9E432A] border border-[#F7D0C4]'
                        }`}
                      >
                        {field.status === 'VERIFIED' ? 'VERIFIED' : 'NON-COMPLIANT'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
