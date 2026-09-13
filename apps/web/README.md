# Land Stack Web

Vite 7 · React 19 · TypeScript · MapLibre GL (via react-map-gl) · TanStack Router + Query ·
Zustand · Tailwind v4 · ECharts · Firebase Auth.

## Run

```bash
cd apps/web
npm ci
cp .env.example .env        # VITE_API_URL, VITE_AUTH_MODE, optional Firebase + Esri keys
npm run dev                 # http://localhost:5173
```

`npm run build` runs `tsc --noEmit` then `vite build` into `dist/`, which Firebase Hosting serves
(`firebase.json` at the repo root has the SPA rewrite). The `prebuild`/`predev` step copies
`data/samples/story_parcels.json` into `public/data/` for the demo shortcut chips.

## How it fits together

- **Map** — basemap from OpenFreeMap (no key) with an optional Esri World Imagery layer when
  `VITE_ESRI_API_KEY` is set. Parcels and every other GIS layer come from the API as vector tiles
  (`/landstack/tiles/{layer}/{z}/{x}/{y}.pbf`) with `promoteId: 'ulpin'`, so hover/selection use
  MapLibre feature-state and never refetch. The layer panel is organised in the three tiers the
  problem statement names: Base · Essential governance · Use-case. "3D units · preview" extrudes
  building units (`base_m`/`height_m`) with a 55° pitch.
- **Parcel drawer** — renders the CDM from `GET /landstack/parcels/{ulpin}`; every section shows a
  provenance badge (source system, latency, as-of) and degrades to "Source unavailable" per block.
- **Auth** — `VITE_AUTH_MODE=dev` shows a role switcher with the six demo users and sends
  `X-Dev-User`; `firebase` mode uses Google / email sign-in and sends the ID token. Roles and
  department come from custom claims.
- **Routes** — `/` map · `/citizen/*` · `/officer/*` · `/admin/*` · `/verify/:id` (public report
  verification) · `/login`.

## Structure

```
src/app         router, providers, shell
src/lib         api.ts (typed client), auth.ts, cdm.ts (CDM types), store.ts, env.ts, format.ts
src/components  Button, Card, Badge, Tabs, Drawer, Field, StatusChip, ProvenanceBadge, Toast…
src/features    map/ parcel/ citizen/ officer/ admin/ verify/ auth/
```

## Design tokens

CSS variables in `src/styles.css` (light + dark): ground `#F6F5F0`/`#14181A`, primary green
`#0E6B54`/`#4FC39F`, amber pending, brick disputed, violet mortgaged, slate government.
Headings: Bricolage Grotesque · body: IBM Plex Sans · identifiers: IBM Plex Mono. Status is never
colour-only (icons and a hatch pattern for disputed parcels).
