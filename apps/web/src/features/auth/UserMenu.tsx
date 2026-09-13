import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { ChevronDown, LogOut, UserRound } from 'lucide-react';
import { clsx } from 'clsx';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { Badge } from '@/components/Badge';
import type { DevUserId } from '@/lib/store';
import { useUI } from '@/lib/store';

const roleTone = { citizen: 'neutral', officer: 'slate', admin: 'violet' } as const;

/** Top-right identity control. In dev mode this is the RoleSwitcher (CONTRACTS §3/§10). */
export function UserMenu() {
  const { user, mode, devUsers, setDevUser, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) {
    return (
      <Link to="/login" className="rounded-md border border-line px-3 py-1.5 text-sm font-medium hover:bg-ground-2">
        Sign in
      </Link>
    );
  }

  const switchTo = (id: DevUserId) => {
    setDevUser(id);
    useUI.getState().select(null);
    qc.clear();
    setOpen(false);
    void navigate({ to: '/' });
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-md border border-line px-2 py-1 text-sm hover:bg-ground-2"
      >
        <span className="grid size-6 place-items-center rounded-full bg-primary-soft text-primary">
          <UserRound size={14} />
        </span>
        <span className="hidden font-medium sm:inline">{user.name}</span>
        <Badge tone={roleTone[user.role]}>{user.department ? `${user.role} · ${user.department}` : user.role}</Badge>
        <ChevronDown size={14} className="text-ink-3" />
      </button>
      {open && (
        <div role="menu" className="fade-up absolute right-0 mt-1 w-64 rounded-lg border border-line bg-panel p-1 shadow-panel">
          {mode === 'dev' ? (
            <>
              <p className="px-2 pt-1 pb-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-3">Dev mode · switch identity</p>
              {devUsers.map((d) => (
                <button
                  key={d.id}
                  role="menuitemradio"
                  aria-checked={d.id === user.uid.replace('dev:', '')}
                  onClick={() => switchTo(d.id)}
                  className={clsx(
                    'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-ground-2',
                    d.id === user.uid.replace('dev:', '') && 'bg-primary-soft text-primary',
                  )}
                >
                  <span>{d.label}</span>
                  <span className="text-xs text-ink-3">{d.hint}</span>
                </button>
              ))}
              <p className="mt-1 border-t border-line px-2 pt-1.5 pb-1 font-mono text-[10.5px] text-ink-3">
                X-Dev-User: {user.uid.replace('dev:', '')}
              </p>
            </>
          ) : (
            <>
              <p className="px-2 py-1.5 text-xs text-ink-3">{user.email}</p>
              <button
                role="menuitem"
                onClick={() => void signOut()}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-ground-2"
              >
                <LogOut size={14} /> Sign out
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
