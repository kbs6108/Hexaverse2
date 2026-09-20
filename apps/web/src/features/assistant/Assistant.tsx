/** Bhu-Sahayak — the smart floating helper. Grounded on the app's own APIs:
 * every answer is composed from the caller's masked records (CDM, due diligence, restrictions,
 * fiscal status, active applications); the LLM (Gemini 2.5 Flash / NVIDIA / Rule Engine) reasons
 * and replies warmly with multi-turn conversational context and actionable platform solutions. */
import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Bot,
  Check,
  Copy,
  Maximize2,
  Minimize2,
  RotateCcw,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Field';
import { api, ApiError } from '@/lib/api';
import type { AssistantReply } from '@/lib/cdm';
import { useUI } from '@/lib/store';

interface Msg {
  who: 'me' | 'bot';
  text: string;
  engine?: string;
  sources?: AssistantReply['sources'];
}

const GREETING: Msg = {
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
};

const PROMPT_CATEGORIES = [
  {
    category: 'Problems & Solutions',
    prompts: [
      'My neighbor encroached on my boundary or built a fence',
      'I bought land — how do I transfer ownership (mutation)?',
      'Can I build a house or shop on this plot? Check zoning',
      'Father passed away — how to transfer land to legal heirs?',
      'Is survey no 123/4 safe to buy? Check due diligence',
      'Why is my application delayed and what is the next step?',
    ],
  },
  {
    category: 'How to Do Things',
    prompts: [
      'How to verify seller ownership without leaking private data?',
      'How to check if there is an active court stay or mortgage?',
      'How to download a certified parcel report PDF with QR code?',
      'How does the public statutory notice board work?',
      'What is a 14-digit ULPIN and how do I find my land on the map?',
    ],
  },
];

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

function CopyButton({ text }: { text: string }) {
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
      <span>{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
}

/** Formats text with markdown bold, bullet points, and actionable app links */
function FormattedMessage({
  text,
  isUser,
  onNavigate,
  compact = false,
}: {
  text: string;
  isUser: boolean;
  onNavigate: (path: string) => void;
  compact?: boolean;
}) {
  if (isUser) {
    return <p className="whitespace-pre-wrap">{text}</p>;
  }

  const paragraphs = text.split(/\n\n+/);

  return (
    <div className={compact ? 'space-y-1.5 text-[12.5px] leading-snug' : 'space-y-2 text-[13.5px] leading-relaxed'}>
      {paragraphs.map((p, pIdx) => {
        const lines = p.split('\n');
        return (
          <div key={pIdx} className={compact ? 'space-y-0.5' : 'space-y-1'}>
            {lines.map((line, lIdx) => {
              const isH3 = line.startsWith('### ');
              const cleanH3 = isH3 ? line.replace('### ', '') : line;
              const isBullet = /^\s*[-*•]\s+/.test(cleanH3);
              const cleanLine = isBullet ? cleanH3.replace(/^\s*[-*•]\s+/, '') : cleanH3;

              // Bold & Link parser
              const parts = cleanLine.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
              const content = parts.map((part, partIdx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return (
                    <strong key={partIdx} className="font-semibold text-ink">
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                const linkM = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
                if (linkM && linkM[1] && linkM[2]) {
                  const label = linkM[1];
                  const url = linkM[2];
                  return (
                    <button
                      key={partIdx}
                      type="button"
                      onClick={() => onNavigate(url)}
                      className={`inline-flex items-center gap-1 rounded bg-primary/10 font-semibold text-primary underline-offset-2 hover:bg-primary hover:text-white transition-colors cursor-pointer ${
                        compact ? 'px-1.5 py-0.5 text-[11px]' : 'px-1.5 py-0.5 text-xs'
                      }`}
                    >
                      {label} <ArrowRight size={10} />
                    </button>
                  );
                }
                return <span key={partIdx}>{part}</span>;
              });

              if (isH3) {
                return (
                  <h4 key={lIdx} className={`font-display font-bold text-ink mt-1 ${compact ? 'text-[13px]' : 'text-[14px]'}`}>
                    {content}
                  </h4>
                );
              }

              if (isBullet) {
                return (
                  <div key={lIdx} className="flex items-start gap-1.5 pl-0.5">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                    <span className="flex-1">{content}</span>
                  </div>
                );
              }

              return (
                <p key={lIdx} className="whitespace-pre-wrap">
                  {content}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export default function Assistant() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [msgs, setMsgs] = useState<Msg[]>([GREETING]);
  const [activeCategory, setActiveCategory] = useState<number>(0);
  const [chips, setChips] = useState<string[]>(() =>
    PROMPT_CATEGORIES[0]?.prompts ? [...PROMPT_CATEGORIES[0].prompts] : [],
  );
  const [compact, setCompact] = useState<boolean>(() => {
    try {
      return localStorage.getItem('bhu_sahayak_compact') === 'true';
    } catch {
      return false;
    }
  });

  // Position state for movable icon (default bottom-right)
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
  const select = useUI((s) => s.select);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Resize listener to keep icon on-screen if window resizes
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

  // Save position whenever it updates
  useEffect(() => {
    try {
      localStorage.setItem('bhu_sahayak_btn_pos', JSON.stringify(pos));
    } catch {
      // ignore
    }
  }, [pos]);

  // Global event listener to open assistant from any page (e.g. Guide page callout)
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
      setMsgs((prev) => [...prev, { who: 'bot', text: r.reply, engine: r.engine, sources: r.sources }]);
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
    const t = message.trim();
    if (!t || m.isPending) return;

    // Collect past 8 turns for contextual reasoning
    const history = msgs
      .filter((m) => m !== GREETING)
      .slice(-8)
      .map((m) => ({
        role: m.who === 'me' ? 'user' : 'assistant',
        content: m.text,
      }));

    setMsgs((prev) => [...prev, { who: 'me', text: t }]);
    setText('');
    m.mutate({ message: t, history });
  };

  const handleReset = () => {
    setMsgs([GREETING]);
    setChips(PROMPT_CATEGORIES[0]?.prompts ? [...PROMPT_CATEGORIES[0].prompts] : []);
  };

  const handleNavigate = (path: string) => {
    setOpen(false);
    navigate({ to: path });
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [msgs, m.isPending]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Compute smart dialog placement relative to the movable button
  const isRightHalf = pos.x > (typeof window !== 'undefined' ? window.innerWidth / 2 : 500);
  const isBottomHalf = pos.y > (typeof window !== 'undefined' ? window.innerHeight / 2 : 400);

  const dialogStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 50,
    width: compact ? 'min(26rem, calc(100vw - 2rem))' : 'min(28rem, calc(100vw - 2rem))',
    maxHeight: compact ? 'min(72vh, 560px)' : 'min(78vh, 620px)',
  };

  if (isRightHalf) {
    dialogStyle.right = Math.max(16, window.innerWidth - pos.x - 48);
  } else {
    dialogStyle.left = Math.max(16, pos.x);
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
          aria-label="Bhu-Sahayak assistant"
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
                <h2 className={`font-display font-bold leading-tight text-ink ${compact ? 'text-[14px]' : 'text-[15px]'}`}>Bhu-Sahayak</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-1.5 py-0.2 text-[10px] font-semibold text-primary">
                  <Sparkles size={10} /> AI Guide
                </span>
              </div>
              <p className="truncate text-[11px] text-ink-3">
                {selectedUlpin ? `Parcel ${selectedUlpin} focused` : 'Problem solver & land governance intelligence'}
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
              title={compact ? 'Switch to normal spacious view' : 'Switch to compact high-density view'}
              aria-label="Toggle compact view"
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                compact ? 'bg-primary/15 text-primary' : 'text-ink-3 hover:bg-ground-2 hover:text-ink'
              }`}
            >
              {compact ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              <span className="hidden sm:inline">{compact ? 'Compact' : 'Normal'}</span>
            </button>
            <button
              onClick={handleReset}
              title="Reset conversation & load topics"
              aria-label="New chat"
              className="flex size-7 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-ground-2 hover:text-ink cursor-pointer"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
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
                    <FormattedMessage text={msg.text} isUser={msg.who === 'me'} onNavigate={handleNavigate} compact={compact} />

                    {msg.who === 'bot' && (
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
                                    📍 Sy./ULPIN {s.id}
                                  </button>
                                );
                              }
                              return (
                                <button
                                  key={`${s.kind}-${s.id}`}
                                  type="button"
                                  onClick={() => handleNavigate(s.kind === 'application' ? `/citizen/track` : '/map')}
                                  className="inline-flex items-center gap-1 rounded-full border border-line bg-panel px-2 py-0.5 text-[10.5px] font-medium text-ink-2 hover:border-line-strong hover:text-ink cursor-pointer"
                                >
                                  {s.kind}: {s.id}
                                </button>
                              );
                            })}
                          </div>
                        )}
                        <div className="mt-2 flex items-center justify-between border-t border-line/40 pt-1.5">
                          {engineBadge(msg.engine)}
                          <CopyButton text={msg.text} />
                        </div>
                      </>
                    )}
                  </div>
                </li>
              ))}
              {m.isPending && (
                <li className="flex justify-start">
                  <div className={`flex items-center gap-2.5 rounded-xl rounded-tl-xs border border-line bg-ground-2 text-ink-2 ${compact ? 'px-3 py-2 text-[12px]' : 'px-4 py-3 text-[13px]'}`}>
                    <span className="size-2 animate-ping rounded-full bg-primary" />
                    <span className="font-medium">Diagnosing situation & verified land records…</span>
                  </div>
                </li>
              )}
            </ul>
            <div ref={endRef} />
          </div>

          {/* Quick Problem Solvers & Prompt Library */}
          {!m.isPending && (
            <div className={`border-t border-line bg-ground-1/60 ${compact ? 'px-2.5 py-1.5' : 'px-3 py-2'}`}>
              <div className="mb-1 flex items-center justify-between">
                <div className="flex gap-1">
                  {PROMPT_CATEGORIES.map((cat, idx) => (
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
                <span className="text-[9.5px] text-ink-3 hidden sm:inline">Tap to ask</span>
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
            className={`flex items-center gap-2 border-t border-line bg-panel ${compact ? 'px-2.5 py-2' : 'px-3 py-2.5'}`}
            onSubmit={(e) => {
              e.preventDefault();
              send(text);
            }}
          >
            <Input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={500}
              placeholder="Describe your land problem or ask a question…"
              aria-label="Message Bhu-Sahayak"
              className={compact ? 'text-xs py-1.5' : 'text-sm'}
            />
            <Button
              type="submit"
              size="sm"
              variant="primary"
              disabled={!text.trim() || m.isPending}
              aria-label="Send message"
              className="shrink-0"
            >
              <Send size={13} />
            </Button>
          </form>
        </section>
      )}

      {/* Movable Floating Launcher Icon (Hardware-Accelerated Framer Motion Drag) */}
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
        initial={{ x: pos.x, y: pos.y }}
        animate={{ x: pos.x, y: pos.y }}
        transition={{ duration: 0 }}
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
          const newX = Math.min(Math.max(16, pos.x + info.offset.x), window.innerWidth - 64);
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
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close Bhu-Sahayak assistant' : 'Open Bhu-Sahayak assistant (drag to move)'}
          title={open ? 'Close Assistant' : 'Bhu-Sahayak AI Assistant (Drag to move anywhere)'}
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
