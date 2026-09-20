import { useState, ChangeEvent } from 'react';
import {
  X,
  Ruler,
  Shield,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Download,
  Info,
  Edit3,
  Power,
  BookOpen,
} from 'lucide-react';
import { ReferenceObjectProfile } from '../types';

interface ReferenceSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProfile: ReferenceObjectProfile | null;
  onSaveProfile: (profile: ReferenceObjectProfile) => void;
  onDeactivateProfile: () => void;
  onOpenSlides: () => void;
}

export function ReferenceSetupModal({
  isOpen,
  onClose,
  activeProfile,
  onSaveProfile,
  onDeactivateProfile,
  onOpenSlides,
}: ReferenceSetupModalProps) {
  const [mode, setMode] = useState<'VIEW' | 'FORM'>(activeProfile ? 'VIEW' : 'FORM');
  const [name, setName] = useState(activeProfile?.name || 'NIC Inspector Calibration Marker #01');
  const [markerType, setMarkerType] = useState<'ARUCO_4X4_50' | 'CUSTOM_CALIBRATION_CARD' | 'CUSTOM_FIDUCIAL'>(
    activeProfile?.markerType || 'ARUCO_4X4_50'
  );
  const [markerId, setMarkerId] = useState<number>(activeProfile?.markerId ?? 0);
  const [widthMm, setWidthMm] = useState<number>(activeProfile?.physicalWidthMm || 50);
  const [heightMm, setHeightMm] = useState<number>(activeProfile?.physicalHeightMm || 50);
  const [toleranceMm, setToleranceMm] = useState<number>(activeProfile?.toleranceMm || 0.1);
  const [isConfirmed, setIsConfirmed] = useState(activeProfile?.isConfirmedByInspector || false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(activeProfile?.referenceImageUrl || null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setPreviewUrl(evt.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegister = () => {
    setErrorMsg(null);
    if (!name.trim()) {
      setErrorMsg('Reference Name is required.');
      return;
    }
    if (!widthMm || widthMm <= 0 || !heightMm || heightMm <= 0) {
      setErrorMsg('Physical dimensions must be greater than 0 mm.');
      return;
    }
    if (!isConfirmed) {
      setErrorMsg('You must confirm that the entered physical dimensions correspond to the actual reference object.');
      return;
    }

    const newProfile: ReferenceObjectProfile = {
      id: activeProfile?.id || `REF-${Date.now()}`,
      name: name.trim(),
      markerType,
      markerId,
      physicalWidthMm: Number(widthMm),
      physicalHeightMm: Number(heightMm),
      toleranceMm: Number(toleranceMm),
      isActive: true,
      registeredAt: new Date().toISOString(),
      inspectorId: 'OFFICER-NIC-DELHI-04',
      referenceImageUrl: previewUrl || undefined,
      isConfirmedByInspector: true,
    };

    onSaveProfile(newProfile);
    setMode('VIEW');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-white border border-[#E7E3DC] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="px-6 py-4 bg-[#F6F4EE] border-b border-[#E7E3DC] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#52796F] text-white flex items-center justify-center">
              <Ruler className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-bold text-[#2D322E] tracking-tight">
                Inspectors Reference Object Registration
              </h2>
              <p className="text-[11px] font-medium text-[#7A827B]">
                Computer Vision Calibration Profile
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenSlides}
              className="h-8 px-3 text-[11px] font-semibold text-[#335E46] bg-[#EBF3EE] hover:bg-[#DCECE1] border border-[#C7DECF] rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#52796F]" />
              <span>Learn How It Works</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#7A827B] hover:text-[#2D322E] hover:bg-[#E7E3DC] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {mode === 'VIEW' && activeProfile && activeProfile.isActive ? (
            /* ACTIVE PROFILE DISPLAY CARD */
            <div className="space-y-6">
              <div className="p-6 bg-[#EBF3EE]/60 border border-[#C7DECF] rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#52796F] animate-pulse"></span>
                    <span className="text-xs font-bold text-[#335E46] uppercase tracking-wider">
                      Reference Status: ACTIVE
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-[#7A827B]">
                    ID: {activeProfile.id}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A827B] block">
                      Reference Name
                    </span>
                    <span className="text-base font-bold text-[#2D322E]">
                      {activeProfile.name}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A827B] block">
                      Known Dimensions
                    </span>
                    <span className="font-mono text-base font-bold text-[#335E46]">
                      {activeProfile.physicalWidthMm.toFixed(2)} mm × {activeProfile.physicalHeightMm.toFixed(2)} mm
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A827B] block">
                      Fiducial Marker Type
                    </span>
                    <span className="text-xs font-semibold text-[#2D322E]">
                      {activeProfile.markerType} (Marker ID #{activeProfile.markerId ?? 0})
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A827B] block">
                      Measurement Accuracy Tolerance
                    </span>
                    <span className="font-mono text-xs font-semibold text-[#2D322E]">
                      ±{activeProfile.toleranceMm.toFixed(2)} mm
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A827B] block">
                      Registered Date
                    </span>
                    <span className="text-xs text-[#535953]">
                      {new Date(activeProfile.registeredAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A827B] block">
                      Verification Status
                    </span>
                    <span className="text-xs font-bold text-[#335E46] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#335E46]" /> Confirmed by Inspector
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Active Profile */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('FORM')}
                    className="h-10 px-4 bg-[#52796F] hover:bg-[#45665E] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Update Profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={onDeactivateProfile}
                    className="h-10 px-4 bg-white border border-[#F7D0C4] text-[#9E432A] hover:bg-[#FAECE7] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Power className="w-3.5 h-3.5 text-[#9E432A]" />
                    <span>Deactivate</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={onOpenSlides}
                  className="h-10 px-4 bg-[#FAF8F5] border border-[#E7E3DC] hover:bg-[#F6F4EE] text-[#2D322E] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#52796F]" />
                  <span>Learn How It Works</span>
                </button>
              </div>
            </div>
          ) : (
            /* REGISTRATION / UPDATE FORM */
            <div className="space-y-6">
              {errorMsg && (
                <div className="p-3 bg-[#FAECE7] border border-[#F7D0C4] rounded-xl text-xs text-[#9E432A] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-[#9E432A]" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <label className="text-xs font-bold text-[#2D322E]">
                    Reference Name <span className="text-[#9E432A]">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. NIC Official ArUco Calibration Card"
                    className="w-full h-10 px-3 text-xs bg-[#FAF8F5] border border-[#E7E3DC] rounded-xl focus:outline-none focus:border-[#52796F] text-[#2D322E]"
                  />
                </div>

                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <label className="text-xs font-bold text-[#2D322E]">
                    Fiducial Marker Type
                  </label>
                  <select
                    value={markerType}
                    onChange={(e) => setMarkerType(e.target.value as any)}
                    className="w-full h-10 px-3 text-xs bg-[#FAF8F5] border border-[#E7E3DC] rounded-xl focus:outline-none focus:border-[#52796F] text-[#2D322E]"
                  >
                    <option value="ARUCO_4X4_50">OpenCV ArUco (Dict 4x4_50, ID #0)</option>
                    <option value="CUSTOM_CALIBRATION_CARD">Custom Calibration Target</option>
                    <option value="CUSTOM_FIDUCIAL">Custom Physical Fiducial</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#2D322E]">
                    Physical Width (mm) <span className="text-[#9E432A]">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={widthMm}
                    onChange={(e) => setWidthMm(parseFloat(e.target.value) || 0)}
                    className="w-full h-10 px-3 font-mono text-xs bg-[#FAF8F5] border border-[#E7E3DC] rounded-xl focus:outline-none focus:border-[#52796F] text-[#2D322E]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#2D322E]">
                    Physical Height (mm) <span className="text-[#9E432A]">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={heightMm}
                    onChange={(e) => setHeightMm(parseFloat(e.target.value) || 0)}
                    className="w-full h-10 px-3 font-mono text-xs bg-[#FAF8F5] border border-[#E7E3DC] rounded-xl focus:outline-none focus:border-[#52796F] text-[#2D322E]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#2D322E]">
                    Measurement Accuracy / Tolerance (mm)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={toleranceMm}
                    onChange={(e) => setToleranceMm(parseFloat(e.target.value) || 0)}
                    className="w-full h-10 px-3 font-mono text-xs bg-[#FAF8F5] border border-[#E7E3DC] rounded-xl focus:outline-none focus:border-[#52796F] text-[#2D322E]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#2D322E]">
                    ArUco Marker ID
                  </label>
                  <input
                    type="number"
                    value={markerId}
                    onChange={(e) => setMarkerId(parseInt(e.target.value) || 0)}
                    className="w-full h-10 px-3 font-mono text-xs bg-[#FAF8F5] border border-[#E7E3DC] rounded-xl focus:outline-none focus:border-[#52796F] text-[#2D322E]"
                  />
                </div>
              </div>

              {/* Printable ArUco Marker Generator Preview */}
              <div className="p-4 bg-[#FAF8F5] border border-[#E7E3DC] rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-white border border-[#E7E3DC] rounded-xl flex items-center justify-center p-2 shadow-xs shrink-0">
                    {/* SVG Standard ArUco 4x4 ID 0 pattern */}
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <rect width="100" height="100" fill="black" />
                      <rect x="15" y="15" width="70" height="70" fill="white" />
                      <rect x="25" y="25" width="25" height="25" fill="black" />
                      <rect x="50" y="50" width="25" height="25" fill="black" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#2D322E] block">
                      Printable ArUco 4x4 Calibration Marker (50mm × 50mm)
                    </span>
                    <span className="text-[11px] text-[#7A827B]">
                      Standard certified fiducial pattern supported by OpenCV CV module.
                    </span>
                  </div>
                </div>

                <a
                  href={`data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 100 100"><rect width="100" height="100" fill="black"/><rect x="15" y="15" width="70" height="70" fill="white"/><rect x="25" y="25" width="25" height="25" fill="black"/><rect x="50" y="50" width="25" height="25" fill="black"/><text x="50" y="94" font-size="6" fill="white" text-anchor="middle">50mm x 50mm ArUco ID 0</text></svg>`}
                  download="nirikshak_aruco_50mm_marker.svg"
                  className="h-9 px-3.5 bg-white border border-[#E7E3DC] hover:bg-[#F6F4EE] text-[#335E46] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer shrink-0"
                >
                  <Download className="w-3.5 h-3.5 text-[#52796F]" />
                  <span>Download SVG</span>
                </a>
              </div>

              {/* Reference Image Upload */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#2D322E] block">
                  Reference Object Photograph (Optional)
                </label>
                <div className="border border-dashed border-[#DFDBD3] rounded-xl p-4 bg-[#FAF8F5] text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="ref-image-upload"
                  />
                  <label
                    htmlFor="ref-image-upload"
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E7E3DC] text-xs font-semibold text-[#52796F] rounded-lg shadow-xs cursor-pointer hover:bg-[#F6F4EE]"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload Reference Photo</span>
                  </label>
                  {previewUrl && (
                    <div className="mt-2 font-mono text-[10px] text-[#335E46]">
                      ✓ Image preview attached
                    </div>
                  )}
                </div>
              </div>

              {/* Inspector Mandatory Confirmation */}
              <div className="p-4 bg-[#EBF3EE]/60 border border-[#C7DECF] rounded-xl">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isConfirmed}
                    onChange={(e) => setIsConfirmed(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-[#52796F] rounded border-[#DFDBD3] focus:ring-[#52796F]"
                  />
                  <span className="text-xs font-semibold text-[#2D322E] leading-relaxed">
                    I confirm that the entered physical dimensions (
                    <strong>{widthMm} mm × {heightMm} mm</strong>) correspond precisely to the actual reference object used for physical label inspection.
                  </span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                {activeProfile && (
                  <button
                    type="button"
                    onClick={() => setMode('VIEW')}
                    className="h-10 px-4 bg-white border border-[#E7E3DC] hover:bg-[#FAF8F5] text-[#2D322E] text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleRegister}
                  className="h-10 px-5 bg-[#52796F] hover:bg-[#45665E] text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Register Reference Object</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
