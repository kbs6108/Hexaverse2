import { create } from 'zustand';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';

type Kind = 'info' | 'success' | 'error';
interface ToastItem {
  id: number;
  kind: Kind;
  title: string;
  body?: string;
}
interface ToastState {
  items: ToastItem[];
  push: (kind: Kind, title: string, body?: string) => void;
  dismiss: (id: number) => void;
}

let seq = 1;
export const useToast = create<ToastState>((set) => ({
  items: [],
  push: (kind, title, body) => {
    const id = seq++;
    set((s) => ({ items: [...s.items, { id, kind, title, body }] }));
    window.setTimeout(() => set((s) => ({ items: s.items.filter((t) => t.id !== id) })), kind === 'error' ? 8000 : 4500);
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}));

export const toast = {
  info: (t: string, b?: string) => useToast.getState().push('info', t, b),
  success: (t: string, b?: string) => useToast.getState().push('success', t, b),
  error: (t: string, b?: string) => useToast.getState().push('error', t, b),
};

const icons: Record<Kind, typeof Info> = { info: Info, success: CheckCircle2, error: XCircle };
const tone: Record<Kind, string> = { info: 'text-slate', success: 'text-primary', error: 'text-brick' };

export function Toaster() {
  const items = useToast((s) => s.items);
  const dismiss = useToast((s) => s.dismiss);
  return (
    <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-80 flex-col gap-2">
      {items.map((t) => {
        const Icon = icons[t.kind];
        return (
          <div key={t.id} className="pointer-events-auto fade-up flex items-start gap-2 rounded-lg border border-line bg-panel px-3 py-2.5 shadow-panel">
            <Icon size={18} className={`mt-0.5 shrink-0 ${tone[t.kind]}`} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{t.title}</p>
              {t.body && <p className="text-xs text-ink-3 break-words">{t.body}</p>}
            </div>
            <button type="button" aria-label="Dismiss" onClick={() => dismiss(t.id)} className="text-ink-3 hover:text-ink">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
