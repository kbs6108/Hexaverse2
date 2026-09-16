import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/Card';
import { Button } from '@/components/Button';
import { Field, Input } from '@/components/Field';
import { useAuth } from '@/lib/auth';
import { LogoMark } from '@/app/Shell';
import { Badge } from '@/components/Badge';
import { useQueryClient } from '@tanstack/react-query';

export function LoginPage() {
  const { mode, user, signInWithGoogle, signInWithEmail, devUsers, setDevUser } = useAuth();
  const { next } = useSearch({ from: '/login' });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [signedInAs, setSignedInAs] = useState<string | null>(null);
  const doneTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (doneTimer.current !== null) window.clearTimeout(doneTimer.current);
    },
    [],
  );

  /** Confirm the sign-in with a quick toast, then continue — to the page that
   *  sent us here (`next`, set by the role guard) or to the map by default. */
  const done = (label?: string) => {
    const to = next && next.startsWith('/') ? next : '/map';
    setSignedInAs(label ?? 'Signed in');
    doneTimer.current = window.setTimeout(() => void navigate({ to }), 900);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await signInWithEmail(email, password);
      done(email);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-14">
      <Link to="/welcome" className="inline-flex w-fit items-center gap-1 text-xs font-medium text-ink-3 hover:text-ink">
        <ArrowLeft size={14} /> Back to overview
      </Link>

      <div className="flex items-center gap-3">
        <LogoMark size={36} />
        <div>
          <h1 className="text-2xl font-semibold">Land Stack</h1>
          <p className="text-sm text-ink-3">Parcel-centric land governance · AP · TN · TG demo</p>
        </div>
      </div>

      {mode === 'dev' ? (
        <Card>
          <CardHeader title="Development identities" subtitle="AUTH_MODE=dev · identity is sent as X-Dev-User" />
          <CardBody className="flex flex-col gap-1">
            {devUsers.map((d) => (
              <button
                key={d.id}
                disabled={!!signedInAs}
                onClick={() => {
                  setDevUser(d.id);
                  qc.clear();
                  done(d.label);
                }}
                className="flex items-center justify-between rounded-md border border-line px-3 py-2 text-left text-sm hover:border-primary hover:bg-primary-soft/40 disabled:pointer-events-none disabled:opacity-60"
              >
                <span className="font-medium">{d.label}</span>
                <span className="flex items-center gap-2 text-xs text-ink-3">
                  {d.hint} <Badge mono>{d.id}</Badge>
                </span>
              </button>
            ))}
            {user && <p className="pt-2 text-xs text-ink-3">Currently: {user.name}</p>}
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardHeader title="Sign in" subtitle="Roles come from Firebase custom claims. New accounts default to citizen." />
          <CardBody className="flex flex-col gap-3">
            <Button variant="primary" onClick={() => void signInWithGoogle().then(() => done('Signed in with Google')).catch((e: Error) => setErr(e.message))}>
              Continue with Google
            </Button>
            <div className="flex items-center gap-2 text-xs text-ink-3">
              <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
            </div>
            <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-3">
              <Field label="Email" htmlFor="email">
                <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </Field>
              <Field label="Password" htmlFor="password">
                <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </Field>
              {err && <p className="text-sm text-brick" role="alert">{err}</p>}
              <Button type="submit" variant="secondary" loading={busy}>
                Sign in with email
              </Button>
            </form>
          </CardBody>
        </Card>
      )}

      <p className="text-center text-xs text-ink-3">
        Just exploring?{' '}
        <Link to="/map" className="font-medium text-primary hover:underline">
          Continue as guest to the map
        </Link>
      </p>

      {/* Quick signed-in confirmation, then off to the map */}
      {signedInAs && (
        <div
          role="status"
          aria-live="polite"
          className="fade-up fixed bottom-8 left-1/2 z-[10000] flex -translate-x-1/2 items-center gap-2.5 rounded-full border border-primary/30 bg-panel px-5 py-3 shadow-panel"
        >
          <CheckCircle2 size={18} className="text-primary" />
          <span className="text-sm font-medium text-ink">
            {signedInAs} <span className="text-ink-3">· opening the map…</span>
          </span>
        </div>
      )}
    </div>
  );
}
