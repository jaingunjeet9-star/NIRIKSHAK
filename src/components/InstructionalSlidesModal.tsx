import { useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Shield,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Ruler,
  Camera,
  Layers,
  AlertTriangle,
  ToggleLeft,
  CheckSquare,
  HelpCircle,
} from 'lucide-react';

interface InstructionalSlidesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function InstructionalSlidesModal({
  isOpen,
  onClose,
  onComplete,
}: InstructionalSlidesModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!isOpen) return null;

  const totalSlides = 10;

  const nextSlide = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-white border border-[#E7E3DC] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Header Bar */}
        <div className="px-6 py-4 bg-[#F6F4EE] border-b border-[#E7E3DC] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#52796F] text-white flex items-center justify-center">
              <Ruler className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-bold text-[#2D322E] tracking-tight">
                Inspector Training: Physical Font-Size Measurement
              </h2>
              <p className="text-[11px] font-medium text-[#7A827B]">
                Legal Metrology Calibration Guide
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="font-mono text-xs font-bold text-[#335E46] bg-[#EBF3EE] px-3 py-1 rounded-full border border-[#C7DECF]">
              {currentSlide + 1} / {totalSlides}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#7A827B] hover:text-[#2D322E] hover:bg-[#E7E3DC] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar Line */}
        <div className="w-full bg-[#E7E3DC] h-1.5">
          <div
            className="bg-[#52796F] h-1.5 transition-all duration-300"
            style={{ width: `${((currentSlide + 1) / totalSlides) * 100}%` }}
          />
        </div>

        {/* Slide Content Body Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {/* SLIDE 1: WHAT IS THE REFERENCE OBJECT? */}
          {currentSlide === 0 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#EBF3EE] border border-[#C7DECF] rounded-lg text-[11px] font-bold text-[#335E46] uppercase tracking-wider">
                Slide 01 — Fundamental Concept
              </div>
              <h3 className="text-2xl font-bold text-[#2D322E]">
                What is the Reference Object?
              </h3>
              <p className="text-sm text-[#535953] leading-relaxed">
                The reference object is a physical object with a <strong>known, verified physical dimension</strong> (e.g. 50 mm × 50 mm ArUco marker or calibration target). NIRIKSHAK uses it as a measurement scale so camera images can be converted from pixels into real-world millimetres.
              </p>

              {/* Diagram */}
              <div className="p-6 bg-[#FAF8F5] border border-[#E7E3DC] rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 text-center">
                <div className="p-4 bg-white border border-[#E7E3DC] rounded-xl shadow-xs w-full md:w-auto flex-1">
                  <div className="w-12 h-12 mx-auto rounded-lg bg-[#52796F]/10 border border-[#52796F]/30 flex items-center justify-center text-[#52796F] font-bold mb-2">
                    50 mm
                  </div>
                  <span className="text-xs font-bold text-[#2D322E] block">REFERENCE OBJECT</span>
                  <span className="text-[11px] text-[#7A827B]">Known physical size</span>
                </div>

                <ArrowRight className="w-6 h-6 text-[#52796F] shrink-0 rotate-90 md:rotate-0" />

                <div className="p-4 bg-white border border-[#E7E3DC] rounded-xl shadow-xs w-full md:w-auto flex-1">
                  <Camera className="w-8 h-8 mx-auto text-[#52796F] mb-2" />
                  <span className="text-xs font-bold text-[#2D322E] block">CAMERA IMAGE</span>
                  <span className="text-[11px] text-[#7A827B]">Captured frame</span>
                </div>

                <ArrowRight className="w-6 h-6 text-[#52796F] shrink-0 rotate-90 md:rotate-0" />

                <div className="p-4 bg-white border border-[#E7E3DC] rounded-xl shadow-xs w-full md:w-auto flex-1">
                  <div className="font-mono text-xs font-bold text-[#335E46] mb-1">
                    Pixels → mm
                  </div>
                  <span className="text-xs font-bold text-[#2D322E] block">CONVERSION SCALE</span>
                  <span className="text-[11px] text-[#7A827B]">Computer Vision</span>
                </div>

                <ArrowRight className="w-6 h-6 text-[#52796F] shrink-0 rotate-90 md:rotate-0" />

                <div className="p-4 bg-[#EBF3EE] border border-[#C7DECF] rounded-xl shadow-xs w-full md:w-auto flex-1">
                  <Ruler className="w-8 h-8 mx-auto text-[#335E46] mb-2" />
                  <span className="text-xs font-bold text-[#335E46] block">PACKAGE TEXT</span>
                  <span className="text-[11px] text-[#335E46]/80 font-medium">True Height (mm)</span>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 2: WHY IS IT NEEDED? */}
          {currentSlide === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#EBF3EE] border border-[#C7DECF] rounded-lg text-[11px] font-bold text-[#335E46] uppercase tracking-wider">
                Slide 02 — Pixel to Millimetre Math
              </div>
              <h3 className="text-2xl font-bold text-[#2D322E]">
                Why is a Physical Reference Needed?
              </h3>
              <p className="text-sm text-[#535953] leading-relaxed">
                A camera sensor records pixels, not millimetres. Without a known physical target in the same photo plane, it is impossible to determine whether text is 1 mm or 5 mm tall.
              </p>

              <div className="p-5 bg-white border border-[#E7E3DC] rounded-2xl space-y-4 shadow-xs">
                <h4 className="text-xs font-bold text-[#7A827B] uppercase tracking-wider">
                  Illustrative Calibration Math Example:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                  <div className="p-3 bg-[#FAF8F5] border border-[#E7E3DC] rounded-xl">
                    <span className="text-[#7A827B] block text-[10px]">REGISTERED REFERENCE</span>
                    <span className="font-bold text-sm text-[#2D322E]">50 mm</span>
                  </div>
                  <div className="p-3 bg-[#FAF8F5] border border-[#E7E3DC] rounded-xl">
                    <span className="text-[#7A827B] block text-[10px]">DETECTED IN IMAGE</span>
                    <span className="font-bold text-sm text-[#2D322E]">300 pixels</span>
                  </div>
                  <div className="p-3 bg-[#EBF3EE] border border-[#C7DECF] rounded-xl">
                    <span className="text-[#335E46] block text-[10px]">CALCULATED SCALE</span>
                    <span className="font-bold text-sm text-[#335E46]">6 pixels / mm</span>
                  </div>
                </div>

                <div className="p-4 bg-[#FAF8F5] border-l-4 border-[#52796F] text-xs space-y-1">
                  <p className="font-bold text-[#2D322E]">
                    Measuring Package Declaration Text:
                  </p>
                  <p className="text-[#535953]">
                    If a letter measures <strong>15 pixels</strong> high in the image:
                  </p>
                  <p className="font-mono text-sm text-[#335E46] font-bold">
                    15 pixels ÷ 6 pixels/mm = 2.5 mm
                  </p>
                </div>
              </div>

              <div className="p-3 bg-[#FFFBEB] border border-[#FCD34D] rounded-xl text-[11px] text-[#92400E] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-[#B45309]" />
                <span>
                  <strong>Note:</strong> Numbers above are illustrative examples. NIRIKSHAK dynamically computes exact sub-pixel scale for every photo.
                </span>
              </div>
            </div>
          )}

          {/* SLIDE 3: HOW TO REGISTER IT */}
          {currentSlide === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#EBF3EE] border border-[#C7DECF] rounded-lg text-[11px] font-bold text-[#335E46] uppercase tracking-wider">
                Slide 03 — Inspector Registration
              </div>
              <h3 className="text-2xl font-bold text-[#2D322E]">
                How to Register Your Reference Object
              </h3>
              <p className="text-sm text-[#535953]">
                Before performing physical font measurements, the inspector registers their specific calibration object once in NIRIKSHAK.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {[
                  { step: '1', title: 'Photograph', desc: 'Upload or capture photo of reference marker card.' },
                  { step: '2', title: 'Enter Dimensions', desc: 'Enter verified width (mm) and height (mm).' },
                  { step: '3', title: 'Set Tolerance', desc: 'Specify measurement accuracy tolerance (e.g. ±0.1 mm).' },
                  { step: '4', title: 'Confirm', desc: 'Check the confirmation box verifying actual physical dimensions.' },
                  { step: '5', title: 'Save Profile', desc: 'NIRIKSHAK activates calibration profile.' },
                ].map((item) => (
                  <div key={item.step} className="p-3 bg-[#FAF8F5] border border-[#E7E3DC] rounded-xl flex flex-col justify-between">
                    <div className="w-6 h-6 rounded-full bg-[#52796F] text-white font-mono font-bold text-xs flex items-center justify-center mb-2">
                      {item.step}
                    </div>
                    <span className="text-xs font-bold text-[#2D322E] block">{item.title}</span>
                    <span className="text-[10px] text-[#7A827B] mt-1 leading-snug">{item.desc}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-white border border-[#E7E3DC] rounded-xl text-xs text-[#535953]">
                <strong className="text-[#2D322E]">Mandatory Audit Rule:</strong> The entered dimensions must be the object’s actual physical size measured by a verified ruler or standard gauge, not an arbitrary estimate.
              </div>
            </div>
          )}

          {/* SLIDE 4: HOW TO USE IT DURING INSPECTION */}
          {currentSlide === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#EBF3EE] border border-[#C7DECF] rounded-lg text-[11px] font-bold text-[#335E46] uppercase tracking-wider">
                Slide 04 — Inspection Workflow
              </div>
              <h3 className="text-2xl font-bold text-[#2D322E]">
                How to Use It During an Inspection
              </h3>
              <p className="text-sm text-[#535953]">
                When <strong>Font Size Verification is ON</strong>, the registered reference object must appear in the exact same photo frame as the package declaration.
              </p>

              <div className="p-6 bg-[#FAF8F5] border border-[#E7E3DC] rounded-2xl text-center space-y-4">
                <div className="max-w-md mx-auto p-4 bg-white border-2 border-dashed border-[#52796F] rounded-xl relative shadow-xs">
                  <div className="flex items-center justify-between mb-3 border-b border-[#E7E3DC] pb-2">
                    <span className="text-[10px] font-bold text-[#52796F] uppercase">Single Photo Field Frame</span>
                    <span className="text-[10px] font-mono text-[#7A827B]">Same Plane</span>
                  </div>
                  <div className="flex items-center justify-around py-4">
                    <div className="p-3 bg-[#EBF3EE] border border-[#C7DECF] rounded-lg text-left">
                      <span className="text-[10px] font-bold text-[#335E46] block">REFERENCE MARKER</span>
                      <span className="text-[9px] text-[#335E46]/80 font-mono">ID: 0 (50mm × 50mm)</span>
                    </div>
                    <span className="font-bold text-xs text-[#7A827B]">+</span>
                    <div className="p-3 bg-white border border-[#E7E3DC] rounded-lg text-left shadow-xs">
                      <span className="text-[10px] font-bold text-[#2D322E] block">PACKAGE DECLARATION</span>
                      <span className="text-[9px] text-[#7A827B]">Net Qty / MRP / Mfg Address</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-left font-mono text-[11px] max-w-xl mx-auto">
                  <div className="p-2 bg-white border border-[#E7E3DC] rounded">1. CV Detects Marker</div>
                  <div className="p-2 bg-white border border-[#E7E3DC] rounded">2. Scale Calculated</div>
                  <div className="p-2 bg-white border border-[#E7E3DC] rounded">3. OCR Reads Text</div>
                  <div className="p-2 bg-[#EBF3EE] border border-[#C7DECF] font-bold text-[#335E46] rounded">4. True Size Measured</div>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 5: CORRECT POSITIONING */}
          {currentSlide === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#EBF3EE] border border-[#C7DECF] rounded-lg text-[11px] font-bold text-[#335E46] uppercase tracking-wider">
                Slide 05 — Physical Alignment
              </div>
              <h3 className="text-2xl font-bold text-[#2D322E]">
                Correct Physical Positioning
              </h3>
              <p className="text-sm text-[#535953]">
                Place the package and reference object flat on a stable surface (table or inspection mat) facing the camera directly.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-white border border-[#E7E3DC] rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-[#335E46] font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-[#335E46]" />
                    <span>RECOMMENDED SETUP</span>
                  </div>
                  <ul className="text-xs text-[#535953] space-y-2 list-disc list-inside">
                    <li>Place reference marker flat on the same surface as package declaration.</li>
                    <li>Keep camera perpendicular to the panel (avoid steep angle).</li>
                    <li>Rest package on a stable platform (table, workbench).</li>
                    <li>Ensure both object and declaration are fully unobscured.</li>
                  </ul>
                </div>

                <div className="p-5 bg-white border border-[#E7E3DC] rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-[#9E432A] font-bold text-sm">
                    <XCircle className="w-5 h-5 text-[#9E432A]" />
                    <span>AVOID INCORRECT SETUP</span>
                  </div>
                  <ul className="text-xs text-[#535953] space-y-2 list-disc list-inside">
                    <li>Holding package in the air at a different depth than reference.</li>
                    <li>Extreme camera tilt or perspective distortion.</li>
                    <li>Covering any corner of the fiducial reference marker.</li>
                    <li>Curved or warped text surfaces where planar math fails.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 6: PHOTO CONDITIONS */}
          {currentSlide === 5 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#EBF3EE] border border-[#C7DECF] rounded-lg text-[11px] font-bold text-[#335E46] uppercase tracking-wider">
                Slide 06 — Do & Don't Photo Quality
              </div>
              <h3 className="text-2xl font-bold text-[#2D322E]">
                Optimal Photo Conditions
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[#EBF3EE]/60 border border-[#C7DECF] rounded-2xl space-y-2">
                  <span className="text-xs font-bold text-[#335E46] uppercase flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#335E46]" /> DO: GOOD CONDITIONS
                  </span>
                  <div className="text-xs text-[#335E46] space-y-1 font-medium">
                    <p>✓ Stable platform & steady camera</p>
                    <p>✓ Uniform, shadow-free lighting</p>
                    <p>✓ Crisp focus with sharp character edges</p>
                    <p>✓ Reference fully visible & unobstructed</p>
                  </div>
                </div>

                <div className="p-4 bg-[#FAECE7]/60 border border-[#F7D0C4] rounded-2xl space-y-2">
                  <span className="text-xs font-bold text-[#9E432A] uppercase flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-[#9E432A]" /> AVOID: BAD CONDITIONS
                  </span>
                  <div className="text-xs text-[#9E432A] space-y-1 font-medium">
                    <p>✗ Blurry or motion-smeared photos</p>
                    <p>✗ Intense plastic glare reflection</p>
                    <p>✗ Partial occlusion of marker or text</p>
                    <p>✗ Reference marker far behind package</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 7: WHAT NIRIKSHAK DOES */}
          {currentSlide === 6 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#EBF3EE] border border-[#C7DECF] rounded-lg text-[11px] font-bold text-[#335E46] uppercase tracking-wider">
                Slide 07 — Computer Vision Pipeline
              </div>
              <h3 className="text-2xl font-bold text-[#2D322E]">
                What NIRIKSHAK Does Automatically
              </h3>
              <p className="text-sm text-[#535953]">
                Once you snap or upload an inspection photo with Font Size Verification enabled, NIRIKSHAK executes this automated multi-stage pipeline:
              </p>

              <div className="space-y-2">
                {[
                  { step: '01', title: 'OpenCV Reference Marker Detection', desc: 'Locates fiducial marker, extracts pixel corners and assesses image quality.' },
                  { step: '02', title: 'Scale & Homography Calibration', desc: 'Computes pixels/mm ratio and verifies coplanar perspective geometry.' },
                  { step: '03', title: 'OCR Declaration Identification', desc: 'Identifies statutory text fields (Net Qty, MRP, Mfg details).' },
                  { step: '04', title: 'Sub-Pixel Glyph Measurement', desc: 'Measures exact visible character height and width in millimetres.' },
                  { step: '05', title: 'Legal Metrology Rules Engine', desc: 'Compares measured height against statutory rule schedule.' },
                  { step: '06', title: 'Compliance Result', desc: 'Generates VERIFIED, NON-COMPLIANT, or MANUAL VERIFICATION findings.' },
                ].map((p) => (
                  <div key={p.step} className="p-3 bg-[#FAF8F5] border border-[#E7E3DC] rounded-xl flex items-center gap-3">
                    <span className="font-mono font-bold text-xs text-[#52796F] bg-white px-2 py-1 rounded border border-[#E7E3DC]">
                      {p.step}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-[#2D322E] block">{p.title}</span>
                      <span className="text-[11px] text-[#7A827B]">{p.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SLIDE 8: WHEN MEASUREMENT CANNOT BE TRUSTED */}
          {currentSlide === 7 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#EBF3EE] border border-[#C7DECF] rounded-lg text-[11px] font-bold text-[#335E46] uppercase tracking-wider">
                Slide 08 — Measurement Safety Guardrails
              </div>
              <h3 className="text-2xl font-bold text-[#2D322E]">
                When Measurement Cannot Be Trusted
              </h3>
              <p className="text-sm text-[#535953]">
                NIRIKSHAK will <strong>NEVER guess</strong> or report uncertain measurements as certified.
              </p>

              <div className="p-5 bg-[#FAECE7] border border-[#F7D0C4] rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-[#9E432A] font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 text-[#9E432A]" />
                  <span>Automatic Fallback to MANUAL VERIFICATION REQUIRED</span>
                </div>
                <p className="text-xs text-[#9E432A] leading-relaxed">
                  If any of the following conditions occur:
                </p>
                <ul className="text-xs text-[#9E432A] space-y-1 list-disc list-inside font-medium">
                  <li>Registered reference marker is missing or unrecognized</li>
                  <li>Image resolution is insufficient for sub-pixel accuracy</li>
                  <li>Severe camera angle tilt invalidates planar geometry</li>
                  <li>Package curvature or warping distorts text surface</li>
                  <li>Fiducial marker is partially covered or damaged</li>
                </ul>
                <div className="mt-3 p-3 bg-white rounded-xl border border-[#F7D0C4] font-mono text-xs text-center text-[#9E432A] font-bold">
                  Result: MANUAL VERIFICATION REQUIRED
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 9: FONT SIZE TOGGLE */}
          {currentSlide === 8 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#EBF3EE] border border-[#C7DECF] rounded-lg text-[11px] font-bold text-[#335E46] uppercase tracking-wider">
                Slide 09 — Scanner Toggle Controls
              </div>
              <h3 className="text-2xl font-bold text-[#2D322E]">
                Font Size Verification Toggle Switch
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-[#FAF8F5] border border-[#E7E3DC] rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-[#7A827B] font-bold text-sm">
                    <ToggleLeft className="w-6 h-6 text-[#7A827B]" />
                    <span>TOGGLE IS OFF</span>
                  </div>
                  <p className="text-xs text-[#535953] leading-relaxed">
                    Physical font measurement pipeline is skipped. Calibration is not attempted, and no reference object is required in the scan photo.
                  </p>
                  <div className="p-2.5 bg-white border border-[#E7E3DC] rounded-lg text-[11px] font-mono font-semibold text-[#7A827B]">
                    Status: MANUAL VERIFICATION REQUIRED
                  </div>
                </div>

                <div className="p-5 bg-[#EBF3EE] border border-[#C7DECF] rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-[#335E46] font-bold text-sm">
                    <ToggleLeft className="w-6 h-6 text-[#335E46] rotate-180" />
                    <span>TOGGLE IS ON</span>
                  </div>
                  <p className="text-xs text-[#335E46] leading-relaxed">
                    Activates OpenCV calibration. Requires an active inspector reference object profile and valid package photo.
                  </p>
                  <div className="p-2.5 bg-white border border-[#C7DECF] rounded-lg text-[11px] font-mono font-semibold text-[#335E46]">
                    Status: VERIFIED / NON-COMPLIANT
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 10: FINAL INSPECTOR CHECK */}
          {currentSlide === 9 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#EBF3EE] border border-[#C7DECF] rounded-lg text-[11px] font-bold text-[#335E46] uppercase tracking-wider">
                Slide 10 — Pre-Inspection Checklist
              </div>
              <h3 className="text-2xl font-bold text-[#2D322E]">
                Pre-Inspection Readiness Checklist
              </h3>
              <p className="text-sm text-[#535953]">
                Verify these steps before capturing packaging images for statutory font compliance verification:
              </p>

              <div className="p-5 bg-[#FAF8F5] border border-[#E7E3DC] rounded-2xl space-y-3">
                {[
                  'Verified reference object available (ArUco / Calibration target)',
                  'Reference object profile registered with true physical dimensions (mm)',
                  'Package and reference placed flat on a stable platform',
                  'Reference object clearly visible in the same frame as declaration',
                  'Adequate lighting with minimal glare or shadows',
                  'Camera held steady and parallel to the principal display panel',
                ].map((check, idx) => (
                  <label key={idx} className="flex items-center gap-3 p-2 bg-white rounded-xl border border-[#E7E3DC] cursor-pointer hover:border-[#52796F] transition-colors">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-[#52796F] rounded border-[#DFDBD3] focus:ring-[#52796F]" />
                    <span className="text-xs font-semibold text-[#2D322E]">{check}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Navigation Footer */}
        <div className="px-6 py-4 bg-[#F6F4EE] border-t border-[#E7E3DC] flex items-center justify-between">
          <button
            type="button"
            disabled={currentSlide === 0}
            onClick={prevSlide}
            className="h-10 px-4 bg-white border border-[#E7E3DC] hover:bg-[#FAF8F5] disabled:opacity-40 text-[#2D322E] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  currentSlide === idx
                    ? 'bg-[#52796F] w-6'
                    : 'bg-[#DFDBD3] hover:bg-[#7A827B]'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={nextSlide}
            className="h-10 px-5 bg-[#52796F] hover:bg-[#45665E] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <span>{currentSlide === totalSlides - 1 ? 'Continue to Setup' : 'Next'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
