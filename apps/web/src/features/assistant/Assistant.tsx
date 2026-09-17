/** Bhu-Sahayak — the smart floating helper. Grounded on the app's own APIs:
 * every answer is composed from the caller's masked records (CDM, due diligence, restrictions,
 * fiscal status, active applications); the LLM (Gemini 2.5 Flash / NVIDIA) reasons and replies
 * warmly with multi-turn conversational context. Lazy-loaded from Shell so it costs nothing until opened. */
import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Bot, RotateCcw, Send, Sparkles, X } from 'lucide-react';
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
    'Namaste! I am Bhu-Sahayak, your AI land records assistant. Ask me anything about a parcel ("is survey 123/4 safe to buy?"), check title risks, or track your application status.',
  engine: 'rules',
};

function engineBadge(engine?: string) {
  if (!engine) return null;
  const isGemini = engine.startsWith('gemini');
  const isNvidia = engine.startsWith('nvidia');

  let label = 'Rule engine · Verified records';
  if (isGemini) {
    const model = engine.split(':')[1] || 'Gemini';
    label = `Gemini (${model}) · Live records`;
  } else if (isNvidia) {
    label = 'NVIDIA Nemotron · Live records';
  }

  return (
    <div className="mt-2 flex items-center gap-1.5 text-[10.5px] text-ink-3">
      <span className={`inline-block size-1.5 rounded-full ${isGemini ? 'bg-emerald-500' : 'bg-primary'}`} />
      <span>{label}</span>
    </div>
  );
}

function FormattedMessage({ text, isUser }: { text: string; isUser: boolean }) {
  if (isUser) {
    return <p className="whitespace-pre-wrap">{text}</p>;
  }

  const paragraphs = text.split(/\n\n+/);

  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {paragraphs.map((p, pIdx) => {
        const lines = p.split('\n');
        return (
          <div key={pIdx} className="space-y-1">
            {lines.map((line, lIdx) => {
              const isBullet = /^\s*[-*•]\s+/.test(line);
              const cleanLine = isBullet ? line.replace(/^\s*[-*•]\s+/, '') : line;

              const parts = cleanLine.split(/(\*\*[^*]+\*\*)/g);
              const content = parts.map((part, partIdx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return (
                    <strong key={partIdx} className="font-semibold text-ink">
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                return <span key={partIdx}>{part}</span>;
              });

              if (isBullet) {
                return (
                  <div key={lIdx} className="flex items-start gap-1.5 pl-1">
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
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [msgs, setMsgs] = useState<Msg[]>([GREETING]);
  const [chips, setChips] = useState<string[]>([
    'Is survey no 123/4 safe to buy?',
    'Show my application status',
    'Who owns survey 101/2?',
  ]);
  const selectedUlpin = useUI((s) => s.selectedUlpin);
  const select = useUI((s) => s.select);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

    // Collect the past 8 conversation turns for contextual multi-turn reasoning
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
    setChips(['Is survey no 123/4 safe to buy?', 'Show my application status', 'Who owns survey 101/2?']);
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [msgs, m.isPending]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  return (
    <>
      {open && (
        <section
          aria-label="Bhu-Sahayak assistant"
          className="fixed right-4 bottom-16 z-40 flex max-h-[75vh] w-[min(26rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-line bg-panel shadow-2xl backdrop-blur-md"
        >
          <header className="flex items-center gap-2 border-b border-line bg-ground-1 px-3.5 py-2.5">
            <span className="grid size-7 place-items-center rounded-md bg-primary-soft text-primary">
              <Bot size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-semibold leading-tight text-ink">Bhu-Sahayak</h2>
                <span className="inline-flex items-center gap-1 rounded bg-primary-soft px-1.5 py-0.2 text-[10px] font-medium text-primary">
                  <Sparkles size={10} /> AI
                </span>
              </div>
              <p className="truncate text-[11px] text-ink-3">
                {selectedUlpin ? `Focusing on parcel ${selectedUlpin}` : 'Context-aware land records intelligence'}
              </p>
            </div>
            <button
              onClick={handleReset}
              title="Reset conversation context"
              aria-label="New chat"
              className="flex size-7 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-ground-2 hover:text-ink"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="flex size-7 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-ground-2 hover:text-ink"
            >
              <X size={16} />
            </button>
          </header>

          <div className="scroll-thin flex-1 overflow-y-auto px-3.5 py-3">
            <ul className="flex flex-col gap-3">
              {msgs.map((msg, i) => (
                <li key={i} className={msg.who === 'me' ? 'flex justify-end' : 'flex justify-start'}>
                  <div
                    className={
                      msg.who === 'me'
                        ? 'max-w-[88%] rounded-2xl rounded-br-xs bg-primary px-3.5 py-2 text-sm text-white shadow-xs'
                        : 'max-w-[90%] rounded-2xl rounded-tl-xs border border-line bg-ground-2 px-3.5 py-2.5 text-sm text-ink-2 shadow-xs'
                    }
                  >
                    <FormattedMessage text={msg.text} isUser={msg.who === 'me'} />

                    {msg.who === 'bot' && (
                      <>
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-2.5 flex flex-wrap gap-1 border-t border-line/60 pt-2">
                            {msg.sources.map((s) => {
                              if (s.kind === 'parcel') {
                                return (
                                  <button
                                    key={`parcel-${s.id}`}
                                    type="button"
                                    onClick={() => select(s.id)}
                                    title="Open this parcel in map and drawer"
                                    className="inline-flex items-center gap-1 rounded border border-line bg-panel px-1.5 py-0.5 text-[10.5px] font-medium text-primary transition-colors hover:border-primary"
                                  >
                                    📍 Parcel {s.id}
                                  </button>
                                );
                              }
                              return (
                                <span
                                  key={`${s.kind}-${s.id}`}
                                  className="rounded border border-line bg-panel px-1.5 py-0.5 text-[10.5px] text-ink-3"
                                >
                                  {s.kind}: {s.id}
                                </span>
                              );
                            })}
                          </div>
                        )}
                        {engineBadge(msg.engine)}
                      </>
                    )}
                  </div>
                </li>
              ))}
              {m.isPending && (
                <li className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl rounded-tl-xs border border-line bg-ground-2 px-3.5 py-2.5 text-sm text-ink-3">
                    <span className="size-2 animate-ping rounded-full bg-primary" />
                    <span>Analyzing land records & context…</span>
                  </div>
                </li>
              )}
            </ul>
            <div ref={endRef} />
          </div>

          {chips.length > 0 && !m.isPending && (
            <div className="flex flex-wrap gap-1.5 border-t border-line bg-ground-1/50 px-3 py-2">
              {chips.map((c) => (
                <button
                  key={c}
                  onClick={() => send(c)}
                  className="rounded-full border border-line bg-panel px-2.5 py-1 text-[11.5px] text-ink-2 transition-colors hover:border-primary hover:text-primary"
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          <form
            className="flex items-center gap-2 border-t border-line bg-panel px-3 py-2.5"
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
              placeholder="Ask about a parcel or follow up…"
              aria-label="Message Bhu-Sahayak"
            />
            <Button type="submit" size="sm" variant="primary" disabled={!text.trim() || m.isPending} aria-label="Send">
              <Send size={15} />
            </Button>
          </form>
        </section>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close Bhu-Sahayak assistant' : 'Open Bhu-Sahayak assistant'}
        aria-expanded={open}
        className="fixed right-4 bottom-4 z-40 flex size-11 items-center justify-center rounded-full bg-primary text-white shadow-xl transition-transform hover:scale-105 active:scale-95"
      >
        {open ? <X size={20} /> : <Bot size={20} />}
      </button>
    </>
  );
}

