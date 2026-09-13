# Firebase Hosting

The Firebase CLI reads `firebase.json` and `.firebaserc` from the directory you run it in, so the
real files live at the **repo root**:

- `/firebase.json` — `public: apps/web/dist`, SPA rewrite to `/index.html`, immutable cache headers
  for `/assets/**`, `no-cache` for `index.html`, a `predeploy` hook that runs `npm ci` + `npm run build`.
- `/.firebaserc.example` — copy to `/.firebaserc` and put your project id in it (`.firebaserc` is gitignored).

Deploy: `make deploy-web` (equivalent to `firebase deploy --only hosting`). CI alternative:
`.github/workflows/deploy-web.yml` (opt-in, needs the `FIREBASE_SERVICE_ACCOUNT` secret).

The build bakes `VITE_*` values from `apps/web/.env` (see `docs/SETUP.md` §(d)). Set
`VITE_API_URL` to the Cloud Run URL and `VITE_AUTH_MODE=firebase` before deploying.
