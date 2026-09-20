import React from 'react';
import {
  ShieldAlert,
  BookOpen,
  FileCheck2,
  AlertTriangle,
  Info,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';

export interface StructuredAssistantResponse {
  answer: string;
  details?: string[];
  applicableRules?: string[];
  sources?: Array<{ name: string; url?: string }>;
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  needsVerification?: boolean;
  responseType?:
    | 'definition'
    | 'statutory_requirement'
    | 'compliance_question'
    | 'violation_explanation'
    | 'product_question'
    | 'rule_lookup'
    | 'procedural_guidance'
    | 'general_question';
  keyPoints?: string[];
  inspectorAction?: string;
  observedEvidence?: string;
  language?: 'EN' | 'HI' | 'HINGLISH';
}

/**
 * Cleanly renders text by parsing inline bold (`**text**`), italic (`*text*`), and code (`` `code` ``)
 * and stripping out all raw Markdown symbols (*, #, ---, `, etc.).
 */
function renderInlineFormatting(text: string): React.ReactNode[] {
  if (!text) return [];

  // Strip raw heading markers, markdown dividers, and stray formatting junk
  const cleaned = text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/---/g, '')
    .replace(/```[a-z]*/gi, '')
    .trim();

  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
  const parts = cleaned.split(regex);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      const inner = part.slice(2, -2).replace(/\*/g, '').trim();
      return (
        <strong key={i} className="font-bold text-[#2D322E]">
          {inner}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      const inner = part.slice(1, -1).replace(/\*/g, '').trim();
      return (
        <em key={i} className="italic text-[#535953]">
          {inner}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code key={i} className="px-1.5 py-0.5 bg-[#FAF8F5] border border-[#E7E3DC] font-mono text-[11px] text-[#335E46] rounded">
          {part.slice(1, -1)}
        </code>
      );
    }
    // Remove any remaining raw asterisks in ordinary text
    return part.replace(/\*/g, '');
  });
}

/**
 * Safely parses unstructured text into a clean structured response with direct 1-sentence lead answer.
 */
export function parseRawTextToStructured(
  rawText: string,
  citations: string[] = [],
  lang: 'EN' | 'HI' | 'HINGLISH' = 'EN'
): StructuredAssistantResponse {
  if (!rawText) {
    return {
      answer: lang === 'HI' ? 'कोई उत्तर उपलब्ध नहीं है।' : 'No response content available.',
      language: lang,
    };
  }

  // Try parsing if rawText is JSON
  const trimmed = rawText.trim();
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('```json') && trimmed.includes('}'))) {
    try {
      const jsonStr = trimmed.match(/\{[\s\S]*\}/)?.[0] || trimmed;
      const parsed = JSON.parse(jsonStr);
      if (parsed.answer) {
        return {
          answer: parsed.answer.replace(/\*/g, '').trim(),
          details: Array.isArray(parsed.details) ? parsed.details.map((d: string) => d.replace(/\*/g, '')) : undefined,
          applicableRules: Array.isArray(parsed.applicableRules) ? parsed.applicableRules : citations,
          sources: Array.isArray(parsed.sources) ? parsed.sources : citations.map((c) => ({ name: c })),
          confidence: parsed.confidence || 'HIGH',
          needsVerification: Boolean(parsed.needsVerification),
          responseType: parsed.responseType || 'general_question',
          keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.map((k: string) => k.replace(/\*/g, '')) : undefined,
          inspectorAction: parsed.inspectorAction ? parsed.inspectorAction.replace(/\*/g, '') : undefined,
          observedEvidence: parsed.observedEvidence ? parsed.observedEvidence.replace(/\*/g, '') : undefined,
          language: lang,
        };
      }
    } catch {}
  }

  // Clean raw text from markdown heading symbols and dividers
  const cleanedRaw = rawText
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/---/g, '')
    .replace(/```[a-z]*/gi, '');

  const lines = cleanedRaw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let answerText = '';
  const keyPoints: string[] = [];
  const details: string[] = [];
  let inspectorAction: string | undefined = undefined;

  lines.forEach((line) => {
    const cleanLine = line.replace(/^#{1,6}\s+/, '').trim();

    if (cleanLine.startsWith('- ') || cleanLine.startsWith('* ') || cleanLine.startsWith('• ') || /^\d+\.\s+/.test(cleanLine)) {
      const itemText = cleanLine.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '').trim();
      if (itemText.toLowerCase().includes('inspector action') || itemText.toLowerCase().includes('अधिकारी') || itemText.toLowerCase().includes('action:')) {
        inspectorAction = itemText;
      } else if (keyPoints.length < 4) {
        keyPoints.push(itemText);
      } else {
        details.push(itemText);
      }
    } else {
      if (!answerText) {
        answerText = cleanLine;
      } else {
        details.push(cleanLine);
      }
    }
  });

  return {
    answer: answerText || lines[0] || rawText,
    keyPoints: keyPoints.length > 0 ? keyPoints : undefined,
    details: details.length > 0 ? details : undefined,
    inspectorAction,
    applicableRules: citations.length > 0 ? citations : undefined,
    sources: citations.map((c) => ({ name: c })),
    language: lang,
  };
}

interface StatutoryMessageRendererProps {
  data: StructuredAssistantResponse | string;
  citations?: string[];
  language?: 'EN' | 'HI' | 'HINGLISH';
}

export function StatutoryMessageRenderer({
  data,
  citations = [],
  language = 'EN',
}: StatutoryMessageRendererProps) {
  const structured: StructuredAssistantResponse =
    typeof data === 'string' ? parseRawTextToStructured(data, citations, language) : data;

  const isHindi = language === 'HI' || structured.language === 'HI';

  // Headings localized
  const labels = {
    keyPoint: isHindi ? 'मुख्य बिंदु' : 'KEY POINT',
    applicableRule: isHindi ? 'विधिक आधार' : 'LEGAL BASIS',
    inspectorAction: isHindi ? 'अधिकारी हेतु निर्देश' : 'INSPECTOR ACTION',
    source: isHindi ? 'सत्यापित स्रोत' : 'SOURCE',
    evidence: isHindi ? 'साक्ष्य अवलोकन' : 'OBSERVED EVIDENCE',
    needsReview: isHindi ? 'भौतिक सत्यापन आवश्यक' : 'PHYSICAL VERIFICATION RECOMMENDED',
  };

  return (
    <div className="space-y-3 text-xs text-[#2D322E] leading-relaxed">
      {/* Needs Verification Callout if uncertain */}
      {structured.needsVerification && (
        <div className="p-2.5 bg-[#FBF3E8] border border-[#EED9C4] rounded-xl flex items-center gap-2 text-[11px] text-[#8C5E2D]">
          <AlertTriangle className="w-4 h-4 shrink-0 text-[#8C5E2D]" />
          <span className="font-semibold">{labels.needsReview}</span>
        </div>
      )}

      {/* Primary Direct Answer Paragraph (Clean 1-sentence lead) */}
      <div className="text-xs sm:text-[13px] font-medium text-[#2D322E] leading-relaxed">
        {renderInlineFormatting(structured.answer)}
      </div>

      {/* Observed Evidence if present */}
      {structured.observedEvidence && (
        <div className="p-3 bg-[#FAECE7]/70 border border-[#F7D0C4] rounded-xl space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E432A] flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            {labels.evidence}
          </span>
          <p className="font-mono text-[11px] text-[#9E432A]">
            {renderInlineFormatting(structured.observedEvidence)}
          </p>
        </div>
      )}

      {/* Key Points Bullets */}
      {structured.keyPoints && structured.keyPoints.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#52796F] flex items-center gap-1">
            <Info className="w-3.5 h-3.5" />
            {labels.keyPoint}
          </span>
          <ul className="space-y-1.5 pl-1">
            {structured.keyPoints.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-[#2D322E]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#52796F] shrink-0 mt-1.5" />
                <span>{renderInlineFormatting(point)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Additional Details */}
      {structured.details && structured.details.length > 0 && (
        <div className="space-y-1.5 pt-1">
          {structured.details.map((detail, idx) => (
            <p key={idx} className="text-xs text-[#535953] leading-relaxed">
              {renderInlineFormatting(detail)}
            </p>
          ))}
        </div>
      )}

      {/* Inspector Action Callout Box */}
      {structured.inspectorAction && (
        <div className="p-3 bg-[#EBF3EE] border border-[#C7DECF] rounded-xl space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#335E46] flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {labels.inspectorAction}
          </span>
          <p className="text-xs text-[#335E46] font-medium leading-relaxed">
            {renderInlineFormatting(structured.inspectorAction)}
          </p>
        </div>
      )}

      {/* Applicable Rules / Legal Basis */}
      {((structured.applicableRules && structured.applicableRules.length > 0) || (citations && citations.length > 0)) && (
        <div className="pt-2 border-t border-[#E7E3DC]/70 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A827B] flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            {labels.applicableRule}
          </span>

          <div className="flex flex-wrap gap-1.5">
            {Array.from(new Set([...(structured.applicableRules || []), ...citations])).map((rule, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-[#FAF8F5] border border-[#E7E3DC] text-[10px] font-mono font-semibold text-[#335E46] rounded flex items-center gap-1"
              >
                <span>§</span>
                <span>{rule}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Source Reference */}
      {structured.sources && structured.sources.length > 0 && (
        <div className="text-[10px] text-[#7A827B] font-mono flex items-center gap-1 pt-0.5">
          <span>{labels.source}:</span>
          <span className="font-semibold text-[#535953]">
            {structured.sources.map((s) => s.name).join(' • ')}
          </span>
        </div>
      )}
    </div>
  );
}
