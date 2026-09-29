import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { type DevUserId } from '@/lib/store';

export interface GoogleSignInPopupProps {
  isOpen: boolean;
  onClose: () => void;
  /** When true, styled as the classic floating Google One Tap prompt at top-right */
  floatingOneTap?: boolean;
}

/** Official Google 'G' Multi-Color SVG Logo */
export function GoogleGLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.15C3.25 21.27 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.27C.46 8.2.005 10.05.005 12s.455 3.8.1.265 5.42l4.01-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.73 1.27 6.58l4.01 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

export function GoogleSignInPopup({ isOpen, onClose, floatingOneTap = false }: GoogleSignInPopupProps) {
  const { user, mode, signInWithGoogle, setDevUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDemoUser, setSelectedDemoUser] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      if (mode === 'firebase') {
        await signInWithGoogle();
        onClose();
      } else {
        // Dev / Demonstration mode: Simulate Google OAuth authentication
        // Picks active citizen or default Google account
        setDevUser('citizen::Ravi Kumar');
        setSelectedDemoUser('citizen::Ravi Kumar');
        setTimeout(() => {
          setLoading(false);
          onClose();
        }, 500);
        return;
      }
    } catch (err: unknown) {
      console.warn('Google sign-in exception:', err);
      setError((err as { message?: string })?.message || 'Google sign-in was cancelled or encountered an error.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDevAccount = (id: DevUserId) => {
    setDevUser(id);
    setSelectedDemoUser(id);
    setTimeout(() => {
      onClose();
    }, 350);
  };

  const isUserSignedIn = !!user && user.email;

  const cardContent = (
    <div className="w-full max-w-[370px] rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.18)] p-5 text-left font-sans select-none overflow-hidden relative">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-2.5">
          <GoogleGLogo size={20} />
          <div>
            <h3 className="text-[13.5px] font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight leading-none">
              Sign in to Tract
            </h3>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 leading-none">
              with google.com
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="size-7 flex items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
          aria-label="Close Google sign in popup"
        >
          <X size={15} />
        </button>
      </div>

      {/* Main Body */}
      <div className="py-4 space-y-3.5">
        {/* If already signed in: Continue as User */}
        {isUserSignedIn ? (
          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-neutral-700/60 flex items-center gap-3">
            <span className="size-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              {user.name.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">{user.name}</p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">{user.email}</p>
              <div className="flex items-center gap-1 mt-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                <ShieldCheck size={12} />
                <span>Verified Google Account</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Standard "Sign in with Google" Button */}
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-750 text-neutral-800 dark:text-neutral-100 text-[13px] font-semibold shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-60"
            >
              <GoogleGLogo size={18} />
              <span>{loading ? 'Signing in with Google...' : 'Continue with Google'}</span>
            </button>

            {/* Quick Demonstration Identity Chooser for Judges / Evaluators */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10.5px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  Or select test identity
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                  Instant Access
                </span>
              </div>

              <div className="space-y-1.5">
                {[
                  {
                    id: 'citizen::Ravi Kumar' as DevUserId,
                    name: 'Ravi Kumar',
                    email: 'ravi.kumar.citizen@gmail.com',
                    role: 'Farmer / Citizen',
                    avatar: 'RK',
                  },
                  {
                    id: 'officer:revenue:tahsildar:Anitha' as DevUserId,
                    name: 'Dr. Anitha Sharma',
                    email: 'anitha.sharma.dro@nic.in',
                    role: 'Tahsildar (Revenue)',
                    avatar: 'AS',
                  },
                  {
                    id: 'officer:registration:sub_registrar:Suresh' as DevUserId,
                    name: 'Suresh Varma',
                    email: 'suresh.varma.sro@gov.in',
                    role: 'Sub-Registrar (SRO)',
                    avatar: 'SV',
                  },
                ].map((account) => {
                  const isSelected = selectedDemoUser === account.id || (user && user.name === account.name);
                  return (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() => handleSelectDevAccount(account.id)}
                      className="w-full flex items-center justify-between p-2 rounded-xl border border-neutral-200/80 dark:border-neutral-800 hover:border-primary/50 bg-neutral-50/70 dark:bg-neutral-800/40 hover:bg-neutral-100/70 transition-all text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="size-7 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 flex items-center justify-center font-bold text-[11px] shrink-0">
                          {account.avatar}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-100 truncate group-hover:text-primary transition-colors">
                            {account.name}
                          </p>
                          <p className="text-[10.5px] text-neutral-500 dark:text-neutral-400 truncate">
                            {account.email}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 text-[10px] font-medium text-neutral-500 dark:text-neutral-400 bg-white dark:bg-neutral-700 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-600">
                        {isSelected ? <Check size={11} className="text-emerald-600" /> : account.role}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Error Notification */}
        {error && (
          <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-[11px] flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <p className="leading-tight">{error}</p>
          </div>
        )}
      </div>

      {/* Footer Disclaimer */}
      <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[10.5px] text-neutral-400 dark:text-neutral-500 leading-relaxed">
        To continue, Google will share your name, email address, and profile picture with Tract in accordance with the DPDPA 2023.
      </div>
    </div>
  );

  if (floatingOneTap) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="fixed top-20 right-4 sm:right-8 z-[999999]"
        >
          {cardContent}
        </motion.div>
      </AnimatePresence>
    );
  }

  // Centered Modal Mode
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-xs"
        />
        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 10 }}
          transition={{ type: 'spring', damping: 26, stiffness: 340 }}
          className="relative z-10"
        >
          {cardContent}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
