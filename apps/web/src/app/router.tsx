import { createRootRoute, createRoute, createRouter, redirect } from '@tanstack/react-router';
import { Shell } from './Shell';
import { awaitAuthReady, currentUser, roleAtLeast } from '@/lib/auth';
import type { Role } from '@/lib/cdm';
import { MapPage } from '@/features/map/MapPage';
import { CitizenLayout, CitizenHome } from '@/features/citizen/CitizenHome';
import { VerifyOwnership } from '@/features/citizen/VerifyOwnership';
import { TrackApplication } from '@/features/citizen/TrackApplication';
import { ServiceRequest } from '@/features/citizen/ServiceRequest';
import { OfficerLayout, OfficerConsole } from '@/features/officer/OfficerConsole';
import { QueuePage } from '@/features/officer/Queue';
import { AlertsPage } from '@/features/officer/Alerts';
import { AdminConsole } from '@/features/admin/AdminConsole';
import { VerifyPage } from '@/features/verify/VerifyPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { NotFound } from './NotFound';

const rootRoute = createRootRoute({ component: Shell, notFoundComponent: NotFound });

/** Role guard: anonymous → /login; insufficient role → / */
function guard(min: Role) {
  return async ({ location }: { location: { href: string } }) => {
    await awaitAuthReady();
    const u = currentUser();
    if (!u) throw redirect({ to: '/login', search: { next: location.href } });
    if (!roleAtLeast(u.role, min)) throw redirect({ to: '/' });
  };
}

type MapSearch = { ulpin?: string };
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: MapPage,
  validateSearch: (s: Record<string, unknown>): MapSearch => (typeof s.ulpin === 'string' && s.ulpin ? { ulpin: s.ulpin } : {}),
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
  validateSearch: (s: Record<string, unknown>): { next?: string } => (typeof s.next === 'string' ? { next: s.next } : {}),
});

const verifyRoute = createRoute({ getParentRoute: () => rootRoute, path: '/verify/$id', component: VerifyPage });

/* ---- citizen ---- */
const citizenRoute = createRoute({ getParentRoute: () => rootRoute, path: '/citizen', component: CitizenLayout, beforeLoad: guard('citizen') });
const citizenIndex = createRoute({ getParentRoute: () => citizenRoute, path: '/', component: CitizenHome });
type UlpinSearch = { ulpin?: string; type?: string };
const ulpinSearch = (s: Record<string, unknown>): UlpinSearch => ({
  ...(typeof s.ulpin === 'string' && s.ulpin ? { ulpin: s.ulpin } : {}),
  ...(typeof s.type === 'string' && s.type ? { type: s.type } : {}),
});
const citizenVerify = createRoute({ getParentRoute: () => citizenRoute, path: '/verify', component: VerifyOwnership, validateSearch: ulpinSearch });
const citizenTrack = createRoute({ getParentRoute: () => citizenRoute, path: '/track', component: TrackApplication });
const citizenTrackDetail = createRoute({ getParentRoute: () => citizenRoute, path: '/track/$id', component: TrackApplication });
const citizenRequest = createRoute({ getParentRoute: () => citizenRoute, path: '/request', component: ServiceRequest, validateSearch: ulpinSearch });

/* ---- officer ---- */
const officerRoute = createRoute({ getParentRoute: () => rootRoute, path: '/officer', component: OfficerLayout, beforeLoad: guard('officer') });
const officerIndex = createRoute({ getParentRoute: () => officerRoute, path: '/', component: OfficerConsole });
type QueueSearch = { department?: string; app?: string };
const officerQueue = createRoute({
  getParentRoute: () => officerRoute,
  path: '/queue',
  component: QueuePage,
  validateSearch: (s: Record<string, unknown>): QueueSearch => ({
    ...(typeof s.department === 'string' && s.department ? { department: s.department } : {}),
    ...(typeof s.app === 'string' && s.app ? { app: s.app } : {}),
  }),
});
const officerAlerts = createRoute({ getParentRoute: () => officerRoute, path: '/alerts', component: AlertsPage });

/* ---- admin ---- */
const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminConsole,
  beforeLoad: guard('admin'),
  validateSearch: (s: Record<string, unknown>): { ulpin?: string } => (typeof s.ulpin === 'string' && s.ulpin ? { ulpin: s.ulpin } : {}),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  verifyRoute,
  citizenRoute.addChildren([citizenIndex, citizenVerify, citizenTrack, citizenTrackDetail, citizenRequest]),
  officerRoute.addChildren([officerIndex, officerQueue, officerAlerts]),
  adminRoute,
]);

export const router = createRouter({ routeTree, defaultPreload: 'intent', scrollRestoration: true });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export { indexRoute, citizenVerify, citizenRequest, officerQueue, loginRoute, citizenTrackDetail, verifyRoute };
