import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { clsx } from 'clsx';
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  HelpCircle,
  LogOut,
  Mail,
  Shield,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useUI, type DevUserId } from '@/lib/store';
import { clearCitizenCinematic } from '@/lib/cinematic';

interface AccountPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccountPanel({ isOpen, onClose }: AccountPanelProps) {
  const { user, mode, devUsers, setDevUser, signOut } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const switchTo = (id: DevUserId) => {
    setDevUser(id);
    useUI.getState().select(null);
    qc.clear();
    onClose();
    void navigate({ to: '/map' });
  };

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const initials = user.name
    ? user.name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden pointer-events-auto">
        {/* Subtle backdrop dimming layer - map remains visible */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/25 backdrop-blur-[1px] transition-opacity"
          aria-hidden="true"
        />

        {/* Right-Side Half-Screen Account Panel */}
        <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="w-screen max-w-xl sm:w-[480px] lg:w-[45vw] flex flex-col bg-panel/95 backdrop-blur-2xl border-l border-line shadow-2xl text-ink"
            aria-label="Account Panel"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">TENREC Portal</p>
                <h2 className="font-display text-lg font-bold tracking-tight text-ink">Account Overview</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                title="Close account panel"
                aria-label="Close account panel"
                className="flex size-8 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-ground-2 hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scroll-thin">
              {/* Profile Card */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-ground/60 border border-line/70 backdrop-blur-sm">
                <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs text-base font-bold">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-base font-bold text-ink truncate">{user.name}</h3>
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10.5px] font-medium text-primary uppercase">
                      <span className="size-1.5 rounded-full bg-primary" />
                      {user.role}
                    </span>
                  </div>
                  <p className="text-xs text-ink-3 truncate mt-0.5">{user.email || 'Authenticated Citizen'}</p>
                </div>
              </div>

              {/* Personal Details */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-3 mb-3">Personal Details</h4>
                <div className="rounded-xl border border-line bg-panel divide-y divide-line overflow-hidden shadow-xs">
                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="flex items-center gap-2 text-ink-3">
                      <UserRound size={15} /> Full Name
                    </span>
                    <span className="font-medium text-ink">{user.name}</span>
                  </div>
                  {user.email && (
                    <div className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className="flex items-center gap-2 text-ink-3">
                        <Mail size={15} /> Email
                      </span>
                      <span className="font-medium text-ink">{user.email}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="flex items-center gap-2 text-ink-3">
                      <Shield size={15} /> Role
                    </span>
                    <span className="font-medium capitalize text-ink">{user.role}</span>
                  </div>
                  {user.department && (
                    <div className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className="flex items-center gap-2 text-ink-3">Department</span>
                      <span className="font-medium text-ink">{user.department}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="flex items-center gap-2 text-ink-3">
                      <CheckCircle2 size={15} className="text-primary" /> Account Status
                    </span>
                    <span className="font-medium text-primary">Active</span>
                  </div>
                </div>
              </div>

              {/* Dev Mode Identity Switcher */}
              {mode === 'dev' && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-3 mb-3 flex items-center gap-1.5">
                    <Users size={14} /> Dev Mode · Switch Identity
                  </h4>
                  <div className="rounded-xl border border-line bg-panel divide-y divide-line overflow-hidden shadow-xs">
                    {devUsers.map((d) => {
                      const isCurrent = d.id === user.uid.replace('dev:', '');
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => switchTo(d.id)}
                          className={clsx(
                            'flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-ground-2 transition-colors',
                            isCurrent && 'bg-primary-soft/70 text-primary font-medium',
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span className={clsx('size-2 rounded-full', isCurrent ? 'bg-primary' : 'bg-line-strong')} />
                            <span>{d.label}</span>
                          </div>
                          <span className="text-xs text-ink-3">{d.hint}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Applications Shortcut */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-3 mb-3">Applications & Records</h4>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    void navigate({ to: '/citizen/track' });
                  }}
                  className="group flex w-full items-center justify-between p-4 rounded-xl border border-line bg-panel hover:bg-ground-2/70 transition-all text-left shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid size-9 place-items-center rounded-lg bg-primary-soft text-primary">
                      <FileText size={18} />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-ink group-hover:text-primary transition-colors">Applications</p>
                      <p className="text-xs text-ink-3">View your submitted applications & status</p>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-ink-3 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>

              {/* Help & Support Shortcut */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-3 mb-3">Assistance</h4>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    void navigate({ to: '/help' });
                  }}
                  className="group flex w-full items-center justify-between p-4 rounded-xl border border-line bg-panel hover:bg-ground-2/70 transition-all text-left shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid size-9 place-items-center rounded-lg bg-ground-2 text-ink-2">
                      <HelpCircle size={18} />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-ink group-hover:text-primary transition-colors">Help & Guidance</p>
                      <p className="text-xs text-ink-3">Explore user guides and system documentation</p>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-ink-3 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>
            </div>

            {/* Footer / Sign Out */}
            <div className="border-t border-line px-6 py-4 bg-ground/40">
              <button
                type="button"
                onClick={() => {
                  if (document.fullscreenElement) {
                    document.exitFullscreen().catch((err) => console.warn(err));
                  }
                  clearCitizenCinematic();
                  void signOut();
                  onClose();
                  void navigate({ to: '/' });
                }}
                className="flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-line bg-panel text-brick hover:bg-brick-soft/40 hover:border-brick/30 font-medium text-sm transition-colors shadow-xs cursor-pointer"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          </motion.aside>
        </div>
      </div>
    </AnimatePresence>
  );
}

export default AccountPanel;
