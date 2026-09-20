import { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  Info,
  X,
  ExternalLink,
  Flame,
  Droplets,
  HeartPulse,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Scale,
  FileText,
  Search,
} from 'lucide-react';
import {
  ConsumerIngredient,
  ConsumerScanRecord,
  ConsumerBoundingBox,
  NutritionMetric,
} from '../../types/consumerTypes';
import { Language } from '../../lib/i18n';

interface ConsumerResultViewProps {
  scan: ConsumerScanRecord;
  onBackToScanner: () => void;
  language: Language;
}

export function ConsumerResultView({ scan, onBackToScanner, language }: ConsumerResultViewProps) {
  const isHi = language === 'HI';
  const isFood = scan.domain === 'FOOD' || (scan.foodAnalysis != null && scan.domain !== 'COSMETIC');
  const isCosmetic = scan.domain === 'COSMETIC';

  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(1);
  const [selectedIngredient, setSelectedIngredient] = useState<ConsumerIngredient | null>(null);
  const [highlightedBox, setHighlightedBox] = useState<ConsumerBoundingBox | null>(null);
  const [showAllIngredients, setShowAllIngredients] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeWhyTab, setActiveWhyTab] = useState<'EXPLANATION' | 'EVIDENCE' | 'REGULATION'>('EXPLANATION');

  const activeImage = scan.images.find((img) => img.index === activeImageIndex) || scan.images[0];

  const handleHighlight = (box?: ConsumerBoundingBox, imgIndex?: number) => {
    if (box) {
      setHighlightedBox(box);
      setActiveImageIndex(box.imageIndex || imgIndex || 1);
      setShowBoundingBoxes(true);
      // Scroll to package evidence
      const el = document.getElementById('package-evidence-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getNutritionLevelBadge = (level: string) => {
    switch (level) {
      case 'HIGH':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
            {isHi ? 'उच्च' : 'HIGH'}
          </span>
        );
      case 'LOW':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EBF3EE] text-[#2D6A4F] border border-[#C7DECF]">
            {isHi ? 'कम' : 'LOW'}
          </span>
        );
      case 'MODERATE':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
            {isHi ? 'मध्यम' : 'MODERATE'}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]">
            {isHi ? 'उपलब्ध नहीं' : 'NOT AVAILABLE'}
          </span>
        );
    }
  };

  const getConcernBadge = (concern: string) => {
    switch (concern) {
      case 'NO_SPECIFIC_CONCERN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#EBF3EE] text-[#2D6A4F] border border-[#C7DECF]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {isHi ? 'कोई विशिष्ट चिंता नहीं' : 'No specific concern found'}
          </span>
        );
      case 'POTENTIAL_CONCERN':
      case 'RESTRICTED_USAGE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
            <AlertTriangle className="w-3.5 h-3.5" />
            {isHi ? 'ध्यान देने योग्य / सीमित' : 'Potential concern / Restricted'}
          </span>
        );
      case 'PROHIBITED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]">
            <XCircle className="w-3.5 h-3.5" />
            {isHi ? 'प्रतिबंधित' : 'Prohibited'}
          </span>
        );
      case 'NEEDS_CLOSER_LOOK':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB]">
            <HelpCircle className="w-3.5 h-3.5" />
            {isHi ? 'करीब से जांच आवश्यक' : 'Needs a closer look'}
          </span>
        );
    }
  };

  // Extract food or cosmetic analysis
  const food = scan.foodAnalysis;
  const cosmetic = scan.cosmeticAnalysis;

  // Filter ingredients for the directory
  const allIngredients = scan.ingredients || [];
  const categories = Array.from(new Set(allIngredients.map((i) => i.category || 'Main Ingredients')));
  const filteredIngredients =
    selectedCategory === 'ALL'
      ? allIngredients
      : allIngredients.filter((i) => i.category === selectedCategory);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Nav & Reference */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBackToScanner}
          className="inline-flex items-center gap-2 text-sm font-bold text-[#2D6A4F] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isHi ? 'नया उत्पाद स्कैन करें' : 'Scan Another Product'}</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-[#7A827B]">
          <span className="font-mono bg-white px-2.5 py-1 rounded-lg border border-[#E7E3DC] shadow-2xs font-semibold">
            {scan.id}
          </span>
          <span>•</span>
          <span>{new Date(scan.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Primary Consumer Report Header */}
      <div className="bg-white border border-[#E7E3DC] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#F0ECE1]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-[#EBF3EE] text-[#2D6A4F] mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              {isFood ? (isHi ? 'खाद्य उत्पाद जांच' : 'PRODUCT CHECK • FOOD') : (isHi ? 'कॉस्मेटिक उत्पाद जांच' : 'PRODUCT CHECK • COSMETIC')}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B4332] tracking-tight">
              {scan.productName || (isFood ? 'Packaged Food Commodity' : 'Cosmetic Formulation')}
            </h1>
            {scan.brandName && (
              <p className="text-sm font-semibold text-[#52796F] mt-0.5">
                {isHi ? 'ब्रांड:' : 'Brand:'} {scan.brandName}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[#52796F] bg-[#F7F5F0] px-3 py-1.5 rounded-xl border border-[#E7E3DC]">
              {scan.images.length} {isHi ? 'पैकेज तस्वीरें' : 'Package View(s)'}
            </span>
          </div>
        </div>

        {/* Quick Summary Box */}
        <div className="bg-[#FAF8F5] border border-[#E7E3DC] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#1B4332] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#2D6A4F]" />
              {isFood
                ? (isHi ? 'आपका त्वरित सारांश' : 'Nutrition & Ingredient Summary')
                : (isHi ? 'त्वचा एवं सामग्री सारांश' : 'Skin & Ingredient Summary')}
            </h2>
            <span className="text-xs text-[#7A827B] font-medium">
              {isHi ? 'पैकेज जानकारी के आधार पर' : 'Based on package data'}
            </span>
          </div>

          {/* Quick summary badges / bullets */}
          <div className="flex flex-wrap gap-2 pt-1">
            {(isFood ? food?.quickSummary : cosmetic?.quickSummary)?.map((bullet, idx) => (
              <div
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-[#1B4332] border border-[#E7E3DC] shadow-2xs"
              >
                {bullet.toLowerCase().includes('high') || bullet.toLowerCase().includes('contains') || bullet.toLowerCase().includes('fragrance') ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2D6A4F]" />
                )}
                <span>{bullet}</span>
              </div>
            ))}
          </div>

          {/* Overall Natural Summary Paragraph */}
          <p className="text-sm text-[#4A5568] leading-relaxed pt-2 border-t border-[#EDE8DE]">
            {isFood ? food?.overallSummary : cosmetic?.overallSummary}
          </p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* FOOD MODE SECTIONS                                       */}
      {/* ======================================================== */}
      {isFood && food && (
        <>
          {/* Nutrition & Health Profile Grid */}
          <div className="bg-white border border-[#E7E3DC] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#F0ECE1]">
              <div>
                <h2 className="text-xl font-extrabold text-[#1B4332] flex items-center gap-2">
                  <HeartPulse className="w-5 h-5 text-[#2D6A4F]" />
                  {isHi ? 'पोषण एवं स्वास्थ्य प्रोफाइल' : 'Nutrition Profile'}
                </h2>
                <p className="text-xs text-[#52796F] mt-1">
                  {food.nutritionPanel.isPer100gCalculated
                    ? (isHi ? 'प्रति 100 ग्राम गणना की गई है (पैकेज सर्विंग आकार के आधार पर)' : 'Values evaluated per 100g / stated serving from package')
                    : (isHi ? 'पैकेज पोषण तालिका से सीधे प्राप्त मान' : 'Extracted directly from printed nutrition table')}
                </p>
              </div>

              {food.nutritionPanel.boundingBox && (
                <button
                  type="button"
                  onClick={() => handleHighlight(food.nutritionPanel.boundingBox, 1)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2D6A4F] bg-[#EBF3EE] px-3 py-1.5 rounded-xl border border-[#C7DECF] hover:bg-[#D8E8DD] transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{isHi ? 'पैकेज पर पोषण पैनल देखें' : 'View Nutrition Panel on Package'}</span>
                </button>
              )}
            </div>

            {/* Profile Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {food.nutritionProfile.map((item) => (
                <div
                  key={item.key}
                  onClick={() => {
                    if (food.nutritionPanel.boundingBox) handleHighlight(food.nutritionPanel.boundingBox, 1);
                  }}
                  className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E7E3DC] hover:border-[#2D6A4F] transition-all cursor-pointer space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#52796F]">{item.label}</span>
                  </div>
                  <div className="text-xl font-extrabold text-[#1B4332] tracking-tight">
                    {item.valueStr}
                  </div>
                  <div className="pt-1">{getNutritionLevelBadge(item.level)}</div>
                </div>
              ))}
            </div>

            <p className="text-xs text-[#7A827B] italic">
              {isHi
                ? '* पोषण स्तर आधिकारिक मानक बेंचमार्क (FSSAI एवं आहार दिशानिर्देश) पर आधारित हैं। हम कभी भी किसी उत्पाद को 100% स्वस्थ या अस्वस्थ घोषित नहीं करते।'
                : '* Nutrition dimensions reflect standard dietary benchmark thresholds. We provide transparent observations without making absolute health claims.'}
            </p>
          </div>

          {/* Things to Watch vs Good to Know (Two Column) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Things to Watch */}
            <div className="bg-white border border-[#E7E3DC] rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#F0ECE1]">
                <div className="w-8 h-8 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center font-bold">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#1B4332]">
                    {isHi ? 'ध्यान देने योग्य बातें' : 'Things to Watch'}
                  </h3>
                  <p className="text-xs text-[#7A827B]">
                    {isHi ? 'शर्करा, वसा अथवा अन्य मुख्य अवयव' : 'Key points to consider before consumption'}
                  </p>
                </div>
              </div>

              {food.thingsToWatch.length === 0 ? (
                <p className="text-xs text-[#7A827B] italic py-4">
                  {isHi ? 'कोई प्रमुख चिंताजनक बिंदु नहीं मिला।' : 'No major elevated nutrition concerns flagged.'}
                </p>
              ) : (
                <div className="space-y-3">
                  {food.thingsToWatch.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#92400E] flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
                          {item.title}
                        </span>
                        <span className="text-2xs text-[#B45309] uppercase tracking-wider font-semibold">
                          {item.source}
                        </span>
                      </div>
                      <p className="text-xs text-[#78350F] leading-relaxed">{item.explanation}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Good to Know */}
            <div className="bg-white border border-[#E7E3DC] rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#F0ECE1]">
                <div className="w-8 h-8 rounded-xl bg-[#EBF3EE] text-[#2D6A4F] flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#1B4332]">
                    {isHi ? 'जानने योग्य अच्छी बातें' : 'Good to Know'}
                  </h3>
                  <p className="text-xs text-[#7A827B]">
                    {isHi ? 'सकारात्मक पोषण एवं सामग्री साक्ष्य' : 'Factual positive points from packaging data'}
                  </p>
                </div>
              </div>

              {food.goodToKnow.length === 0 ? (
                <p className="text-xs text-[#7A827B] italic py-4">
                  {isHi ? 'कोई विशिष्ट सकारात्मक बिंदु दर्ज नहीं।' : 'No specific positive indicators recorded.'}
                </p>
              ) : (
                <div className="space-y-3">
                  {food.goodToKnow.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-[#F4F9F5] border border-[#D1E7DD] space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1E4620] flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#2D6A4F]" />
                          {item.title}
                        </span>
                      </div>
                      <p className="text-xs text-[#2D6A4F] leading-relaxed">{item.explanation}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Prominent Allergens Section */}
          {food.allergens.length > 0 && (
            <div className="bg-[#FFFDF5] border border-[#FDE68A] rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center font-bold">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#92400E]">
                    {isHi ? 'एलर्जी चेतावनी (Allergens)' : 'Allergen Advisory'}
                  </h3>
                  <p className="text-xs text-[#B45309]">
                    {isHi ? 'पैकेज पर घोषित एलर्जी कारक' : 'Declared allergens detected in ingredients or allergy notice'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                {food.allergens.map((alg, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-white border border-[#FDE68A] space-y-1">
                    <span className="text-xs font-bold text-[#92400E] block">{alg.name}</span>
                    <p className="text-xs text-[#78350F] leading-relaxed">{alg.advice}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ======================================================== */}
      {/* COSMETIC MODE SECTIONS                                   */}
      {/* ======================================================== */}
      {isCosmetic && cosmetic && (
        <>
          {/* Skin Concerns & Good to Know (Two Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Possible Skin Concerns */}
            <div className="bg-white border border-[#E7E3DC] rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#F0ECE1]">
                <div className="w-8 h-8 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center font-bold">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#1B4332]">
                    {isHi ? 'संभावित त्वचा चिंताएं' : 'Possible Skin Concerns'}
                  </h3>
                  <p className="text-xs text-[#7A827B]">
                    {isHi ? 'संवेदनशील त्वचा के लिए ध्यान देने योग्य बिंदु' : 'Fragrance or sensitizers worth noting'}
                  </p>
                </div>
              </div>

              {cosmetic.possibleSkinConcerns.length === 0 ? (
                <div className="p-4 rounded-2xl bg-[#F4F9F5] border border-[#D1E7DD] text-xs text-[#2D6A4F]">
                  <CheckCircle2 className="w-4 h-4 inline mr-1 text-[#2D6A4F]" />
                  {isHi ? 'कोई प्रमुख त्वचा चिंता कारक नहीं मिला।' : 'No major sensitizers or fragrance detected.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {cosmetic.possibleSkinConcerns.map((concern) => (
                    <div
                      key={concern.id}
                      className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#92400E] flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
                          {concern.title}
                        </span>
                        {concern.boundingBox && (
                          <button
                            type="button"
                            onClick={() => handleHighlight(concern.boundingBox)}
                            className="text-2xs font-bold text-[#2D6A4F] hover:underline cursor-pointer"
                          >
                            {isHi ? 'पैकेज पर देखें' : 'View on package'}
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-[#78350F] leading-relaxed">{concern.explanation}</p>
                      <p className="text-2xs text-[#B45309] font-medium pt-1 border-t border-[#FEF3C7]">
                        💡 {concern.advice}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cosmetic Good to Know */}
            <div className="bg-white border border-[#E7E3DC] rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#F0ECE1]">
                <div className="w-8 h-8 rounded-xl bg-[#EBF3EE] text-[#2D6A4F] flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#1B4332]">
                    {isHi ? 'जानने योग्य अच्छी बातें' : 'Good to Know'}
                  </h3>
                  <p className="text-xs text-[#7A827B]">
                    {isHi ? 'मॉइस्चराइजिंग व त्वचा अनुकूल अवयव' : 'Helpful ingredients and positive observations'}
                  </p>
                </div>
              </div>

              {cosmetic.goodToKnow.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-[#F4F9F5] border border-[#D1E7DD] space-y-1.5"
                >
                  <span className="text-xs font-bold text-[#1E4620] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2D6A4F]" />
                    {item.title}
                  </span>
                  <p className="text-xs text-[#2D6A4F] leading-relaxed">{item.explanation}</p>
                </div>
              ))}

              {/* Skin Safety Disclaimer */}
              <div className="p-4 rounded-2xl bg-[#F7F5F0] border border-[#E7E3DC] text-2xs text-[#7A827B] leading-relaxed">
                ℹ️ {cosmetic.disclaimer}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ======================================================== */}
      {/* INGREDIENT FUNCTIONS & DIRECTORY                         */}
      {/* ======================================================== */}
      <div className="bg-white border border-[#E7E3DC] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F0ECE1]">
          <div>
            <h2 className="text-xl font-extrabold text-[#1B4332] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#2D6A4F]" />
              {isFood ? (isHi ? 'सामग्रियां एवं उनका कार्य' : 'Ingredients & Everyday Functions') : (isHi ? 'प्रत्येक सामग्री का क्या कार्य है' : 'What Each Ingredient Does')}
            </h2>
            <p className="text-xs text-[#52796F] mt-1">
              {allIngredients.length} {isHi ? 'सामग्रियां पढ़ी गईं' : 'ingredients detected'} •{' '}
              {allIngredients.filter((i) => i.consumerConcern === 'NO_SPECIFIC_CONCERN').length}{' '}
              {isHi ? 'सामान्य अवयव' : 'with no specific concern found'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAllIngredients(!showAllIngredients)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2D6A4F] bg-[#EBF3EE] px-4 py-2 rounded-xl border border-[#C7DECF] hover:bg-[#D8E8DD] transition-colors cursor-pointer"
            >
              {showAllIngredients ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  <span>{isHi ? 'संक्षिप्त सूची दिखाएं' : 'Show Compact Summary'}</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  <span>{isHi ? 'सभी सामग्रियां देखें' : 'View All Ingredients'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Category Filters */}
        {showAllIngredients && (
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'ALL'
                  ? 'bg-[#2D6A4F] text-white shadow-xs'
                  : 'bg-[#FAF8F5] text-[#52796F] border border-[#E7E3DC] hover:bg-[#F0ECE1]'
              }`}
            >
              {isHi ? 'सभी' : 'All'} ({allIngredients.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#2D6A4F] text-white shadow-xs'
                    : 'bg-[#FAF8F5] text-[#52796F] border border-[#E7E3DC] hover:bg-[#F0ECE1]'
                }`}
              >
                {cat} ({allIngredients.filter((i) => i.category === cat).length})
              </button>
            ))}
          </div>
        )}

        {/* Ingredient Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(showAllIngredients ? filteredIngredients : allIngredients.slice(0, 6)).map((ing) => (
            <div
              key={ing.id}
              className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E7E3DC] hover:border-[#2D6A4F] transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-extrabold text-[#1B4332] tracking-tight">
                      {ing.normalizedName}
                    </h4>
                    <span className="text-2xs font-semibold text-[#52796F] bg-white px-2 py-0.5 rounded border border-[#E7E3DC] inline-block mt-1">
                      {ing.function || ing.category}
                    </span>
                  </div>
                  <div>{getConcernBadge(ing.consumerConcern)}</div>
                </div>

                <p className="text-xs text-[#4A5568] leading-relaxed">
                  {ing.identityDescription || ing.concernExplanation}
                </p>

                {ing.nutritionRelevance && (
                  <p className="text-2xs text-[#2D6A4F] bg-[#EBF3EE] p-2 rounded-xl font-medium">
                    ⚡ {ing.nutritionRelevance}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#EDE8DE] gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedIngredient(ing)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#2D6A4F] hover:underline cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>{isHi ? 'यह क्या है और क्यों?' : 'Why? (Details)'}</span>
                </button>

                {ing.boundingBoxes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleHighlight(ing.boundingBoxes[0], ing.sourceImages[0])}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#52796F] hover:text-[#1B4332] cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isHi ? 'पैकेज पर देखें' : 'View on package'}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {!showAllIngredients && allIngredients.length > 6 && (
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setShowAllIngredients(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2D6A4F] hover:underline cursor-pointer"
            >
              <span>+ {allIngredients.length - 6} {isHi ? 'और सामग्रियां देखें' : 'more ingredients'}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* SECONDARY REGULATORY LAYER                               */}
      {/* ======================================================== */}
      <div className="bg-[#FAF8F5] border border-[#E7E3DC] rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white border border-[#E7E3DC] flex items-center justify-center text-[#2D6A4F]">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#1B4332]">
                {isFood
                  ? (isHi ? 'द्वितीयक FSSAI विनियामक अनुपालन जांच' : 'FSSAI Regulatory Check (Secondary Audit)')
                  : (isHi ? 'द्वितीयक CDSCO विनियामक अनुपालन जांच' : 'CDSCO Cosmetics Rules Check (Secondary Audit)')}
              </h3>
              <p className="text-2xs text-[#7A827B]">
                {isFood
                  ? (isHi ? 'FSSAI खाद्य सुरक्षा एवं मानक अधिनियम, 2006' : 'Verified against FSSAI Food Additives & Labelling Regulations')
                  : (isHi ? 'CDSCO कॉस्मेटिक्स रूल्स, 2020 एवं औषधि व प्रसाधन अधिनियम' : 'Verified against CDSCO Cosmetics Rules, 2020')}
              </p>
            </div>
          </div>

          <span className="text-xs font-bold px-3 py-1 rounded-full bg-white text-[#2D6A4F] border border-[#E7E3DC]">
            {isFood
              ? (food?.regulatorySummary.hasProhibited ? 'Non-Permitted Item Found' : food?.regulatorySummary.hasRestricted ? 'Conditional Limits' : 'Permitted')
              : (cosmetic?.regulatorySummary.hasProhibited ? 'Prohibited Substance' : cosmetic?.regulatorySummary.hasRestricted ? 'Restricted Limits' : 'Permitted')}
          </span>
        </div>

        <p className="text-xs text-[#52796F] leading-relaxed">
          {isFood ? food?.regulatorySummary.message : cosmetic?.regulatorySummary.message}
        </p>
      </div>

      {/* ======================================================== */}
      {/* PACKAGE EVIDENCE INTERACTIVE CANVAS                      */}
      {/* ======================================================== */}
      <div id="package-evidence-section" className="bg-white border border-[#E7E3DC] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F0ECE1]">
          <div>
            <h2 className="text-xl font-extrabold text-[#1B4332] flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#2D6A4F]" />
              {isHi ? 'पैकेज साक्ष्य (Package Evidence)' : 'Package Evidence & Verifiable Text'}
            </h2>
            <p className="text-xs text-[#52796F] mt-1">
              {isHi ? 'यह जानकारी पैकेज पर कहाँ छपी है?' : 'Where on the package did NIRIKSHAK detect this?'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FAF8F5] text-[#1B4332] border border-[#E7E3DC] hover:bg-[#F0ECE1] transition-colors cursor-pointer"
            >
              {showBoundingBoxes ? <EyeOff className="w-3.5 h-3.5 text-[#D97706]" /> : <Eye className="w-3.5 h-3.5 text-[#2D6A4F]" />}
              <span>{showBoundingBoxes ? (isHi ? 'बॉक्स छिपाएं' : 'Hide Highlights') : (isHi ? 'बॉक्स दिखाएं' : 'Show Highlights')}</span>
            </button>
          </div>
        </div>

        {/* Panel Switcher (if >1 image) */}
        {scan.images.length > 1 && (
          <div className="flex gap-2 pb-2 overflow-x-auto">
            {scan.images.map((img) => (
              <button
                key={img.id}
                type="button"
                onClick={() => {
                  setActiveImageIndex(img.index);
                  setHighlightedBox(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeImageIndex === img.index
                    ? 'bg-[#2D6A4F] text-white shadow-xs'
                    : 'bg-[#FAF8F5] text-[#52796F] border border-[#E7E3DC] hover:bg-[#F0ECE1]'
                }`}
              >
                {img.name || `Panel ${img.index}`}
              </button>
            ))}
          </div>
        )}

        {/* Interactive Image Canvas */}
        <div className="relative rounded-2xl overflow-hidden bg-[#1B2A22] flex items-center justify-center p-2 min-h-[380px] max-h-[640px]">
          {activeImage ? (
            <div className="relative max-w-full max-h-full inline-block">
              <img
                src={activeImage.dataUrl}
                alt={`Product Panel ${activeImageIndex}`}
                className="max-h-[600px] w-auto object-contain rounded-xl select-none"
              />

              {/* Bounding Boxes Layer */}
              {showBoundingBoxes && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {/* Highlighted box */}
                  {highlightedBox && (
                    <rect
                      x={`${highlightedBox.x}%`}
                      y={`${highlightedBox.y}%`}
                      width={`${highlightedBox.width}%`}
                      height={`${highlightedBox.height}%`}
                      fill="rgba(45, 106, 79, 0.25)"
                      stroke="#10B981"
                      strokeWidth="3"
                      strokeDasharray="4"
                      className="animate-pulse"
                    />
                  )}

                  {/* All ingredient boxes on active image */}
                  {allIngredients.map((ing) =>
                    ing.boundingBoxes
                      .filter((b) => b.imageIndex === activeImageIndex)
                      .map((box, bIdx) => (
                        <rect
                          key={`${ing.id}-${bIdx}`}
                          x={`${box.x}%`}
                          y={`${box.y}%`}
                          width={`${box.width}%`}
                          height={`${box.height}%`}
                          fill="transparent"
                          stroke={ing.consumerConcern === 'PROHIBITED' ? '#EF4444' : ing.consumerConcern === 'RESTRICTED_USAGE' ? '#F59E0B' : '#3B82F6'}
                          strokeWidth="1.5"
                          opacity="0.75"
                        />
                      ))
                  )}
                </svg>
              )}
            </div>
          ) : (
            <div className="text-white text-xs py-12">No image available</div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* REDESIGNED "WHY?" MODAL                                  */}
      {/* ======================================================== */}
      {selectedIngredient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-[#E7E3DC] rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#F0ECE1]">
              <div>
                <span className="text-2xs font-bold text-[#52796F] tracking-wider uppercase">
                  {selectedIngredient.category || 'Ingredient Information'}
                </span>
                <h3 className="text-xl font-extrabold text-[#1B4332]">
                  {selectedIngredient.normalizedName}
                </h3>
                <p className="text-xs text-[#7A827B] mt-0.5 font-mono">
                  {isHi ? 'पैकेज पर लिखा नाम:' : 'Printed on package as:'} "{selectedIngredient.originalText}"
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedIngredient(null)}
                className="w-8 h-8 rounded-full bg-[#FAF8F5] text-[#7A827B] hover:text-[#1B4332] hover:bg-[#F0ECE1] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs: Plain Explanation vs Evidence vs Regulatory */}
            <div className="flex border-b border-[#E7E3DC] gap-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveWhyTab('EXPLANATION')}
                className={`pb-2.5 transition-colors cursor-pointer ${
                  activeWhyTab === 'EXPLANATION'
                    ? 'text-[#2D6A4F] border-b-2 border-[#2D6A4F]'
                    : 'text-[#7A827B] hover:text-[#1B4332]'
                }`}
              >
                {isHi ? '1. यह क्या है और क्यों?' : '1. Why Am I Seeing This?'}
              </button>
              <button
                type="button"
                onClick={() => setActiveWhyTab('EVIDENCE')}
                className={`pb-2.5 transition-colors cursor-pointer ${
                  activeWhyTab === 'EVIDENCE'
                    ? 'text-[#2D6A4F] border-b-2 border-[#2D6A4F]'
                    : 'text-[#7A827B] hover:text-[#1B4332]'
                }`}
              >
                {isHi ? '2. कैसे जांचा गया?' : '2. How We Checked It'}
              </button>
              <button
                type="button"
                onClick={() => setActiveWhyTab('REGULATION')}
                className={`pb-2.5 transition-colors cursor-pointer ${
                  activeWhyTab === 'REGULATION'
                    ? 'text-[#2D6A4F] border-b-2 border-[#2D6A4F]'
                    : 'text-[#7A827B] hover:text-[#1B4332]'
                }`}
              >
                {isHi ? '3. सरकारी नियम (Secondary)' : '3. Regulatory Source'}
              </button>
            </div>

            {/* Tab 1: Plain-Language Everyday Explanation */}
            {activeWhyTab === 'EXPLANATION' && (
              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-[#1B4332] mb-1">
                    {isHi ? 'यह सामग्री क्या है?' : 'What it is:'}
                  </h4>
                  <p className="text-[#4A5568] leading-relaxed">
                    {selectedIngredient.identityDescription || 'Common dietary or cosmetic ingredient.'}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-[#1B4332] mb-1">
                    {isHi ? 'यह उत्पाद में क्या कार्य करती है?' : 'Everyday purpose / function:'}
                  </h4>
                  <p className="text-[#4A5568] leading-relaxed">
                    {selectedIngredient.function}
                  </p>
                </div>

                {selectedIngredient.nutritionRelevance && (
                  <div>
                    <h4 className="font-bold text-[#1B4332] mb-1">
                      {isHi ? 'पोषण संबंधी प्रभाव:' : 'Why it matters in nutrition:'}
                    </h4>
                    <p className="text-[#2D6A4F] bg-[#EBF3EE] p-3 rounded-xl leading-relaxed">
                      {selectedIngredient.nutritionRelevance}
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="font-bold text-[#1B4332] mb-1">
                    {isHi ? 'सुरक्षा एवं उपभोक्ता सलाह:' : 'Consumer guidance:'}
                  </h4>
                  <p className="text-[#4A5568] leading-relaxed">
                    {selectedIngredient.concernExplanation ||
                      'Standard ingredient. No specific health or safety concern identified under normal consumption or use.'}
                  </p>
                </div>
              </div>
            )}

            {/* Tab 2: How We Checked It */}
            {activeWhyTab === 'EVIDENCE' && (
              <div className="space-y-4 text-xs text-[#4A5568]">
                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E7E3DC] space-y-2">
                  <h4 className="font-bold text-[#1B4332]">
                    {isHi ? 'पैकेज साक्ष्य स्रोत' : 'Package Evidence Verified'}
                  </h4>
                  <p>
                    {isHi ? 'मूल ओसीआर पहचान:' : 'Raw OCR Observation:'} <code className="bg-white px-1.5 py-0.5 rounded border border-[#E7E3DC]">{selectedIngredient.originalText}</code>
                  </p>
                  <p>
                    {isHi ? 'पैकेज पैनल:' : 'Detected on View(s):'}{' '}
                    {selectedIngredient.sourceImages.map((s) => `Image #${s}`).join(', ')}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E7E3DC] space-y-2">
                  <h4 className="font-bold text-[#1B4332]">
                    {isHi ? 'सत्यापन पद्धति' : 'Verification Methodology'}
                  </h4>
                  <p className="leading-relaxed">
                    NIRIKSHAK matched this ingredient against our verified ingredient knowledge base and checked for applicable maximum limits or warnings under Indian statutory schedules.
                  </p>
                </div>
              </div>
            )}

            {/* Tab 3: Regulatory Details (Secondary) */}
            {activeWhyTab === 'REGULATION' && (
              <div className="space-y-3 text-xs text-[#4A5568]">
                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E7E3DC] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1B4332]">
                      {selectedIngredient.regulationName || 'Statutory Regulation'}
                    </span>
                    <span className="font-mono text-2xs text-[#7A827B]">
                      {selectedIngredient.ruleId || 'FSSAI/CDSCO'}
                    </span>
                  </div>

                  {selectedIngredient.maximumLimit && (
                    <p>
                      <strong>{isHi ? 'अधिकतम सीमा:' : 'Statutory Limit:'}</strong> {selectedIngredient.maximumLimit}
                    </p>
                  )}

                  {selectedIngredient.sourceDocument && (
                    <p>
                      <strong>{isHi ? 'गजट दस्तावेज:' : 'Gazette Document:'}</strong> {selectedIngredient.sourceDocument}
                    </p>
                  )}

                  {selectedIngredient.sourceSection && (
                    <p>
                      <strong>{isHi ? 'अनुभाग / शेड्यूल:' : 'Schedule / Section:'}</strong> {selectedIngredient.sourceSection}
                    </p>
                  )}
                </div>

                <p className="text-2xs text-[#7A827B] italic">
                  Note: Regulations specify legal permissions and manufacturing caps. Legal permission is distinct from an individual's personal dietary preference or skin tolerance.
                </p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-4 border-t border-[#F0ECE1] flex items-center justify-between">
              {selectedIngredient.boundingBoxes.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    handleHighlight(selectedIngredient.boundingBoxes[0], selectedIngredient.sourceImages[0]);
                    setSelectedIngredient(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2D6A4F] hover:underline cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>{isHi ? 'पैकेज पर हाइलाइट देखें' : 'View on Package Image'}</span>
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={() => setSelectedIngredient(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#2D6A4F] text-white hover:bg-[#1B4332] transition-colors cursor-pointer"
              >
                {isHi ? 'बंद करें' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
