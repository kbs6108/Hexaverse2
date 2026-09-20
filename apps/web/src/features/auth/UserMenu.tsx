import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { ChevronDown, LogOut, UserRound, Globe } from 'lucide-react';
import { clsx } from 'clsx';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { Badge } from '@/components/Badge';
import type { DevUserId } from '@/lib/store';
import { useUI } from '@/lib/store';
import { useTranslation } from '@/lib/i18n';

const roleTone = { citizen: 'neutral', officer: 'slate', admin: 'violet' } as const;

/** Top-right identity control. In dev mode this is the RoleSwitcher (CONTRACTS §3/§10). */
export function UserMenu() {
  const { user, mode, devUsers, setDevUser, signOut } = useAuth();
  const { t, locale, setLocale, languages } = useTranslation();
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
    void navigate({ to: '/map' });
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
        <div role="menu" className="fade-up absolute right-0 mt-1 w-80 max-h-[420px] overflow-y-auto scroll-thin rounded-xl border border-line bg-panel p-1.5 shadow-panel">
          {/* Quick Language Switcher */}
          <div className="p-2 border-b border-line/60 bg-ground-2/40 rounded-lg mb-1">
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-ink-3 flex items-center gap-1">
                <Globe size={12} className="text-primary" /> {t('account.switchLanguage')}
              </span>
              <span className="text-[10px] font-bold text-primary px-1.5 py-0.2 rounded bg-primary-soft">
                {languages.find((l) => l.code === locale)?.native}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {languages.map((lang) => {
                const isSelected = locale === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setLocale(lang.code)}
                    className={clsx(
                      'px-1.5 py-1 text-xs rounded-md font-semibold text-center transition-all cursor-pointer select-none',
                      isSelected
                        ? 'bg-primary text-primary-ink shadow-xs'
                        : 'bg-panel border border-line/70 hover:bg-ground text-ink-2',
                    )}
                  >
                    {lang.native}
                  </button>
                );
              })}
            </div>
          </div>

          {mode === 'dev' ? (
            <>
              <div className="px-2 pt-1 pb-1.5 border-b border-line/60 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">{t('account.devIdentities')}</p>
                <span className="text-[10.5px] text-primary font-mono">{devUsers.length} profiles</span>
              </div>

              {/* Citizens */}
              <div className="pt-2">
                <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-ink-4">Citizens & Land Owners</p>
                {devUsers.filter((d) => d.role === 'citizen').map((d) => {
                  const isCurrent = d.id === user.uid.replace('dev:', '');
                  return (
                    <button
                      key={d.id}
                      role="menuitemradio"
                      aria-checked={isCurrent}
                      onClick={() => switchTo(d.id)}
                      className={clsx(
                        'flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs hover:bg-ground-2 transition-colors',
                        isCurrent && 'bg-primary-soft text-primary font-medium',
                      )}
                    >
                      <div className="flex items-center gap-1.5 min-w-0 pr-2">
                        <span className={clsx('size-1.5 rounded-full shrink-0', isCurrent ? 'bg-primary' : 'bg-line-strong')} />
                        <span className="truncate font-medium">{d.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[11px] text-ink-3 truncate max-w-[130px]">{d.hint.split('·')[1]?.trim() || d.hint}</span>
                        {'state' in d && (
                          <span className="text-[9.5px] font-mono px-1 py-0.2 rounded bg-ground-2 text-ink-3">{d.state}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Officers */}
              <div className="pt-2 border-t border-line/50 mt-1.5">
                <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-ink-4">Departmental Officers</p>
                {devUsers.filter((d) => d.role === 'officer').map((d) => {
                  const isCurrent = d.id === user.uid.replace('dev:', '');
                  return (
                    <button
                      key={d.id}
                      role="menuitemradio"
                      aria-checked={isCurrent}
                      onClick={() => switchTo(d.id)}
                      className={clsx(
                        'flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs hover:bg-ground-2 transition-colors',
                        isCurrent && 'bg-primary-soft text-primary font-medium',
                      )}
                    >
                      <div className="flex items-center gap-1.5 min-w-0 pr-2">
                        <span className={clsx('size-1.5 rounded-full shrink-0', isCurrent ? 'bg-primary' : 'bg-line-strong')} />
                        <span className="truncate font-medium">{d.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[11px] text-ink-3 truncate max-w-[130px]">{d.hint.split('·')[0]?.trim() || d.hint}</span>
                        {'state' in d && (
                          <span className="text-[9.5px] font-mono px-1 py-0.2 rounded bg-ground-2 text-ink-3">{d.state}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Admin */}
              <div className="pt-2 border-t border-line/50 mt-1.5">
                <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-ink-4">Administration</p>
                {devUsers.filter((d) => d.role === 'admin').map((d) => {
                  const isCurrent = d.id === user.uid.replace('dev:', '');
                  return (
                    <button
                      key={d.id}
                      role="menuitemradio"
                      aria-checked={isCurrent}
                      onClick={() => switchTo(d.id)}
                      className={clsx(
                        'flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs hover:bg-ground-2 transition-colors',
                        isCurrent && 'bg-primary-soft text-primary font-medium',
                      )}
                    >
                      <div className="flex items-center gap-1.5 min-w-0 pr-2">
                        <span className={clsx('size-1.5 rounded-full shrink-0', isCurrent ? 'bg-primary' : 'bg-line-strong')} />
                        <span className="truncate font-medium">{d.label}</span>
                      </div>
                      <span className="text-[11px] text-ink-3">{d.hint}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 border-t border-line pt-1.5 px-2 font-mono text-[10px] text-ink-3 flex items-center justify-between">
                <span>Active:</span>
                <span className="truncate max-w-[180px]">{user.uid.replace('dev:', '')}</span>
              </div>
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
