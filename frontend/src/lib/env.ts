/** Typed access to VITE_* environment variables (see CONTRACTS §2). */
const e = import.meta.env;

export const env = {
  apiUrl: (e.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? 'http://localhost:8000',
  authMode: ((e.VITE_AUTH_MODE as string | undefined) ?? 'dev') === 'firebase' ? 'firebase' : 'dev',
  firebase: {
    apiKey: (e.VITE_FIREBASE_API_KEY as string | undefined) ?? '',
    authDomain: (e.VITE_FIREBASE_AUTH_DOMAIN as string | undefined) ?? '',
    projectId: (e.VITE_FIREBASE_PROJECT_ID as string | undefined) ?? '',
    appId: (e.VITE_FIREBASE_APP_ID as string | undefined) ?? '',
  },
  esriApiKey: (e.VITE_ESRI_API_KEY as string | undefined) ?? '',
  defaultCenter: parseCenter((e.VITE_DEFAULT_CENTER as string | undefined) ?? '80.5560,16.4420'),
  defaultZoom: Number((e.VITE_DEFAULT_ZOOM as string | undefined) ?? '15') || 15,
} as const;

function parseCenter(s: string): [number, number] {
  const [lng, lat] = s.split(',').map((v) => Number(v.trim()));
  if (lng === undefined || lat === undefined || Number.isNaN(lng) || Number.isNaN(lat)) return [80.556, 16.442];
  return [lng, lat];
}

export const isDevAuth = env.authMode === 'dev';
