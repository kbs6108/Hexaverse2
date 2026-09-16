import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardBody } from '@/components/Card';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/auth';
import { LogoMark } from '@/app/Shell';
import { useQueryClient } from '@tanstack/react-query';

export function LoginPage() {
  const { setDevUser } = useAuth();
  const { next } = useSearch({ from: '/login' });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [signedInAs, setSignedInAs] = useState<string | null>(null);
  const doneTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (doneTimer.current !== null) window.clearTimeout(doneTimer.current);
    },
    [],
  );

  /** Confirm the sign-in with a quick toast, then continue — to the page that
   *  sent us here (`next`) or to the platform gateway by default. */
  const done = () => {
    const to = next && next.startsWith('/') ? next : '/citizen';
    setSignedInAs('Signed in');
    doneTimer.current = window.setTimeout(() => void navigate({ to }), 900);
  };

  const handleSignIn = () => {
    setDevUser('citizen::Ravi Kumar');
    qc.clear();
    done();
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-[360px] flex-col justify-center gap-8 px-4 py-16">
      
      <motion.div 
        initial={{ opacity: 0, x: -10 }} 
        animate={{ opacity: 1, x: 0 }} 
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <Link to="/" className="inline-flex w-fit items-center gap-1.5 text-[13px] font-medium text-ink-3 hover:text-ink transition-colors">
          <ArrowLeft size={14} /> Back to home
        </Link>
      </motion.div>

      <motion.div 
        className="flex flex-col items-center text-center gap-5"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="rounded-2xl border border-line/40 bg-panel p-3 shadow-sm">
          <LogoMark size={42} />
        </div>
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-ink">TENREC</h1>
          <p className="mt-2 text-[15px] text-ink-2">Sign in to your land governance platform.</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card className="mt-2 overflow-hidden border border-line/60 bg-panel/80 shadow-md backdrop-blur-xl">
          <CardBody className="flex flex-col gap-4 p-7 sm:p-8">
            <Button 
              variant="primary" 
              className="w-full h-[46px] text-[15px] font-semibold tracking-wide transition-all hover:bg-[#0a5a46] active:scale-[0.98]" 
              onClick={handleSignIn} 
              disabled={!!signedInAs}
            >
              Continue
            </Button>
            <p className="mt-3 text-center text-[12px] text-ink-3 leading-relaxed">
              By continuing, you agree to our <br className="hidden sm:block" />
              <a href="#" className="underline hover:text-ink transition-colors">Terms of Service</a> and <a href="#" className="underline hover:text-ink transition-colors">Privacy Policy</a>.
            </p>
          </CardBody>
        </Card>
      </motion.div>

      {/* Quick signed-in confirmation, then off to the platform */}
      {signedInAs && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="fixed bottom-10 left-1/2 z-[10000] flex -translate-x-1/2 items-center gap-3 rounded-full border border-primary/30 bg-panel px-6 py-3.5 shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
        >
          <CheckCircle2 size={18} className="text-primary" />
          <span className="text-[14px] font-medium text-ink">
            {signedInAs} <span className="text-ink-3">· opening the platform…</span>
          </span>
        </motion.div>
      )}
    </div>
  );
}
