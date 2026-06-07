# Rhino Desktop example (Electron)

A minimal **Electron** desktop client that uses `@rhino-dev/rhino-react` against
the single-tenant Laravel server (`server-laravel-single`). It demonstrates the
**Electron storage integration**: the auth token is stored **encrypted at rest
via the OS keychain** (Electron `safeStorage`) in the *main* process and reached
from the renderer over IPC — it never touches renderer `localStorage`.

There is **no separate `rhino-electron` package** — Electron support lives in
`@rhino-dev/rhino-react` via three subpath modules:

| Layer | Import | Role |
|---|---|---|
| Main | `@rhino-dev/rhino-react/electron` → `registerRhinoSecureStorage()` | `safeStorage`-backed store + IPC handlers |
| Preload | `@rhino-dev/rhino-react/electron/preload` → `exposeRhinoStorage()` | exposes `window.rhino.storage` |
| Renderer | `@rhino-dev/rhino-react/electron/renderer` → `createElectronStorage()` / `initElectronStorage()` | sync adapter passed to `configureApi({ storage })` |

The renderer otherwise uses the **same** hooks as the web/mobile clients
(`useAuth`, `useModelIndex`, `configureApi`).

## Run it

1. **Build the library** (so `dist/` exists for the `file:` link):
   ```bash
   cd ../../rhino-react && npm install && npm run build
   ```

2. **Start the single-tenant Laravel server** on `:8000` (see
   `../server-laravel-single/README.md`):
   ```bash
   cd ../server-laravel-single && php artisan serve
   ```

3. **Run the desktop app:**
   ```bash
   cd ../client-desktop
   npm install        # downloads the Electron binary
   npm run dev        # electron-vite: launches the window with HMR
   ```

Sign in with a seeded account (`alice@example.com` / `password`). Quit and
relaunch — you stay signed in, because the token was persisted (encrypted) by
the main process, not in the renderer.

> **Linux note:** Electron's bundled `chrome-sandbox` needs to be setuid-root,
> which `npm install` can't set. The `dev` script therefore passes electron-vite's
> **`--noSandbox`** flag so it runs without `sudo` (dev only — `build`/`preview`
> keep the sandbox). If you'd rather keep the sandbox in dev, drop `--noSandbox`
> from the `dev` script and run once:
> `sudo chown root node_modules/electron/dist/chrome-sandbox && sudo chmod 4755 node_modules/electron/dist/chrome-sandbox`.

## How it's wired

- **`src/main/index.ts`** — `registerRhinoSecureStorage({ ipcMain, safeStorage, app, fs, path })`
  writes an encrypted blob under the app's `userData` dir.
- **`src/preload/index.ts`** — `exposeRhinoStorage({ contextBridge, ipcRenderer })`.
- **`src/renderer/main.tsx`** — `await initElectronStorage()` hydrates the token,
  then `configureApi({ baseURL: '/api', tenancy: 'subdomain', storage: createElectronStorage() })`.

## Dev vs. packaged

In **dev**, the renderer hits relative `/api`, proxied to `127.0.0.1:8000` by
electron-vite (no CORS). For a **packaged** build you'd switch to an absolute
`baseURL` and, ideally, route requests through the main process to avoid browser
CORS entirely — out of scope for this example, which focuses on secure storage.

> Note: `npm install` downloads the Electron binary (~100 MB) and `npm run dev`
> opens a native window, so this example needs a desktop environment.
