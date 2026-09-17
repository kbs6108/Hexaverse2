/** Bhu-Sahayak — the one floating helper. Grounded on the app's own APIs:
 * every answer is composed from the caller's masked records by the deterministic
 * rule engine; the LLM (when configured) only rephrases. The engine label on each
 * reply keeps that honest. Lazy-loaded from Shell so it costs nothing until opened. */
import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Bot, Send, X } from 'lucide-react';
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
    'Namaste! I am Bhu-Sahayak. Ask me about a parcel ("is survey no 123/4 safe to buy?"), ' +
    'how to apply for something, or the status of an application.',
  engine: 'rules',
};

function engineLabel(engine?: string) {
  if (!engine) return null;
  return engine === 'rules' ? 'rule engine · from your records' : `${engine} · facts from your records`;
}

export default function Assistant() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [msgs, setMsgs] = useState<Msg[]>([GREETING]);
  const [chips, setChips] = useState<string[]>(['Is survey no 123/4 safe to buy?', 'Show my application status']);
  const selectedUlpin = useUI((s) => s.selectedUlpin);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const m = useMutation({
    mutationFn: (message: string) => api.assistant(message, selectedUlpin),
    onSuccess: (r) => {
      setMsgs((prev) => [...prev, { who: 'bot', text: r.reply, engine: r.engine, sources: r.sources }]);
      setChips(r.suggestions);
    },
    onError: (e) => {
      setMsgs((prev) => [
        ...prev,
        { who: 'bot', text: e instanceof ApiError ? `That didn't work: ${e.message}` : 'That request failed — please try again.', engine: 'rules' },
      ]);
    },
  });

  const send = (message: string) => {
    const t = message.trim();
    if (!t || m.isPending) return;
    setMsgs((prev) => [...prev, { who: 'me', text: t }]);
    setText('');
    m.mutate(t);
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
          className="fixed right-4 bottom-16 z-40 flex max-h-[70vh] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-lg border border-line bg-panel shadow-lg"
        >
          <header className="flex items-center gap-2 border-b border-line px-3 py-2">
            <span className="grid size-7 place-items-center rounded-md bg-primary-soft text-primary"><Bot size={16} /></span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold leading-tight">Bhu-Sahayak</h2>
              <p className="truncate text-[11px] text-ink-3">
                {selectedUlpin ? `Talking about parcel ${selectedUlpin}` : 'Answers come from the land records, not guesses'}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="ml-auto flex size-7 items-center justify-center rounded-md text-ink-3 hover:bg-ground-2 hover:text-ink"
            >
              <X size={16} />
            </button>
          </header>

          <div className="scroll-thin flex-1 overflow-y-auto px-3 py-2">
            <ul className="flex flex-col gap-2">
              {msgs.map((msg, i) => (
                <li key={i} className={msg.who === 'me' ? 'flex justify-end' : 'flex justify-start'}>
                  <div
                    className={
                      msg.who === 'me'
                        ? 'max-w-[85%] rounded-lg bg-primary px-3 py-1.5 text-sm text-white'
                        : 'max-w-[85%] rounded-lg border border-line bg-ground-2 px-3 py-1.5 text-sm'
                    }
                  >
                    <p className="whitespace-pre-wrap">{msg.text.replace(/\*\*/g, '')}</p>
                    {msg.who === 'bot' && msg.engine && (
                      <p className="mt-1 text-[10.5px] text-ink-3">{engineLabel(msg.engine)}</p>
                    )}
                  </div>
                </li>
              ))}
              {m.isPending && (
                <li className="flex justify-start">
                  <div className="rounded-lg border border-line bg-ground-2 px-3 py-1.5 text-sm text-ink-3">Checking the records…</div>
                </li>
              )}
            </ul>
            <div ref={endRef} />
          </div>

          {chips.length > 0 && !m.isPending && (
            <div className="flex flex-wrap gap-1.5 border-t border-line px-3 py-2">
              {chips.map((c) => (
                <button
                  key={c}
                  onClick={() => send(c)}
                  className="rounded-full border border-line px-2.5 py-1 text-[11.5px] text-ink-2 transition-colors hover:border-primary hover:text-primary"
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          <form
            className="flex items-center gap-2 border-t border-line px-3 py-2"
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
              placeholder="Ask about a parcel or application…"
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
        className="fixed right-4 bottom-4 z-40 flex size-11 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-105"
      >
        {open ? <X size={20} /> : <Bot size={20} />}
      </button>
    </>
  );
}
