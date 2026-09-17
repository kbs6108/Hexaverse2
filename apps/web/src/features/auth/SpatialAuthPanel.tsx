import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { triggerCitizenCinematic } from '@/lib/cinematic';
import { LogoMark } from '@/app/Shell';
import { cn } from '@/lib/utils';
import { GradientButton } from '@/components/ui/shader-button';

// --- Icons ---
const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-4 h-4 shrink-0">
    <g fillRule="evenodd" fill="none">
      <g fillRule="nonzero" transform="translate(3, 2)">
        <path fill="#4285F4" d="M57.8123233,30.1515267 C57.8123233,27.7263183 57.6155321,25.9565533 57.1896408,24.1212666 L29.4960833,24.1212666 L29.4960833,35.0674653 L45.7515771,35.0674653 C45.4239683,37.7877475 43.6542033,41.8844383 39.7213169,44.6372555 L39.6661883,45.0037254 L48.4223791,51.7870338 L49.0290201,51.8475849 C54.6004021,46.7020943 57.8123233,39.1313952 57.8123233,30.1515267" />
        <path fill="#34A853" d="M29.4960833,58.9921667 C37.4599129,58.9921667 44.1456164,56.3701671 49.0290201,51.8475849 L39.7213169,44.6372555 C37.2305867,46.3742596 33.887622,47.5868638 29.4960833,47.5868638 C21.6960582,47.5868638 15.0758763,42.4415991 12.7159637,35.3297782 L12.3700541,35.3591501 L3.26524241,42.4054492 L3.14617358,42.736447 C7.9965904,52.3717589 17.959737,58.9921667 29.4960833,58.9921667" />
        <path fill="#FBBC05" d="M12.7159637,35.3297782 C12.0932812,33.4944915 11.7329116,31.5279353 11.7329116,29.4960833 C11.7329116,27.4640054 12.0932812,25.4976752 12.6832029,23.6623884 L12.6667095,23.2715173 L3.44779955,16.1120237 L3.14617358,16.2554937 C1.14708246,20.2539019 0,24.7439491 0,29.4960833 C0,34.2482175 1.14708246,38.7380388 3.14617358,42.736447 L12.7159637,35.3297782" />
        <path fill="#EB4335" d="M29.4960833,11.4050769 C35.0347044,11.4050769 38.7707997,13.7975244 40.9011602,15.7968415 L49.2255853,7.66898166 C44.1130815,2.91684746 37.4599129,0 29.4960833,0 C17.959737,0 7.9965904,6.62018183 3.14617358,16.2554937 L12.6832029,23.6623884 C15.0758763,16.5505675 21.6960582,11.4050769 29.4960833,11.4050769" />
      </g>
    </g>
  </svg>
);

const GitHubIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="w-4 h-4 shrink-0 fill-current">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
  </svg>
);

export interface SpatialAuthPanelProps {
  isOpen: boolean;
  initialMode?: 'signin' | 'signup';
  next?: string;
  onClose: () => void;
}

export function SpatialAuthPanel({
  isOpen,
  initialMode = 'signin',
  next,
  onClose,
}: SpatialAuthPanelProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { setDevUser } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  const handleComplete = async (fullscreen = false) => {
    setLoading(true);
    if (fullscreen) {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } catch (err) {
        console.warn('Fullscreen request denied or not supported:', err);
      }
      triggerCitizenCinematic();
    }

    setDevUser('citizen::Ravi Kumar');
    qc.clear();
    setLoading(false);
    onClose();

    const destination = next && next.startsWith('/') ? next : '/citizen';
    navigate({ to: destination });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void handleComplete(false);
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-[#18231F]/40 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="relative w-full max-w-md p-7 sm:p-8 rounded-3xl bg-[#F4F1E7]/95 backdrop-blur-2xl border border-[#D5D2C7] shadow-[0_20px_50px_rgba(24,35,31,0.18)] flex flex-col select-none"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full text-[#6F7768] hover:text-[#18231F] hover:bg-[#E1E6DE] transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="text-center mb-6 flex flex-col items-center">
              <div className="bg-[#E9E5D8]/80 border border-[#D5D2C7] rounded-xl p-2 shadow-xs mb-3">
                <LogoMark size={22} />
              </div>
              <h2 id="auth-modal-title" className="uppercase font-black text-2xl text-[#18231F] tracking-widest">
                TENREC
              </h2>
              <p className="text-xs text-[#4B5345] font-medium mt-0.5">
                Unified Land Records & Cadastral Infrastructure
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center gap-1 p-1 bg-[#E9E5D8]/80 border border-[#D5D2C7] rounded-xl mb-5">
              <button
                type="button"
                onClick={() => setMode('signin')}
                className={cn(
                  'flex-1 py-1.5 text-xs font-bold rounded-lg transition-all',
                  mode === 'signin'
                    ? 'bg-[#F4F1E7] text-[#18231F] shadow-xs'
                    : 'text-[#6F7768] hover:text-[#18231F]',
                )}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={cn(
                  'flex-1 py-1.5 text-xs font-bold rounded-lg transition-all',
                  mode === 'signup'
                    ? 'bg-[#F4F1E7] text-[#18231F] shadow-xs'
                    : 'text-[#6F7768] hover:text-[#18231F]',
                )}
              >
                Sign Up
              </button>
            </div>

            {/* Social Buttons */}
            <div className="flex gap-3 w-full mb-5">
              <button
                type="button"
                onClick={() => void handleComplete(false)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#F4F1E7] rounded-xl shadow-xs border border-[#D5D2C7] hover:bg-[#E1E6DE] transition-colors text-[#18231F] font-semibold text-xs cursor-pointer"
              >
                <GoogleIcon /> Google
              </button>
              <button
                type="button"
                onClick={() => void handleComplete(false)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#F4F1E7] rounded-xl shadow-xs border border-[#D5D2C7] hover:bg-[#E1E6DE] transition-colors text-[#18231F] font-semibold text-xs cursor-pointer"
              >
                <GitHubIcon /> GitHub
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center w-full gap-3 mb-5">
              <hr className="flex-1 border-[#D5D2C7]" />
              <span className="text-[11px] font-bold text-[#6F7768]">OR</span>
              <hr className="flex-1 border-[#D5D2C7]" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="w-full space-y-3">
              {mode === 'signup' && (
                <div className="relative flex items-center w-full group">
                  <User className="absolute left-3.5 w-4 h-4 text-[#6F7768] group-focus-within:text-[#176B52] transition-colors" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F4F1E7] border border-[#D5D2C7] focus:border-[#176B52] focus:ring-1 focus:ring-[#176B52] outline-none transition-all text-xs text-[#18231F] placeholder:text-[#6F7768] shadow-xs font-medium"
                  />
                </div>
              )}

              <div className="relative flex items-center w-full group">
                <Mail className="absolute left-3.5 w-4 h-4 text-[#6F7768] group-focus-within:text-[#176B52] transition-colors" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F4F1E7] border border-[#D5D2C7] focus:border-[#176B52] focus:ring-1 focus:ring-[#176B52] outline-none transition-all text-xs text-[#18231F] placeholder:text-[#6F7768] shadow-xs font-medium"
                />
              </div>

              <div className="relative flex items-center w-full group">
                <Lock className="absolute left-3.5 w-4 h-4 text-[#6F7768] group-focus-within:text-[#176B52] transition-colors" />
                <input
                  type="password"
                  placeholder={mode === 'signup' ? 'Create password' : 'Password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F4F1E7] border border-[#D5D2C7] focus:border-[#176B52] focus:ring-1 focus:ring-[#176B52] outline-none transition-all text-xs text-[#18231F] placeholder:text-[#6F7768] shadow-xs font-medium"
                />
              </div>

              <div className="flex flex-col gap-2.5 w-full mt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[44px] rounded-full bg-[#176B52] hover:bg-[#114B39] text-[#F4F1E7] font-bold text-xs shadow-sm transition-all flex items-center justify-center"
                >
                  {mode === 'signup' ? 'Create Account & Enter' : 'Continue to Portal'}
                </button>

                <GradientButton
                  type="button"
                  onClick={() => void handleComplete(true)}
                  className="w-full"
                >
                  Continue in fullscreen
                </GradientButton>
              </div>
            </form>

            {/* Footer helper toggle */}
            <p className="mt-4 text-center text-xs text-[#4B5345]">
              {mode === 'signin' ? (
                <>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="font-bold text-[#176B52] hover:underline cursor-pointer"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signin')}
                    className="font-bold text-[#176B52] hover:underline cursor-pointer"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
