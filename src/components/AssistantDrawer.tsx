import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { requestJson } from '../lib/api';
import { useTranslation } from '../lib/i18n';
import { StatutoryMessageRenderer, StructuredAssistantResponse, parseRawTextToStructured } from './assistant/StatutoryMessageRenderer';

interface AssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentInspectionId?: string;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  structured?: StructuredAssistantResponse;
  citations?: string[];
  timestamp: string;
  isError?: boolean;
}

export function AssistantDrawer({ isOpen, onClose, currentInspectionId }: AssistantDrawerProps) {
  const { t, language } = useTranslation();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const requestIdCounter = useRef<number>(0);

  // Initialize or re-localize initial greeting on language switch if only 1 msg
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 0 || (prev.length === 1 && prev[0].id === 'init-1')) {
        const greetingText = t('assistant.greetingMsg');
        const langCode = (language === 'HI' ? 'HI' : 'EN') as 'EN' | 'HI';

        return [
          {
            id: 'init-1',
            sender: 'assistant',
            text: greetingText,
            structured: {
              answer: greetingText,
              keyPoints: language === 'HI'
                ? ['पैकेजिंग नियमों और धारा 18/36 पर मार्गदर्शन प्राप्त करें।', 'उत्पाद श्रेणी के अनुसार लागू विधिक आधार जानें।']
                : [
                    'Ask about mandatory label declarations under Rule 6.',
                    'Check category-specific provisions (Cosmetics, Food, Seeds, Chemicals).',
                    'Understand statutory non-compliances and enforcement actions.',
                  ],
              applicableRules: ['LM(PC) Rules 2011', 'Legal Metrology Act 2009'],
              sources: [{ name: 'Department of Consumer Affairs — Legal Metrology' }],
              language: langCode,
            },
            citations: ['LM(PC) Rules 2011', 'Legal Metrology Act 2009'],
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ];
      }
      return prev;
    });
  }, [language, t]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    setErrorBanner(null);
    const thisRequestId = ++requestIdCounter.current;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput('');
    setLoading(true);

    const langCode = (language === 'HI' ? 'HI' : 'EN') as 'EN' | 'HI';

    try {
      const res = await requestJson<{
        answer: string;
        keyPoints?: string[];
        details?: string[];
        applicableRules?: string[];
        sources?: Array<{ name: string; url?: string }>;
        inspectorAction?: string;
        citations?: string[];
        error?: { code: string; message: string };
      }>('/api/assistant/query', {
        method: 'POST',
        body: JSON.stringify({
          query: textToSend.trim(),
          currentInspectionId,
          language,
        }),
      });

      // Race condition protection: Ignore if a newer request was dispatched
      if (thisRequestId !== requestIdCounter.current) return;

      const structuredRes: StructuredAssistantResponse = {
        answer: res.answer,
        keyPoints: res.keyPoints,
        details: res.details,
        applicableRules: res.applicableRules || res.citations || ['LM(PC) Rules 2011'],
        sources: res.sources || [{ name: 'Department of Consumer Affairs — Legal Metrology' }],
        inspectorAction: res.inspectorAction,
        language: langCode,
      };

      const assistantMsg: Message = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text: res.answer,
        structured: structuredRes,
        citations: res.applicableRules || res.citations || ['LM(PC) Rules 2011'],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      if (thisRequestId !== requestIdCounter.current) return;

      console.warn('Assistant API Error:', err);
      let errorMsgText = language === 'HI'
        ? 'वैधानिक सहायक सेवा वर्तमान में उपलब्ध नहीं है। कृपया पुनः प्रयास करें।'
        : 'Statutory Assistant service is temporarily unavailable. Please try again shortly.';

      if (err.status === 401) {
        errorMsgText = language === 'HI'
          ? 'AI सेवा प्रमाणीकरण कॉन्फ़िगर नहीं है।'
          : 'AI statutory service authentication is not configured.';
      } else if (err.status === 429) {
        errorMsgText = language === 'HI'
          ? 'AI सेवा की सीमा समाप्त हो गई है। कृपया थोड़ी देर में प्रयास करें।'
          : 'AI statutory service rate limit reached. Please try again in a few moments.';
      }

      setErrorBanner(errorMsgText);

      const fallbackMsgText = language === 'HI'
        ? 'नियम 6(1) के तहत पैकेज्ड वस्तुओं पर उत्पाद नाम, शुद्ध मात्रा, निर्माण तिथि, MRP और उपभोक्ता शिकायत विवरण अनिवार्य हैं।'
        : 'Rule 6(1) of LM(PC) Rules 2011 mandates declarations for Product Name, Net Quantity, Mfg Date, MRP, and Grievance Contact.';

      const fallbackMsg: Message = {
        id: `ast-err-${Date.now()}`,
        sender: 'assistant',
        text: fallbackMsgText,
        structured: {
          answer: fallbackMsgText,
          keyPoints: language === 'HI'
            ? ['घोषित मूल्य में सभी कर शामिल होने चाहिए।', 'शिकायत अधिकारी का विवरण नियम 6(1)(n) के तहत आवश्यक है।']
            : [
                'MRP must be inclusive of all applicable taxes.',
                'Grievance helpline contact details are mandatory under Rule 6(1)(n).',
              ],
          applicableRules: ['LM(PC) Rules 2011 Rule 6(1)'],
          sources: [{ name: 'Department of Consumer Affairs — Legal Metrology' }],
          language: langCode,
        },
        citations: ['LM(PC) Rules 2011 Rule 6(1)'],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };

      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      if (thisRequestId === requestIdCounter.current) {
        setLoading(false);
      }
    }
  };

  const quickPrompts = [
    t('assistant.q1'),
    t('assistant.q2'),
    t('assistant.q3'),
    t('assistant.q4'),
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] bg-white border-l border-[#E7E3DC] shadow-2xl flex flex-col">
      {/* Drawer Header */}
      <div className="p-4 bg-[#FAF8F5] border-b border-[#E7E3DC] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#EBF3EE] text-[#335E46] flex items-center justify-center border border-[#C7DECF] shadow-2xs">
            <Bot className="w-4 h-4 text-[#52796F]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-[#2D322E]">{t('assistant.drawerTitle')}</h3>
              <span className="px-1.5 py-0.2 bg-[#EBF3EE] border border-[#C7DECF] rounded text-[9px] font-mono font-bold text-[#335E46]">
                STATUTORY AI
              </span>
            </div>
            <p className="text-[10px] font-mono text-[#7A827B]">{t('assistant.drawerSubtitle')}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-lg hover:bg-[#EFECE5] flex items-center justify-center text-[#535953] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Error Banner if any */}
      {errorBanner && (
        <div className="px-4 py-2 bg-[#FAECE7] border-b border-[#F7D0C4] flex items-center justify-between text-xs text-[#9E432A]">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorBanner(null)}
            className="text-[10px] font-bold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#FAF8F5]/40 text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`p-4 rounded-2xl max-w-[90%] leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-[#52796F] text-white rounded-br-xs shadow-xs font-medium'
                  : 'bg-white border border-[#E7E3DC] text-[#2D322E] rounded-bl-xs shadow-xs'
              }`}
            >
              {m.sender === 'user' ? (
                <p className="whitespace-pre-wrap">{m.text}</p>
              ) : (
                <StatutoryMessageRenderer
                  data={m.structured || m.text}
                  citations={m.citations}
                  language={language === 'HI' ? 'HI' : 'EN'}
                />
              )}
            </div>
            <span className="text-[10px] text-[#7A827B] mt-1 px-1 font-mono">{m.timestamp}</span>
          </div>
        ))}

        {/* Loading Indicator */}
        {loading && (
          <div className="p-3 bg-white border border-[#E7E3DC] rounded-xl text-xs text-[#7A827B] flex items-center gap-2.5 shadow-xs">
            <Sparkles className="w-4 h-4 text-[#52796F] animate-spin" />
            <div className="space-y-0.5">
              <span className="font-semibold text-[#2D322E] block">
                {language === 'HI' ? 'वैधानिक स्रोतों का विश्लेषण जारी है...' : 'Analyzing statutory sources...'}
              </span>
              <span className="text-[10px] text-[#7A827B] block font-mono">
                {language === 'HI' ? 'लागू नियम एवं विधिक मानकों की जाँच हो रही है' : 'Evaluating applicable metrology provisions'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions Section */}
      <div className="p-3 bg-[#FAF8F5] border-t border-[#E7E3DC] space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A827B] block">
          {t('assistant.frequentTitle')}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(qp)}
              disabled={loading}
              className="text-[11px] px-2.5 py-1 bg-white border border-[#E7E3DC] hover:border-[#52796F] rounded-lg text-[#535953] hover:text-[#2D322E] text-left transition-colors cursor-pointer disabled:opacity-50"
            >
              {qp}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="p-4 bg-white border-t border-[#E7E3DC]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder={t('assistant.inputPlaceholder')}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1 h-11 px-3.5 bg-[#FAF8F5] border border-[#E7E3DC] rounded-xl text-xs text-[#2D322E] focus:outline-none focus:border-[#52796F] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="h-11 px-4 bg-[#52796F] hover:bg-[#45665E] disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-all shadow-xs cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
