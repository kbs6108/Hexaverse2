/** Bhu-Sahayak — the smart floating helper. Grounded on the app's own APIs:
 * every answer is composed from the caller's masked records (CDM, due diligence, restrictions,
 * fiscal status, active applications); the LLM (Gemini 2.5 Flash / NVIDIA / Rule Engine) reasons
 * and replies warmly with multi-turn conversational context and actionable platform solutions. */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Bot,
  Check,
  Copy,
  Maximize2,
  Mic,
  MicOff,
  Minimize2,
  RotateCcw,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { useVoiceSearch, LOCALE_LANG_NAMES } from '@/lib/useVoiceSearch';
import { Button } from '@/components/Button';
import { Input } from '@/components/Field';
import { api, ApiError } from '@/lib/api';
import type { AssistantReply } from '@/lib/cdm';
import { useUI, type Locale } from '@/lib/store';
import { useTranslation } from '@/lib/i18n';

interface Msg {
  who: 'me' | 'bot';
  text: string;
  engine?: string;
  sources?: AssistantReply['sources'];
}

const GREETINGS_BY_LOCALE: Record<Locale, Msg> = {
  en: {
    who: 'bot',
    text:
      '**[Bhu-Sahayak AI Land Assistant]**\n' +
      'Select a common land problem or type any survey number to inspect verified records:\n\n' +
      '• **Encroachment & Demarcation**: [Apply for Boundary Correction](/citizen/request?type=boundary_correction) or check satellite alerts\n' +
      '• **Deed Registration & Mutation**: [Apply for Mutation](/citizen/request?type=mutation) to update your name in revenue records\n' +
      '• **Inheritance & Succession**: [Apply for Succession](/citizen/request?type=succession) for legal heir property reallocation\n' +
      '• **Buyer Due Diligence**: 9-point multi-department clearance audit before purchasing\n' +
      '• **Application Delay**: [Track Application](/citizen/track) to inspect Tahsildar approval milestones\n\n' +
      '💡 *Tip: Mention any survey number (e.g. "survey no 123/4") or 14-digit ULPIN anytime!*',
    engine: 'rules',
  },
  te: {
    who: 'bot',
    text:
      '**[భూ-సహాయక్ (మీ డిజిటల్ భూమి సలహాదారు)]**\n' +
      'నమస్కారం! మీ భూమి హక్కులు, రికార్డులు లేదా సేవలపై సహాయం కోసం ఒక అంశాన్ని ఎంచుకోండి లేదా సర్వే నంబరు టైప్ చేయండి:\n\n' +
      '• **హద్దుల వివాదం & కొలత**: [హద్దుల సవరణ కొరకు దరఖాస్తు](/citizen/request?type=boundary_correction) లేదా ఉపగ్రహ పర్యవేక్షణ\n' +
      '• **రిజిస్ట్రేషన్ & మ్యుటేషన్**: పట్టాదారు పాస్ పుస్తకంలో పేరు నమోదు కొరకు [మ్యుటేషన్ దరఖాస్తు](/citizen/request?type=mutation)\n' +
      '• **వారసత్వ హక్కులు (ఫౌతీ)**: చట్టబద్ధ వారసులకు బదిలీ కొరకు [వారసత్వ దరఖాస్తు](/citizen/request?type=succession)\n' +
      '• **కొనుగోలు రక్షణ తనిఖీ**: భూమి కొనేముందు 6 శాఖల రికార్డుల సమగ్ర 9-అంశాల తనిఖీ\n' +
      '• **దరఖాస్తు స్థితి పరిశీలన**: తహసీల్దార్ ఆమోద దశలను పరిశీలించడానికి [దరఖాస్తు ట్రాక్ చేయండి](/citizen/track)\n\n' +
      '💡 *సూచన: మీ ప్రశ్నలో ఏదైనా సర్వే నంబరు (ఉదా: "సర్వే 123/4") లేదా 14-అంకెల భూ-ఆధార్ (ULPIN) పేర్కొనవచ్చు!*',
    engine: 'rules',
  },
  hi: {
    who: 'bot',
    text:
      '**[भू-सहायक (आपका डिजिटल भूमि मार्गदर्शक)]**\n' +
      'नमस्ते! भूमि अधिकारों, खतौनी, दाखिल-खारिज अथवा सेवाओं हेतु नीचे दिए गए विकल्पों में से चुनें या खसरा संख्या लिखें:\n\n' +
      '• **मेढ़ व सीमा विवाद पैमाइश**: [मेढ़ पैमाइश हेतु आवेदन](/citizen/request?type=boundary_correction) अथवा उपग्रह अलर्ट देखें\n' +
      '• **बैनामा एवं दाखिल-खारिज**: खतौनी में नाम दर्ज कराने हेतु [दाखिल-खारिज आवेदन](/citizen/request?type=mutation)\n' +
      '• **पैतृक वरासत (फौती)**: कानूनी वारिसों के नाम दर्ज करने हेतु [वरासत आवेदन](/citizen/request?type=succession)\n' +
      '• **खरीददार सुरक्षा जांच**: ज़मीन खरीदने से पूर्व 6 विभागों की 9-सूत्रीय राजस्व व कानूनी जांच\n' +
      '• **आवेदन स्थिति जांच**: तहसीलदार स्तर पर प्रगति देखने हेतु [आवेदन ट्रैक करें](/citizen/track)\n\n' +
      '💡 *सुझाव: सवाल पूछते समय कोई भी खसरा संख्या (उदा: "खसरा 123/4") अथवा 14-अंकों का भू-आधार (ULPIN) लिखें!*',
    engine: 'rules',
  },
};

const PROMPT_CATEGORIES_BY_LOCALE: Record<Locale, { category: string; prompts: string[] }[]> = {
  en: [
    {
      category: 'Problems & Solutions',
      prompts: [
        'My neighbor encroached on my boundary or built a fence',
        'I bought land — how do I transfer ownership (mutation)?',
        'Can I build a house or shop on this plot? Check zoning',
        'Father passed away — how to transfer land to legal heirs?',
        'Is survey no 123/4 safe to buy? Check due diligence',
        'Why is my application delayed and what is the next step?',
        'What gets transferred during a full 7D land transfer?',
      ],
    },
    {
      category: 'How to Do Things',
      prompts: [
        'How to verify seller ownership without leaking private data?',
        'How does DPDP privacy masking protect my personal data?',
        'Who approves my mutation? Explain officer hierarchy from VRO to Tahsildar',
        'How does 3D cadastre handle vertical building units and apartments?',
        'How to check if there is an active court stay or mortgage?',
        'How to download a certified parcel report PDF with QR code?',
        'How does the public statutory notice board work?',
        'What is a 14-digit ULPIN and how do I find my land on the map?',
      ],
    },
  ],
  te: [
    {
      category: 'రైతు సమస్యలు & పరిష్కారాలు',
      prompts: [
        'పొరుగు రైతు నా పొలం హద్దులు కబ్జా చేశాడు, ఏమి చేయాలి?',
        'భూమి కొన్నాను — పట్టాదారు పాస్ పుస్తకంలో పేరు ఎలా మార్చాలి (మ్యుటేషన్)?',
        'ఈ స్థలంలో ఇల్లు లేదా దుకాణం కట్టవచ్చా? జోనింగ్ నిబంధనలు ఏమిటి?',
        'కుటుంబ పెద్ద మరణించారు — వారసుల పేరిట భూమి ఎలా మార్చాలి?',
        'సర్వే 123/4 కొనుగోలు చేయడం సురక్షితమేనా? క్లీన్ పట్టానా?',
        'నా దరఖాస్తు ఎందుకు ఆలస్యమైంది? తదుపరి అధికారి ఎవరు?',
      ],
    },
    {
      category: 'సేవలు ఎలా పొందాలి',
      prompts: [
        'రైతు/విక్రేత అసలైన పట్టాదారు అవునో కాదో ఎలా ధృవీకరించాలి?',
        'ఈ భూమిపై బ్యాంకు రుణం లేదా కోర్టు స్టే ఉందో ఎలా తనిఖీ చేయాలి?',
        'ధృవీకృత అధికారిక భూమి నివేదిక (LIR PDF) ఎలా డౌన్‌లోడ్ చేయాలి?',
        'గ్రామ రెవెన్యూ బహిరంగ నోటీసుల బోర్డు ఎలా పనిచేస్తుంది?',
        '14-అంకెల భూ-ఆధార్ (ULPIN) అంటే ఏమిటి? భూపటంలో నా పొలం ఎలా చూడాలి?',
      ],
    },
  ],
  hi: [
    {
      category: 'किसान समस्याएं एवं समाधान',
      prompts: [
        'पड़ोसी ने मेरे खेत की मेढ़ तोड़ दी अथवा कब्ज़ा कर लिया, क्या करें?',
        'ज़मीन खरीदी है — खतौनी में नाम कैसे दर्ज कराएं (दाखिल-खारिज)?',
        'क्या इस भूमि पर मकान या दुकान बना सकते हैं? मास्टर प्लान नियम क्या हैं?',
        'पिताजी के देहांत के बाद पैतृक भूमि वारिसों के नाम कैसे दर्ज कराएं (वरासत)?',
        'क्या खसरा 123/4 खरीदना सुरक्षित है? 9-सूत्रीय जांच करें',
        'मेरा आवेदन क्यों लंबित है और अगला कदम क्या है?',
      ],
    },
    {
      category: 'सेवाएं कैसे प्राप्त करें',
      prompts: [
        'विक्रेता के नाम का खतौनी से सत्यापन कैसे करें?',
        'भूमि पर बैंक बंधक अथवा न्यायालय स्थगन (Stay) की जांच कैसे करें?',
        'प्रमाणित भू-अभिलेख रिपोर्ट (QR कोड सहित LIR) कैसे डाउनलोड करें?',
        'सार्वजनिक नोटिस बोर्ड कैसे कार्य करता है?',
        '14-अंकों का भू-आधार (ULPIN) क्या है और नक्शे पर खेत कैसे देखें?',
      ],
    },
  ],
};

function engineBadge(engine?: string) {
  if (!engine) return null;
  const isGemini = engine.startsWith('gemini');
  const isNvidia = engine.startsWith('nvidia');

  let label = 'Deterministic Rule Engine · Verified Records';
  if (isGemini) {
    const model = engine.split(':')[1] || 'Gemini';
    label = `Gemini (${model}) · Grounded AI`;
  } else if (isNvidia) {
    label = 'NVIDIA Nemotron · Grounded AI';
  }

  return (
    <div className="flex items-center gap-1.5 text-[10px] text-ink-3">
      <span className={`inline-block size-1.5 rounded-full ${isGemini ? 'bg-emerald-500' : 'bg-primary'}`} />
      <span>{label}</span>
    </div>
  );
}

function CopyButton({ text, copyLabel, copiedLabel }: { text: string; copyLabel: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copy response to clipboard"
      aria-label="Copy response"
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-ink-3 transition-colors hover:bg-ground-3 hover:text-ink cursor-pointer"
    >
      {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
      <span>{copied ? copiedLabel : copyLabel}</span>
    </button>
  );
}

/** Formats text with markdown bold, bullet points, actionable app links, and line-by-line streaming */
function FormattedMessage({
  text,
  isUser,
  onNavigate,
  compact = false,
  animateLines = false,
  onLineRevealed,
  onFinishAnimating,
}: {
  text: string;
  isUser: boolean;
  onNavigate: (path: string) => void;
  compact?: boolean;
  animateLines?: boolean;
  onLineRevealed?: () => void;
  onFinishAnimating?: () => void;
}) {
  if (isUser) {
    return <span className="break-words">{text}</span>;
  }

  const allLines = useMemo(() => text.split('\n'), [text]);
  const [visibleCount, setVisibleCount] = useState(() => (animateLines ? 1 : allLines.length));

  useEffect(() => {
    if (!animateLines) {
      setVisibleCount(allLines.length);
      return;
    }

    if (visibleCount < allLines.length) {
      const timer = setTimeout(() => {
        setVisibleCount((prev) => Math.min(prev + 1, allLines.length));
        onLineRevealed?.();
      }, 125); // Smooth 125ms per line reveal
      return () => clearTimeout(timer);
    } else {
      onFinishAnimating?.();
    }
  }, [visibleCount, allLines.length, animateLines, onLineRevealed, onFinishAnimating]);

  const linesToRender = allLines.slice(0, visibleCount);
  const isTyping = animateLines && visibleCount < allLines.length;

  return (
    <div
      onClick={() => {
        if (isTyping) {
          setVisibleCount(allLines.length);
          onFinishAnimating?.();
        }
      }}
      className={`space-y-1.5 leading-relaxed break-words ${compact ? 'text-[12.5px]' : 'text-[13px]'} ${
        isTyping ? 'cursor-pointer select-none' : ''
      }`}
      title={isTyping ? 'Click to reveal all immediately' : undefined}
    >
      {linesToRender.map((line, lIdx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={lIdx} className={compact ? 'h-0.5' : 'h-1'} />;
        }

        const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-');
        const cleanLine = isBullet ? trimmed.replace(/^[•\-]\s*/, '') : trimmed;

        // Parse markdown links [Text](/path) and bold text **Bold**
        const parts = cleanLine.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*)/g);

        const renderedLine = parts.map((part, pIdx) => {
          // Link format: [Label](/url)
          const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
          if (linkMatch && linkMatch[1] && linkMatch[2]) {
            const label = linkMatch[1];
            const href = linkMatch[2];
            const isInternal = href.startsWith('/');
            return (
              <button
                key={pIdx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isInternal) {
                    onNavigate(href);
                  } else {
                    window.open(href, '_blank');
                  }
                }}
                className="inline-flex items-center gap-1 rounded-md bg-primary-soft/80 px-2 py-0.5 font-semibold text-primary underline underline-offset-2 transition-all hover:bg-primary hover:text-white hover:no-underline cursor-pointer shadow-2xs mx-0.5"
              >
                <span>{label}</span>
                <ArrowRight size={10} className="shrink-0 -rotate-45" />
              </button>
            );
          }

          // Bold format: **Text**
          const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);
          if (boldMatch) {
            return (
              <strong key={pIdx} className="font-bold text-ink">
                {boldMatch[1]}
              </strong>
            );
          }

          return <span key={pIdx}>{part}</span>;
        });

        const isLastVisible = lIdx === linesToRender.length - 1;

        if (isBullet) {
          return (
            <motion.div
              key={lIdx}
              initial={animateLines ? { opacity: 0, y: 3 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.16 }}
              className="flex items-start gap-1.5 pl-1 text-ink-2"
            >
              <span className="text-primary font-bold select-none leading-tight mt-0.5">•</span>
              <div className="flex-1">
                {renderedLine}
                {isTyping && isLastVisible && (
                  <span className="inline-block w-1.5 h-3 ml-1 bg-primary/70 animate-pulse align-middle rounded-xs" />
                )}
              </div>
            </motion.div>
          );
        }

        return (
          <motion.p
            key={lIdx}
            initial={animateLines ? { opacity: 0, y: 3 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.16 }}
            className="text-ink-2"
          >
            {renderedLine}
            {isTyping && isLastVisible && (
              <span className="inline-block w-1.5 h-3 ml-1 bg-primary/70 animate-pulse align-middle rounded-xs" />
            )}
          </motion.p>
        );
      })}
    </div>
  );
}

export default function Assistant() {
  const navigate = useNavigate();
  const { t, locale } = useTranslation();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);

  const currentGreeting = GREETINGS_BY_LOCALE[locale] || GREETINGS_BY_LOCALE.en;
  const currentCategories = PROMPT_CATEGORIES_BY_LOCALE[locale] || PROMPT_CATEGORIES_BY_LOCALE.en;

  const [msgs, setMsgs] = useState<Msg[]>([currentGreeting]);
  const [activeCategory, setActiveCategory] = useState<number>(0);
  const [chips, setChips] = useState<string[]>(() =>
    currentCategories[0]?.prompts ? [...currentCategories[0].prompts] : [],
  );

  // When user switches language, refresh initial greeting and suggestions
  useEffect(() => {
    setMsgs((prev) => {
      if (prev.length <= 1) {
        return [GREETINGS_BY_LOCALE[locale] || GREETINGS_BY_LOCALE.en];
      }
      return prev;
    });
    const cats = PROMPT_CATEGORIES_BY_LOCALE[locale] || PROMPT_CATEGORIES_BY_LOCALE.en;
    setChips(cats[0]?.prompts ? [...cats[0].prompts] : []);
  }, [locale]);

  const [compact, setCompact] = useState<boolean>(() => {
    try {
      return localStorage.getItem('bhu_sahayak_compact') === 'true';
    } catch {
      return false;
    }
  });

  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem('bhu_sahayak_btn_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return {
            x: Math.min(Math.max(16, parsed.x), window.innerWidth - 64),
            y: Math.min(Math.max(16, parsed.y), window.innerHeight - 64),
          };
        }
      }
    } catch {
      // ignore
    }
    return {
      x: typeof window !== 'undefined' ? window.innerWidth - 68 : 900,
      y: typeof window !== 'undefined' ? window.innerHeight - 68 : 700,
    };
  });

  const selectedUlpin = useUI((s) => s.selectedUlpin);
  const drawerOpen = useUI((s) => s.drawerOpen);
  const isDrawerOpen = drawerOpen && !!selectedUlpin;
  const select = useUI((s) => s.select);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setPos((p) => ({
        x: Math.min(Math.max(16, p.x), window.innerWidth - 64),
        y: Math.min(Math.max(16, p.y), window.innerHeight - 64),
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('bhu_sahayak_btn_pos', JSON.stringify(pos));
    } catch {
      // ignore
    }
  }, [pos]);

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ prompt?: string }>;
      setOpen(true);
      if (customEvent.detail?.prompt) {
        send(customEvent.detail.prompt);
      }
    };
    window.addEventListener('open-assistant', handleOpen);
    return () => window.removeEventListener('open-assistant', handleOpen);
  }, [msgs]);

  const m = useMutation({
    mutationFn: (vars: { message: string; history: { role: string; content: string }[] }) =>
      api.assistant(vars.message, selectedUlpin, vars.history),
    onSuccess: (r) => {
      setMsgs((prev) => {
        const next: Msg[] = [...prev, { who: 'bot' as const, text: r.reply, engine: r.engine, sources: r.sources }];
        setAnimatingIndex(next.length - 1);
        return next;
      });
      if (r.suggestions && r.suggestions.length > 0) {
        setChips(r.suggestions);
      }
    },
    onError: (e) => {
      setMsgs((prev) => [
        ...prev,
        {
          who: 'bot',
          text: e instanceof ApiError ? `That didn't work: ${e.message}` : 'That request failed — please try again.',
          engine: 'rules',
        },
      ]);
    },
  });

  const send = (message: string) => {
    const trimmed = message.trim();
    if (!trimmed || m.isPending) return;

    const history = msgs
      .filter((msg) => msg !== currentGreeting)
      .slice(-8)
      .map((msg) => ({
        role: msg.who === 'me' ? 'user' : 'assistant',
        content: msg.text,
      }));

    setMsgs((prev) => [...prev, { who: 'me', text: trimmed }]);
    setText('');
    m.mutate({ message: trimmed, history });
  };

  const voice = useVoiceSearch({
    locale,
    silenceDurationMs: 4500, // Stop listening after 4.5 seconds of silence
    onFinalTranscript: (meaningfulQuery) => {
      if (meaningfulQuery.trim()) {
        setText(meaningfulQuery);
        // Do not send automatically - user will review and send manually
      }
    },
    onInterimTranscript: (interimQuery) => {
      if (interimQuery.trim()) {
        setText(interimQuery);
      }
    },
  });

  const handleReset = () => {
    setAnimatingIndex(null);
    setMsgs([GREETINGS_BY_LOCALE[locale] || GREETINGS_BY_LOCALE.en]);
    const cats = PROMPT_CATEGORIES_BY_LOCALE[locale] || PROMPT_CATEGORIES_BY_LOCALE.en;
    setChips(cats[0]?.prompts ? [...cats[0].prompts] : []);
  };

  const handleNavigate = (path: string) => {
    setOpen(false);
    navigate({ to: path });
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [msgs, m.isPending, animatingIndex]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const targetX =
    isDrawerOpen && typeof window !== 'undefined' && pos.x > window.innerWidth - 520
      ? Math.max(16, window.innerWidth - 540)
      : pos.x;

  const isRightHalf = targetX > (typeof window !== 'undefined' ? window.innerWidth / 2 : 500);
  const isBottomHalf = pos.y > (typeof window !== 'undefined' ? window.innerHeight / 2 : 400);

  const dialogStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 50,
    width: compact ? 'min(26rem, calc(100vw - 2rem))' : 'min(28rem, calc(100vw - 2rem))',
    maxHeight: compact ? 'min(72vh, 560px)' : 'min(78vh, 620px)',
  };

  if (isRightHalf) {
    dialogStyle.right = Math.max(16, window.innerWidth - targetX - 48);
  } else {
    dialogStyle.left = Math.max(16, targetX);
  }

  if (isBottomHalf) {
    dialogStyle.bottom = Math.max(16, window.innerHeight - pos.y + 12);
  } else {
    dialogStyle.top = Math.max(16, pos.y + 56);
  }

  return (
    <>
      {open && (
        <section
          aria-label={t('ai.title')}
          style={dialogStyle}
          className="flex flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <header className={`flex items-center gap-2 border-b border-line bg-ground-1 ${compact ? 'px-3 py-2' : 'px-4 py-3'}`}>
            <span className={`grid place-items-center rounded-xl bg-primary text-white shadow-xs ${compact ? 'size-7' : 'size-8'}`}>
              <Bot size={compact ? 16 : 18} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h2 className={`font-display font-bold leading-tight text-ink ${compact ? 'text-[14px]' : 'text-[15px]'}`}>
                  {t('ai.title')}
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-1.5 py-0.2 text-[10px] font-semibold text-primary">
                  <Sparkles size={10} /> AI
                </span>
              </div>
              <p className="truncate text-[11px] text-ink-3">
                {selectedUlpin ? `${t('common.surveyNo')} ${selectedUlpin}` : t('ai.subtitle')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setCompact((c) => {
                  const next = !c;
                  try {
                    localStorage.setItem('bhu_sahayak_compact', String(next));
                  } catch {}
                  return next;
                });
              }}
              title={t('ai.compactView')}
              aria-label={t('ai.compactView')}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                compact ? 'bg-primary/15 text-primary' : 'text-ink-3 hover:bg-ground-2 hover:text-ink'
              }`}
            >
              {compact ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              <span className="hidden sm:inline">{compact ? 'Compact' : 'Normal'}</span>
            </button>
            <button
              onClick={handleReset}
              title={t('ai.newChat')}
              aria-label={t('ai.newChat')}
              className="flex size-7 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-ground-2 hover:text-ink cursor-pointer"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={() => {
                voice.cancelListening();
                setOpen(false);
              }}
              aria-label={t('common.close')}
              className="flex size-7 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-ground-2 hover:text-ink cursor-pointer"
            >
              <X size={16} />
            </button>
          </header>

          {/* Messages list */}
          <div className={`scroll-thin flex-1 overflow-y-auto ${compact ? 'px-3 py-2.5' : 'px-4 py-3.5'}`}>
            <ul className={`flex flex-col ${compact ? 'gap-2' : 'gap-3.5'}`}>
              {msgs.map((msg, i) => (
                <li key={i} className={msg.who === 'me' ? 'flex justify-end' : 'flex justify-start'}>
                  <div
                    className={
                      msg.who === 'me'
                        ? `${compact ? 'max-w-[88%] rounded-xl rounded-br-xs px-3 py-1.5 text-[12.5px]' : 'max-w-[88%] rounded-2xl rounded-br-xs px-4 py-2.5 text-[13.5px]'} bg-primary text-white shadow-xs`
                        : `${compact ? 'max-w-[94%] rounded-xl rounded-tl-xs px-3 py-2 text-[12.5px]' : 'max-w-[92%] rounded-2xl rounded-tl-xs px-4 py-3 text-[13.5px]'} border border-line bg-ground-2 text-ink-2 shadow-xs`
                    }
                  >
                    <FormattedMessage
                      text={msg.text}
                      isUser={msg.who === 'me'}
                      onNavigate={handleNavigate}
                      compact={compact}
                      animateLines={msg.who === 'bot' && animatingIndex === i}
                      onLineRevealed={() => endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })}
                      onFinishAnimating={() => {
                        if (animatingIndex === i) {
                          setAnimatingIndex(null);
                        }
                      }}
                    />

                    {msg.who === 'bot' && animatingIndex !== i && (
                      <>
                        {msg.sources && msg.sources.length > 0 && (
                          <div className={`mt-2 flex flex-wrap items-center gap-1.5 border-t border-line/60 ${compact ? 'pt-1.5' : 'pt-2.5'}`}>
                            <span className="text-[10px] font-semibold uppercase text-ink-3 tracking-wider">Grounding:</span>
                            {msg.sources.map((s) => {
                              if (s.kind === 'parcel') {
                                return (
                                  <button
                                    key={`parcel-${s.id}`}
                                    type="button"
                                    onClick={() => select(s.id)}
                                    title="Open this parcel in map and profile drawer"
                                    className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-panel px-2 py-0.5 text-[10.5px] font-semibold text-primary transition-colors hover:bg-primary hover:text-white cursor-pointer"
                                  >
                                    <span>Sy. {s.label ?? s.id}</span>
                                  </button>
                                );
                              }
                              return (
                                <span
                                  key={`src-${s.id}`}
                                  className="rounded-full bg-ground-3 px-2 py-0.5 text-[10.5px] text-ink-3"
                                >
                                  {s.label ?? s.id}
                                </span>
                              );
                            })}
                          </div>
                        )}

                        <div className={`mt-2 flex items-center justify-between border-t border-line/40 ${compact ? 'pt-1' : 'pt-1.5'}`}>
                          {engineBadge(msg.engine)}
                          <CopyButton text={msg.text} copyLabel={t('ai.copyResponse')} copiedLabel={t('ai.copied')} />
                        </div>
                      </>
                    )}
                  </div>
                </li>
              ))}

              {m.isPending && (
                <li className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl border border-line bg-ground-2 px-3 py-2 text-xs text-ink-3">
                    <span className="inline-block size-2 animate-pulse rounded-full bg-primary" />
                    <span>{t('common.loading')}</span>
                  </div>
                </li>
              )}
              <div ref={endRef} />
            </ul>
          </div>

          {/* Prompt Topics & Quick Suggestions */}
          {chips.length > 0 && (
            <div className={`border-t border-line bg-ground-1 ${compact ? 'p-2' : 'p-2.5'}`}>
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <div className="flex items-center gap-1 overflow-x-auto scroll-thin">
                  {currentCategories.map((cat, idx) => (
                    <button
                      key={cat.category}
                      type="button"
                      onClick={() => {
                        setActiveCategory(idx);
                        setChips(cat.prompts ? [...cat.prompts] : []);
                      }}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors cursor-pointer ${
                        activeCategory === idx
                          ? 'bg-primary text-white shadow-xs'
                          : 'text-ink-3 hover:bg-ground-2 hover:text-ink'
                      }`}
                    >
                      {cat.category}
                    </button>
                  ))}
                </div>
              </div>
              <div className={`flex flex-wrap gap-1.5 overflow-y-auto scroll-thin py-0.5 ${compact ? 'max-h-20' : 'max-h-24'}`}>
                {chips.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => send(c)}
                    className={`rounded-full border border-line bg-panel text-left font-medium text-ink-2 transition-all hover:border-primary hover:bg-primary-soft/40 hover:text-primary shadow-xs active:scale-[0.98] cursor-pointer ${
                      compact ? 'px-2 py-0.5 text-[10.5px]' : 'px-2.5 py-1 text-[11.5px]'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Form */}
          <form
            className={`flex items-center gap-1.5 border-t border-line bg-panel ${compact ? 'px-2.5 py-2' : 'px-3 py-2.5'}`}
            onSubmit={(e) => {
              e.preventDefault();
              voice.stopListening();
              send(text);
            }}
          >
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={500}
                placeholder={voice.isListening ? t('ai.voiceListening') : t('ai.placeholder')}
                aria-label={t('ai.title')}
                className={compact ? 'text-xs py-1.5 pr-14' : 'text-sm pr-14'}
              />
              {voice.isListening && voice.silenceSecondsRemaining !== null && (
                <span
                  title={t('ai.voiceSilenceHint')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary pointer-events-none"
                >
                  ⏱ {voice.silenceSecondsRemaining}s
                </span>
              )}
            </div>

            {/* Voice Search Button */}
            <button
              type="button"
              onClick={() => {
                if (voice.isListening) {
                  voice.stopListening();
                } else {
                  voice.startListening();
                }
              }}
              title={
                voice.isSupported
                  ? `${t('ai.voiceSearch')} (${LOCALE_LANG_NAMES[locale]?.nativeName || locale})`
                  : t('ai.voiceNotSupported')
              }
              aria-label={t('ai.voiceSearch')}
              className={`flex items-center justify-center rounded-lg border transition-all shrink-0 cursor-pointer ${
                compact ? 'size-7' : 'size-8'
              } ${
                voice.isListening
                  ? 'bg-brick text-white border-brick shadow-xs animate-pulse ring-2 ring-brick/30'
                  : 'border-line bg-ground-2 text-ink-2 hover:bg-primary-soft/60 hover:text-primary hover:border-primary/40 active:scale-95'
              }`}
            >
              {voice.isListening ? <MicOff size={compact ? 13 : 15} /> : <Mic size={compact ? 13 : 15} />}
            </button>

            <Button
              type="submit"
              size="sm"
              variant="primary"
              disabled={!text.trim() || m.isPending}
              aria-label={t('common.submit')}
              className="shrink-0"
            >
              <Send size={13} />
            </Button>
          </form>
        </section>
      )}

      {/* Movable Floating Launcher Icon */}
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0}
        dragConstraints={{
          left: 16,
          right: typeof window !== 'undefined' ? window.innerWidth - 64 : 1000,
          top: 16,
          bottom: typeof window !== 'undefined' ? window.innerHeight - 64 : 800,
        }}
        initial={{ x: targetX, y: pos.y }}
        animate={{ x: targetX, y: pos.y }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 50,
          touchAction: 'none',
        }}
        whileDrag={{ scale: 1.1, cursor: 'grabbing' }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onDragEnd={(_, info) => {
          const newX = Math.min(Math.max(16, targetX + info.offset.x), window.innerWidth - 64);
          const newY = Math.min(Math.max(16, pos.y + info.offset.y), window.innerHeight - 64);
          setPos({ x: newX, y: newY });
          try {
            localStorage.setItem('bhu_sahayak_btn_pos', JSON.stringify({ x: newX, y: newY }));
          } catch {
            // ignore
          }
        }}
        className="cursor-grab select-none pointer-events-auto"
      >
        <button
          type="button"
          onClick={() =>
            setOpen((v) => {
              if (v) voice.cancelListening();
              return !v;
            })
          }
          aria-label={open ? t('common.close') : t('ai.title')}
          title={open ? t('common.close') : t('ai.title')}
          aria-expanded={open}
          className="flex size-12 items-center justify-center rounded-full bg-primary text-white shadow-2xl ring-4 ring-primary/20 pointer-events-auto cursor-pointer focus:outline-none"
        >
          <span className="relative flex items-center justify-center">
            {open ? <X size={22} /> : <Bot size={22} />}
            <span className="absolute -top-1 -right-1 flex size-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-3 rounded-full bg-emerald-500 ring-2 ring-panel" />
            </span>
          </span>
        </button>
      </motion.div>
    </>
  );
}
