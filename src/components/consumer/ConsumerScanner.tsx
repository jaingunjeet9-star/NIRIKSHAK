import { useState, useRef, ChangeEvent } from 'react';
import { Upload, Camera, Trash2, LoaderCircle, AlertCircle, Plus, Sparkles, CheckCircle2 } from 'lucide-react';
import { ConsumerScanRecord, ProductDomain } from '../../types/consumerTypes';
import { Language } from '../../lib/i18n';

interface ConsumerScannerProps {
  onScanComplete: (scan: ConsumerScanRecord) => void;
  language: Language;
}

interface SelectedImage {
  id: string;
  dataUrl: string;
  label: string;
  name: string;
}

export function ConsumerScanner({ onScanComplete, language }: ConsumerScannerProps) {
  const isHi = language === 'HI';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<SelectedImage[]>([]);
  const [preferredDomain, setPreferredDomain] = useState<ProductDomain>('UNKNOWN');
  const [isScanning, setIsScanning] = useState(false);
  const [scanningStep, setScanningStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);

    const availableSlots = 4 - images.length;
    if (availableSlots <= 0) {
      setError(isHi ? 'अधिकतम 4 छवियां समर्थित हैं।' : 'Maximum 4 images supported per scan.');
      return;
    }

    const filesToLoad = Array.from(files).slice(0, availableSlots);

    filesToLoad.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        setError(isHi ? 'कृपया वैध छवि फ़ाइल चुनें।' : 'Please select a valid image file.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          setImages((prev) => {
            if (prev.length >= 4) return prev;
            const newIndex = prev.length + 1;
            return [
              ...prev,
              {
                id: `img-${Date.now()}-${Math.random()}`,
                dataUrl,
                name: file.name,
                label:
                  newIndex === 1
                    ? isHi
                      ? 'पैनल 1 (मुख्य सामग्री)'
                      : 'Panel 1 (Main Ingredients)'
                    : newIndex === 2
                    ? isHi
                      ? 'पैनल 2 (पिछला लेबल)'
                      : 'Panel 2 (Back Label)'
                    : `${isHi ? 'पैनल' : 'Panel'} ${newIndex}`,
              },
            ];
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleAnalyze = async () => {
    if (images.length === 0) {
      setError(isHi ? 'कृपया विश्लेषण के लिए कम से कम 1 छवि अपलोड करें।' : 'Please upload at least 1 image to analyze.');
      return;
    }

    setIsScanning(true);
    setError(null);

    try {
      setScanningStep(
        isHi ? 'छवि से सामग्री अनुभाग का पता लगाया जा रहा है...' : 'Locating ingredients panel on packaging...'
      );
      await new Promise((r) => setTimeout(r, 400));

      setScanningStep(
        isHi ? 'रासायनिक नामों व INS/E-कोड का सामान्यीकरण जारी...' : 'Normalizing ingredient tokens & INS codes...'
      );

      const response = await fetch('/api/consumer/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: images.map((img) => ({
            dataUrl: img.dataUrl,
            name: img.name,
            label: img.label,
          })),
          preferredDomain: preferredDomain !== 'UNKNOWN' ? preferredDomain : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze packaging ingredients.');
      }

      setScanningStep(isHi ? 'परिणाम तैयार हैं!' : 'Finalizing regulatory results...');
      await new Promise((r) => setTimeout(r, 300));

      onScanComplete(data.scan);
    } catch (err: any) {
      console.error('[ConsumerScanner Error]:', err);
      setError(err.message || 'An error occurred while scanning ingredients.');
    } finally {
      setIsScanning(false);
      setScanningStep('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header Info */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1B4332]">
          {isHi ? 'सामग्री स्कैनर' : 'Scan Product Ingredients'}
        </h1>
        <p className="text-sm text-[#7A827B]">
          {isHi
            ? 'उत्पाद पैकेजिंग की सामग्री सूची की फोटो लें या अपलोड करें। 1 छवि पर्याप्त है!'
            : 'Capture or upload photos of the ingredient list. 1 image is sufficient! Add up to 4 images if spread across sides.'}
        </p>
      </div>

      {/* Upload Dropzone */}
      <div className="bg-white border-2 border-dashed border-[#C7DECF] rounded-3xl p-8 text-center space-y-6 shadow-xs hover:border-[#2D6A4F] transition-colors">
        <div className="w-16 h-16 rounded-2xl bg-[#EBF3EE] text-[#2D6A4F] mx-auto flex items-center justify-center">
          <Upload className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <h2 className="text-base font-bold text-[#2D322E]">
            {isHi ? 'सामग्री पैनल की फोटो अपलोड करें' : 'Upload photos of the ingredients panel'}
          </h2>
          <p className="text-xs text-[#7A827B]">
            {isHi ? 'PNG, JPG या WEBP (1 से 4 छवियां समर्थित)' : 'Supports PNG, JPG, or WEBP (1 to 4 images supported)'}
          </p>
        </div>

        {/* Buttons: File Picker & Camera */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={images.length >= 4 || isScanning}
            className="px-5 py-2.5 rounded-xl bg-[#2D6A4F] text-white text-xs font-semibold shadow-xs hover:bg-[#1B4332] disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>{isHi ? 'फ़ाइल चुनें' : 'Choose Photo(s)'}</span>
          </button>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={images.length >= 4 || isScanning}
            className="px-5 py-2.5 rounded-xl border border-[#C7DECF] bg-[#EBF3EE] text-[#1B4332] text-xs font-semibold hover:bg-[#D8F3DC] disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>{isHi ? 'कैमरा से लें' : 'Take Photo'}</span>
          </button>
        </div>

        <div className="inline-flex items-center gap-1.5 text-xs text-[#52796F] bg-[#FAF8F5] px-3.5 py-1.5 rounded-full border border-[#DFDBD3]">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#2D6A4F]" />
          <span>{isHi ? '1 छवि पर्याप्त है (बहु-पैनल उत्पादों हेतु 4 तक)' : 'One image is enough (up to 4 for wrap-around labels)'}</span>
        </div>
      </div>

      {/* Uploaded Thumbnails Preview */}
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#535953]">
              {isHi ? `अपलोड की गई छवियां (${images.length}/4)` : `Uploaded Images (${images.length}/4)`}
            </h2>
            {images.length < 4 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-semibold text-[#2D6A4F] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {isHi ? 'एक और पैनल जोड़ें' : 'Add another panel'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {images.map((img, idx) => (
              <div
                key={img.id}
                className="relative rounded-2xl border border-[#E7E3DC] bg-white p-2 shadow-xs group overflow-hidden"
              >
                <img
                  src={img.dataUrl}
                  alt={img.name}
                  className="w-full h-32 object-cover rounded-xl bg-[#FAF8F5]"
                />
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#2D322E] truncate">
                    {img.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(img.id)}
                    className="w-6 h-6 rounded-lg text-[#9E432A] hover:bg-[#FAECE7] flex items-center justify-center cursor-pointer transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="absolute top-3 left-3 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs">
                  #{idx + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Domain Preference Selector (Optional Hint) */}
      <div className="bg-white border border-[#E7E3DC] rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <label className="text-xs font-bold text-[#1B4332]">
            {isHi ? 'उत्पाद श्रेणी (स्वचालित या निर्दिष्ट)' : 'Product Category (Auto-detect or specify)'}
          </label>
          <p className="text-[11px] text-[#7A827B]">
            {isHi
              ? 'खाद्य व प्रसाधन नियमों को अलग रखा जाता है'
              : 'Ensures food additive rules are never mixed with cosmetic rules'}
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-[#FAF8F5] p-1 rounded-xl border border-[#DFDBD3] text-xs font-semibold">
          <button
            type="button"
            onClick={() => setPreferredDomain('UNKNOWN')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
              preferredDomain === 'UNKNOWN' ? 'bg-white text-[#2D6A4F] shadow-xs' : 'text-[#7A827B]'
            }`}
          >
            {isHi ? 'ऑटो-डिटेक्ट' : 'Auto-Detect'}
          </button>
          <button
            type="button"
            onClick={() => setPreferredDomain('FOOD')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
              preferredDomain === 'FOOD' ? 'bg-[#2D6A4F] text-white shadow-xs' : 'text-[#7A827B]'
            }`}
          >
            {isHi ? 'खाद्य (FSSAI)' : 'Food (FSSAI)'}
          </button>
          <button
            type="button"
            onClick={() => setPreferredDomain('COSMETIC')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
              preferredDomain === 'COSMETIC' ? 'bg-[#2D6A4F] text-white shadow-xs' : 'text-[#7A827B]'
            }`}
          >
            {isHi ? 'प्रसाधन (Cosmetics)' : 'Cosmetics (CDSCO)'}
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-[#FAECE7] border border-[#F7D0C4] text-[#9E432A] rounded-2xl p-4 flex items-start gap-3 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">{isHi ? 'स्कैन त्रुटि' : 'Scan Notice'}</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={images.length === 0 || isScanning}
          className="w-full h-14 rounded-2xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-base font-bold shadow-md flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isScanning ? (
            <>
              <LoaderCircle className="w-5 h-5 animate-spin" />
              <span>{scanningStep || (isHi ? 'विश्लेषण जारी...' : 'Analyzing Ingredients...')}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-[#95D5B2]" />
              <span>
                {isHi
                  ? `${images.length > 0 ? images.length : 1} छवि की सामग्री जांचें`
                  : `Analyze Ingredients (${images.length > 0 ? images.length : 1} image)`}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
