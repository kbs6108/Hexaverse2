/**
 * Auth (CONTRACTS §3). Two modes:
 *  - dev:      identity comes from the Zustand `devUser` and is sent as `X-Dev-User`.
 *  - firebase: Firebase Auth; ID token sent as `Authorization: Bearer`, role/department from custom claims.
 */
import { useEffect, useState, useSyncExternalStore } from 'react';
import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  type Auth,
  type User,
} from 'firebase/auth';
import { env, isDevAuth } from './env';
import { DEV_USERS, useUI, type DevUserId } from './store';
import type { Department, Role } from './cdm';

export interface AuthUser {
  uid: string;
  name: string;
  email?: string | null;
  role: Role;
  department: Department | null;
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

function firebaseAuth(): Auth | null {
  if (isDevAuth) return null;
  if (!auth) {
    app = initializeApp({
      apiKey: env.firebase.apiKey,
      authDomain: env.firebase.authDomain,
      projectId: env.firebase.projectId,
      appId: env.firebase.appId,
    });
    auth = getAuth(app);
  }
  return auth;
}

/* ---------- Firebase user snapshot store (for useSyncExternalStore) ---------- */
type Snapshot = { ready: boolean; user: AuthUser | null };
let snapshot: Snapshot = { ready: isDevAuth, user: null };
const listeners = new Set<() => void>();
let started = false;

function emit() {
  for (const l of listeners) l();
}

async function toAuthUser(u: User): Promise<AuthUser> {
  const token = await u.getIdTokenResult();
  const role = (token.claims.role as Role | undefined) ?? 'citizen';
  const department = (token.claims.department as Department | undefined) ?? null;
  return { uid: u.uid, name: u.displayName ?? u.email ?? 'Signed in', email: u.email, role, department };
}

function start() {
  if (started || isDevAuth) return;
  started = true;
  const a = firebaseAuth();
  if (!a) return;
  onAuthStateChanged(a, async (u) => {
    snapshot = { ready: true, user: u ? await toAuthUser(u) : null };
    emit();
  });
}

function subscribe(cb: () => void) {
  start();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/* ---------- Dev identities ---------- */
export function parseDevUser(id: DevUserId): AuthUser {
  const [role, department, name] = id.split(':') as [Role, string, string];
  return {
    uid: `dev:${id}`,
    name: name || role,
    role,
    department: (department || null) as Department | null,
    email: null,
  };
}

/** Header value/token used by api.ts. Returns null when anonymous. */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  if (isDevAuth) {
    return { 'X-Dev-User': useUI.getState().devUser };
  }
  const a = firebaseAuth();
  const u = a?.currentUser;
  if (!u) return {};
  const token = await u.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

/* ---------- Hook ---------- */
export interface UseAuth {
  ready: boolean;
  user: AuthUser | null;
  role: Role | null;
  department: Department | null;
  mode: 'dev' | 'firebase';
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  devUsers: typeof DEV_USERS;
  setDevUser: (id: DevUserId) => void;
}

export function useAuth(): UseAuth {
  const devUser = useUI((s) => s.devUser);
  const setDevUser = useUI((s) => s.setDevUser);
  const fb = useSyncExternalStore(subscribe, () => snapshot, () => snapshot);

  const user = isDevAuth ? parseDevUser(devUser) : fb.user;
  return {
    ready: isDevAuth ? true : fb.ready,
    user,
    role: user?.role ?? null,
    department: user?.department ?? null,
    mode: isDevAuth ? 'dev' : 'firebase',
    devUsers: DEV_USERS,
    setDevUser,
    signInWithGoogle: async () => {
      const a = firebaseAuth();
      if (!a) return;
      await signInWithPopup(a, new GoogleAuthProvider());
    },
    signInWithEmail: async (email, password) => {
      const a = firebaseAuth();
      if (!a) return;
      await signInWithEmailAndPassword(a, email, password);
    },
    signOut: async () => {
      if (isDevAuth) {
        setDevUser('citizen::Ravi Kumar');
        return;
      }
      const a = firebaseAuth();
      if (a) await fbSignOut(a);
    },
  };
}

/** Reads the current identity outside React (router guards). */
export function currentUser(): AuthUser | null {
  if (isDevAuth) return parseDevUser(useUI.getState().devUser);
  return snapshot.user;
}

export function roleAtLeast(role: Role | null, min: Role): boolean {
  const rank: Record<Role, number> = { citizen: 0, officer: 1, admin: 2 };
  return role !== null && rank[role] >= rank[min];
}

/** Re-render helper: subscribe a component to auth changes without the full hook. */
export function useAuthReady(): boolean {
  const [ready, setReady] = useState(snapshot.ready);
  useEffect(() => {
    const unsub = subscribe(() => setReady(snapshot.ready));
    return () => {
      unsub();
    };
  }, []);
  return ready;
}

/** Resolves once Firebase has reported the initial auth state (immediately in dev mode). */
export function awaitAuthReady(): Promise<void> {
  if (snapshot.ready) return Promise.resolve();
  start();
  return new Promise((resolve) => {
    const unsub = subscribe(() => {
      if (snapshot.ready) {
        unsub();
        resolve();
      }
    });
  });
}
