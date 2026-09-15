import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
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
    // Underneath, use the existing development identity to keep the backend happy
    // without exposing it to the user.
    setDevUser('citizen::Ravi Kumar');
    qc.clear();
    done();
  };

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-8 px-4 py-16 sm:py-24">
      <Link to="/" className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-ink-3 hover:text-ink transition-colors">
        <ArrowLeft size={16} /> Back to home
      </Link>

      <div className="flex flex-col items-center text-center gap-4">
        <LogoMark size={48} />
        <div>
          <h1 className="text-2xl font-bold text-ink">TENREC</h1>
          <p className="mt-2 text-[15px] text-ink-2">Sign in to your land governance platform.</p>
        </div>
      </div>

      <Card className="mt-2 shadow-sm border-line/60">
        <CardBody className="flex flex-col gap-4 p-6 sm:p-8">
          <Button variant="primary" className="w-full text-[15px] py-3 h-auto font-semibold" onClick={handleSignIn} disabled={!!signedInAs}>
            Continue
          </Button>
          <p className="text-center text-[13px] text-ink-3 mt-2">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardBody>
      </Card>

      {/* Quick signed-in confirmation, then off to the platform */}
      {signedInAs && (
        <div
          role="status"
          aria-live="polite"
          className="fade-up fixed bottom-8 left-1/2 z-[10000] flex -translate-x-1/2 items-center gap-2.5 rounded-full border border-primary/30 bg-panel px-5 py-3 shadow-panel"
        >
          <CheckCircle2 size={18} className="text-primary" />
          <span className="text-sm font-medium text-ink">
            {signedInAs} <span className="text-ink-3">· opening the platform…</span>
          </span>
        </div>
      )}
    </div>
  );
}
