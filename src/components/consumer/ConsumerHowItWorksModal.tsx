import { X, CheckCircle2, Shield, Search, BookOpen, AlertCircle } from 'lucide-react';
import { Language } from '../../lib/i18n';

interface ConsumerHowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export function ConsumerHowItWorksModal({ isOpen, onClose, language }: ConsumerHowItWorksModalProps) {
  if (!isOpen) return null;
  const isHi = language === 'HI';

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#F0ECE1]">
          <div>
            <div className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#2D6A4F] bg-[#EBF3EE] px-2.5 py-0.5 rounded-full border border-[#C7DECF] mb-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{isHi ? 'प्रणाली विवरण' : 'Transparency Guide'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1B4332]">
              {isHi ? 'उपभोक्ता मोड कैसे काम करता है?' : 'How Consumer Mode Works'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF8F5] text-[#7A827B] hover:bg-[#F2F0E8] hover:text-[#2D322E] flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Steps Breakdown */}
        <div className="space-y-4">
          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#FAF8F5] border border-[#E7E3DC]">
            <div className="w-8 h-8 rounded-xl bg-[#2D6A4F] text-white flex items-center justify-center font-bold text-xs shrink-0">
              1
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-[#1B4332]">
                {isHi ? 'सामग्री अनुभाग की पहचान' : 'Ingredient Region Detection'}
              </h3>
              <p className="text-xs text-[#535953] leading-relaxed">
                {isHi
                  ? 'हमारा कंप्यूटर विज़न मॉडल पैकेजिंग पर सामग्री सूची (Ingredients Panel) का पता लगाता है, भले ही शीर्षक छोटा या धुंधला हो।'
                  : 'Our visual model isolates the specific ingredients declaration panel, ignoring irrelevant marketing claims and barcodes.'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#FAF8F5] border border-[#E7E3DC]">
            <div className="w-8 h-8 rounded-xl bg-[#2D6A4F] text-white flex items-center justify-center font-bold text-xs shrink-0">
              2
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-[#1B4332]">
                {isHi ? 'बुद्धिमान सामान्यीकरण (Normalization)' : 'Deterministic Ingredient Normalization'}
              </h3>
              <p className="text-xs text-[#535953] leading-relaxed">
                {isHi
                  ? 'ओसीआर त्रुटियों (जैसे "Niacinamlde") को ठीक किया जाता है और INS/E-कोड (उदा. INS 110) को उनके मानक रासायनिक नामों से मैप किया जाता है।'
                  : 'OCR typos (e.g. "Niacinamlde" -> "Niacinamide") and INS/E-numbers (e.g. INS 110 -> Sunset Yellow FCF) are standardized while preserving the raw photograph text.'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#FAF8F5] border border-[#E7E3DC]">
            <div className="w-8 h-8 rounded-xl bg-[#2D6A4F] text-white flex items-center justify-center font-bold text-xs shrink-0">
              3
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-[#1B4332]">
                {isHi ? 'आधिकारिक सरकारी नियमों से मिलान' : 'Authoritative Rules Verification'}
              </h3>
              <p className="text-xs text-[#535953] leading-relaxed">
                {isHi
                  ? 'खाद्य पदार्थों का मूल्यांकन एफएसएसएआई (FSSAI) मानकों के तहत होता है, और प्रसाधन उत्पादों का मूल्यांकन सीडीएससीओ (CDSCO) प्रसाधन सामग्री नियम 2020 के तहत होता है। कोई एआई कानूनी मनमानी नहीं करता।'
                  : 'Food products are evaluated exclusively under FSSAI rules, and cosmetic items under CDSCO Cosmetics Rules 2020. No generative AI invents legal verdicts.'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A]">
            <div className="w-8 h-8 rounded-xl bg-[#92400E] text-white flex items-center justify-center font-bold text-xs shrink-0">
              4
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-[#78350F]">
                {isHi ? 'अज्ञात ≠ हानिकारक (Unknown Does Not Mean Harmful)' : 'Unknown ≠ Harmful'}
              </h3>
              <p className="text-xs text-[#92400E] leading-relaxed">
                {isHi
                  ? 'यदि कोई घटक डेटाबेस में नहीं मिलता है, तो उसे "अज्ञात / सत्यापन आवश्यक" के रूप में चिह्नित किया जाता है। हम कभी भी किसी अपरिचित घटक को हानिकारक या प्रतिबंधित घोषित नहीं करते।'
                  : 'If an ingredient is absent from the configured database, it is classified as "Unknown / Manual Verification". The system never falsely calls an unknown ingredient harmful or dangerous.'}
              </p>
            </div>
          </div>
        </div>

        {/* Advisory Box */}
        <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#DFDBD3] text-xs text-[#535953] space-y-1">
          <p className="font-bold text-[#2D322E] flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-[#7A827B]" />
            <span>{isHi ? 'स्वास्थ्य व चिकित्सा अस्वीकरण' : 'Health & Medical Advisory'}</span>
          </p>
          <p className="leading-relaxed">
            {isHi
              ? 'यह सुविधा केवल विनियामक जानकारी प्रदान करती है। यह एलर्जी निदान, प्रयोगशाला परीक्षण या व्यक्तिगत चिकित्सा परामर्श का विकल्प नहीं है।'
              : 'This platform provides regulatory information based on published government standards. It does not diagnose allergies, personal health conditions, or replace professional medical advice.'}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full h-11 rounded-xl bg-[#2D6A4F] text-white text-xs font-bold hover:bg-[#1B4332] cursor-pointer"
        >
          {isHi ? 'समझ गया' : 'Got it'}
        </button>
      </div>
    </div>
  );
}
