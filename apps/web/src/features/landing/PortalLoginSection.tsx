import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  UserRound,
  Landmark,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Lock,
  Mail,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useQueryClient } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { BorderBeam } from '@/components/BorderBeam';

type PortalTab = 'citizen' | 'officer' | 'admin';

export function PortalLoginSection() {
  const { mode, signInWithGoogle, signInWithEmail, setDevUser } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<PortalTab>('citizen');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [signedInLabel, setSignedInLabel] = useState<string | null>(null);

  const isFirebaseMode = mode === 'firebase';

  const handleSuccess = (label: string, destination: string = '/map') => {
    setSignedInLabel(label);
    window.setTimeout(() => {
      qc.clear();
      void navigate({ to: destination });
    }, 750);
  };

  const handleEmailSubmit = async (e: FormEvent, defaultDest: string = '/map') => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErr('Please enter both email and password.');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      if (isFirebaseMode) {
        await signInWithEmail(email, password);
        handleSuccess(email, defaultDest);
      } else {
        // Dev fallback: match or create citizen
        const id = activeTab === 'citizen' ? `citizen::${email.split('@')[0]}` : 'officer:revenue:tahsildar:Anitha Rao';
        setDevUser(id);
        handleSuccess(email, defaultDest);
      }
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Sign-in failed. Please verify credentials.');
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleSignIn = async (destination: string = '/map') => {
    setBusy(true);
    setErr(null);
    try {
      if (isFirebaseMode) {
        await signInWithGoogle();
        handleSuccess('Google Account', destination);
      } else {
        setDevUser('citizen::Ravi Kumar');
        handleSuccess('Google Account (Demo)', destination);
      }
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Google sign-in was cancelled or encountered an error.');
    } finally {
      setBusy(false);
    }
  };

  const handleFastPass = (userId: string, label: string, destination: string) => {
    setDevUser(userId);
    handleSuccess(label, destination);
  };

  return (
    <section id="login" className="relative scroll-mt-24 overflow-hidden border-t border-line bg-ground py-20 px-6 sm:px-12 lg:px-20">
      {/* Ambient background radiance */}
      <div className="pointer-events-none absolute -left-20 top-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-1/4 h-96 w-96 rounded-full bg-amber-500/5 blur-3xl" />

      <div className="mx-auto max-w-5xl">
        {/* Section Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft/50 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-primary">
            <Lock size={12} />
            <span>09 / Sovereign Access &amp; Authentication</span>
          </div>
          <h2 className="mt-4 font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink">
            Sovereign Portal Login
          </h2>
          <p className="mt-3 text-sm sm:text-base text-ink-2 max-w-2xl mx-auto leading-relaxed">
            Role-gated digital public infrastructure for Indian land administration. Authenticate as a landholding citizen, statutory revenue officer, or spatial administrator.
          </p>
        </div>

        {/* Portal Selection Tabs */}
        <div className="mt-10 flex justify-center">
          <div className="inline-flex rounded-full border border-line bg-panel p-1.5 shadow-sm">
            <button
              type="button"
              onClick={() => { setActiveTab('citizen'); setErr(null); }}
              className={clsx(
                'flex items-center gap-2 rounded-full px-5 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer select-none',
                activeTab === 'citizen'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-ink-2 hover:text-ink hover:bg-ground-2'
              )}
            >
              <UserRound size={15} />
              <span>Citizen Portal</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('officer'); setErr(null); }}
              className={clsx(
                'flex items-center gap-2 rounded-full px-5 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer select-none',
                activeTab === 'officer'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-ink-2 hover:text-ink hover:bg-ground-2'
              )}
            >
              <Landmark size={15} />
              <span>Departmental SSO</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('admin'); setErr(null); }}
              className={clsx(
                'flex items-center gap-2 rounded-full px-5 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer select-none',
                activeTab === 'admin'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-ink-2 hover:text-ink hover:bg-ground-2'
              )}
            >
              <ShieldCheck size={15} />
              <span>Spatial Admin</span>
            </button>
          </div>
        </div>

        {/* Main Auth Container Card */}
        <div className="mt-8 mx-auto max-w-3xl">
          <div className="relative rounded-3xl border border-line bg-panel p-6 sm:p-10 shadow-xl backdrop-blur-md">
            <BorderBeam size={160} duration={8} colorFrom="#183B2B" colorTo="#D1A654" />

            <AnimatePresence mode="wait">
              {/* TAB 1: CITIZEN PORTAL */}
              {activeTab === 'citizen' && (
                <motion.div
                  key="citizen-tab"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-4">
                    <div>
                      <h3 className="font-display text-lg font-bold text-ink flex items-center gap-2">
                        <span>Citizen &amp; Landowner Access</span>
                        <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono px-2 py-0.5 font-bold">
                          DPDP 2023 Compliant
                        </span>
                      </h3>
                      <p className="text-xs text-ink-3 mt-1">
                        View verified titles, inspect 3D parcel models, verify encumbrance, and track mutation applications.
                      </p>
                    </div>
                  </div>

                  {/* Primary Google Auth Button */}
                  <div className="space-y-3">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleGoogleSignIn('/citizen')}
                      className="w-full flex items-center justify-center gap-3 rounded-xl border border-line bg-panel-2 py-3 px-4 text-sm font-bold text-ink hover:bg-ground-2 hover:border-line-strong transition shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      <svg className="size-4 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Continue with Google</span>
                    </button>

                    <div className="relative flex items-center justify-center">
                      <div className="w-full border-t border-line" />
                      <span className="absolute bg-panel px-3 text-[11px] uppercase tracking-wider text-ink-3">
                        or sign in with credentials
                      </span>
                    </div>

                    {/* Email/Password Form */}
                    <form onSubmit={(e) => void handleEmailSubmit(e, '/citizen')} className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-ink-2 mb-1">Registered Email or ULPIN ID</label>
                        <div className="relative">
                          <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
                          <input
                            type="text"
                            placeholder="name@example.gov.in or citizen@tract.in"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-xl border border-line bg-ground px-3.5 py-2 pl-9 text-xs sm:text-sm text-ink placeholder:text-ink-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink-2 mb-1">Password or Security Passcode</label>
                        <div className="relative">
                          <KeyRound size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
                          <input
                            type="password"
                            placeholder="••••••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-xl border border-line bg-ground px-3.5 py-2 pl-9 text-xs sm:text-sm text-ink placeholder:text-ink-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>

                      {err && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                          {err}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={busy}
                        className="w-full rounded-xl bg-primary py-2.5 text-xs sm:text-sm font-bold text-white transition hover:brightness-105 active:scale-[0.99] cursor-pointer disabled:opacity-50"
                      >
                        {busy ? 'Authenticating...' : 'Sign In as Citizen'}
                      </button>
                    </form>
                  </div>

                  {/* Fast Pass Demo Identities for SIH Evaluators */}
                  <div className="mt-6 rounded-2xl border border-dashed border-line bg-panel-2/50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-ink">
                        <Sparkles size={13} className="text-amber-500" />
                        Hackathon Evaluator Fast-Pass
                      </span>
                      <span className="text-[10px] font-mono text-ink-3">Instant Demo Login</span>
                    </div>
                    <p className="text-[11px] text-ink-3 mb-3">
                      Skip credential entry to immediately review verified parcel records and citizen workflows:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleFastPass('citizen::Ravi Kumar', 'Ravi Kumar (Citizen · AP)', '/citizen')}
                        className="flex items-center justify-between rounded-xl border border-line bg-panel p-2.5 text-left text-xs font-semibold text-ink hover:border-primary hover:bg-primary-soft/40 transition cursor-pointer"
                      >
                        <div>
                          <p className="font-bold">Ravi Kumar</p>
                          <p className="text-[10px] text-ink-3 font-normal">Guntur Pilot Parcel AP-GNT-042</p>
                        </div>
                        <ArrowRight size={13} className="text-primary" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFastPass('citizen::Murugan V', 'Murugan V (Citizen · TN)', '/citizen')}
                        className="flex items-center justify-between rounded-xl border border-line bg-panel p-2.5 text-left text-xs font-semibold text-ink hover:border-primary hover:bg-primary-soft/40 transition cursor-pointer"
                      >
                        <div>
                          <p className="font-bold">Murugan V</p>
                          <p className="text-[10px] text-ink-3 font-normal">Sri City Pilot Parcel TN-TPR-108</p>
                        </div>
                        <ArrowRight size={13} className="text-primary" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 2: DEPARTMENTAL OFFICER SSO */}
              {activeTab === 'officer' && (
                <motion.div
                  key="officer-tab"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="border-b border-line pb-4">
                    <h3 className="font-display text-lg font-bold text-ink flex items-center gap-2">
                      <span>Departmental Officer Single Sign-On (SSO)</span>
                      <span className="rounded-full bg-blue-100 text-blue-800 text-[10px] font-mono px-2 py-0.5 font-bold">
                        NIC MeghRaj Sovereign SSO
                      </span>
                    </h3>
                    <p className="text-xs text-ink-3 mt-1">
                      Direct federated access for Revenue Tahsildars, Sub-Registrars, Town Planners, and Survey Inspectors.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-ink">
                      Select Departmental Jurisdiction &amp; Active Duty Officer:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Officer 1: Tahsildar */}
                      <button
                        type="button"
                        onClick={() => handleFastPass('officer:revenue:tahsildar:Anitha Rao', 'Anitha Rao (Tahsildar)', '/officer')}
                        className="group flex flex-col justify-between rounded-2xl border border-line bg-panel p-3.5 text-left transition hover:border-primary hover:bg-primary-soft/40 shadow-xs cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold font-mono">
                            REVENUE DEPT
                          </span>
                          <span className="text-[10px] font-mono text-ink-3">AP Pilot</span>
                        </div>
                        <div className="mt-3">
                          <p className="text-sm font-bold text-ink group-hover:text-primary transition">
                            Anitha Rao
                          </p>
                          <p className="text-[11px] text-ink-3">Tahsildar · Guntur District</p>
                          <p className="mt-1 text-[10px] text-primary font-medium">Quasi-judicial mutation approvals &amp; §5 speaking orders →</p>
                        </div>
                      </button>

                      {/* Officer 2: Sub-Registrar */}
                      <button
                        type="button"
                        onClick={() => handleFastPass('officer:registration:sub_registrar:Suresh Kumar', 'Suresh Kumar (Sub-Registrar)', '/officer?department=registration')}
                        className="group flex flex-col justify-between rounded-2xl border border-line bg-panel p-3.5 text-left transition hover:border-primary hover:bg-primary-soft/40 shadow-xs cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="rounded-md bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 text-[10px] font-bold font-mono">
                            REGISTRATION &amp; SRO
                          </span>
                          <span className="text-[10px] font-mono text-ink-3">TN Pilot</span>
                        </div>
                        <div className="mt-3">
                          <p className="text-sm font-bold text-ink group-hover:text-primary transition">
                            Suresh Kumar
                          </p>
                          <p className="text-[11px] text-ink-3">Sub-Registrar · Sri City</p>
                          <p className="mt-1 text-[10px] text-primary font-medium">Deed execution, pre-mutation checks &amp; encumbrance audit →</p>
                        </div>
                      </button>

                      {/* Officer 3: Town Planner */}
                      <button
                        type="button"
                        onClick={() => handleFastPass('officer:planning:town_planner:Farida Begum', 'Farida Begum (Town Planner)', '/officer?department=planning')}
                        className="group flex flex-col justify-between rounded-2xl border border-line bg-panel p-3.5 text-left transition hover:border-primary hover:bg-primary-soft/40 shadow-xs cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="rounded-md bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 text-[10px] font-bold font-mono">
                            TOWN PLANNING
                          </span>
                          <span className="text-[10px] font-mono text-ink-3">TG Pilot</span>
                        </div>
                        <div className="mt-3">
                          <p className="text-sm font-bold text-ink group-hover:text-primary transition">
                            Farida Begum
                          </p>
                          <p className="text-[11px] text-ink-3">Town Planner · Hyderabad</p>
                          <p className="mt-1 text-[10px] text-primary font-medium">Master Plan 2031 zoning checks &amp; FAR compliance →</p>
                        </div>
                      </button>

                      {/* Officer 4: Survey Inspector */}
                      <button
                        type="button"
                        onClick={() => handleFastPass('officer:survey:inspector:Muthu Swamy', 'Muthu Swamy (Survey Inspector)', '/officer?department=survey')}
                        className="group flex flex-col justify-between rounded-2xl border border-line bg-panel p-3.5 text-left transition hover:border-primary hover:bg-primary-soft/40 shadow-xs cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="rounded-md bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 text-[10px] font-bold font-mono">
                            SURVEY &amp; CORS
                          </span>
                          <span className="text-[10px] font-mono text-ink-3">SoI Ground Truth</span>
                        </div>
                        <div className="mt-3">
                          <p className="text-sm font-bold text-ink group-hover:text-primary transition">
                            Muthu Swamy
                          </p>
                          <p className="text-[11px] text-ink-3">Cadastral Surveyor · Field Division</p>
                          <p className="mt-1 text-[10px] text-primary font-medium">ETS polar vector ingestion &amp; CORS RTK boundary checks →</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 3: SPATIAL ADMIN */}
              {activeTab === 'admin' && (
                <motion.div
                  key="admin-tab"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="border-b border-line pb-4">
                    <h3 className="font-display text-lg font-bold text-ink flex items-center gap-2">
                      <span>Spatial Administrator &amp; National Registry</span>
                      <span className="rounded-full bg-slate-100 text-slate-800 text-[10px] font-mono px-2 py-0.5 font-bold">
                        Superuser Audit Clearance
                      </span>
                    </h3>
                    <p className="text-xs text-ink-3 mt-1">
                      Manage topology invariants (ST_Snap, ST_Disjoint), CLM 1.0 JSON-LD state adapters, and cryptographic tamper audit logs.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-line bg-panel-2 p-5 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
                        <ShieldAlert size={18} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-ink">National Cadastral Console Access</h4>
                        <p className="text-xs text-ink-2 mt-1 leading-relaxed">
                          Admins inspect global API health, Sentinel-2 5-day automated run telemetry, and statutory compliance status under Evidence Act §65B.
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleFastPass('admin::Director General', 'National Spatial Director', '/admin')}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs sm:text-sm font-bold text-white transition hover:brightness-105 active:scale-95 shadow-xs cursor-pointer"
                      >
                        Enter Admin Console as National Registry Admin <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer with quick exploration link */}
            <div className="mt-8 pt-4 border-t border-line flex flex-wrap items-center justify-between text-xs text-ink-3 gap-2">
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Auth Mode: <strong className="text-ink">{isFirebaseMode ? 'Firebase Production' : 'Local / Demo Fast-Pass'}</strong>
              </span>
              <div className="flex items-center gap-4">
                <Link to="/login" className="hover:text-primary transition underline font-medium">
                  Dedicated Sign-In Page
                </Link>
                <Link to="/map" className="hover:text-primary transition underline font-medium">
                  Browse Map as Guest
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Status Notification on successful login */}
      {signedInLabel && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-8 left-1/2 z-[100000] flex -translate-x-1/2 items-center gap-2.5 rounded-full border border-primary/30 bg-panel px-6 py-3.5 shadow-2xl backdrop-blur-md"
        >
          <CheckCircle2 size={19} className="text-primary animate-pulse" />
          <span className="text-sm font-semibold text-ink">
            Authenticated as <strong className="text-primary">{signedInLabel}</strong> · Loading interface…
          </span>
        </div>
      )}
    </section>
  );
}
