# client-mobile-hybrid — multi-face Rhino mobile demo

One Expo / React Native app, **three backend route groups** ("faces"). On launch
you pick which group to sign into — Personal, Agency Workspace, or Vendor Portal —
and the app then shows that group's sign-in and data. Every per-group difference
lives in a single registry file (`src/groups/registry.ts`); the rest of the app
is generic and reads the active face from context.

Wired to the **local dev `@rhino-dev/rhino-react`** (`file:../../rhino-react`) and
the **`server-laravel-hybrid`** backend on port **8002**.

## The three faces

| Face             | Tenant | Host                       | Model               | Seeded login                          |
| ---------------- | ------ | -------------------------- | ------------------- | ------------------------------------- |
| Personal         | no     | `app.lvh.me`               | `personal-projects` | `personal@example.com` / `password`   |
| Agency Workspace | yes    | `acme.agency.lvh.me`       | `projects`          | `agency@acme.com` / `password`        |
| Vendor Portal    | yes    | `globex.vendor.lvh.me`     | `projects`          | `vendor@globex.com` / `password`      |

(All values come from `server-laravel-hybrid/config/rhino.php` + `database/seeders/DatabaseSeeder.php`.)

## How to run

### 1. Build the local dev lib

The app consumes `rhino-react` straight from source over a `file:` symlink, but
its published type bundle is read from `dist/`, so build it once (and after any
lib change):

```bash
cd ../../rhino-react
npm install
npm run build
```

### 2. Start the backend on :8002, bound to all interfaces

`php artisan serve` binds to `127.0.0.1` only by default, which a physical phone
on your LAN can't reach. Bind to `0.0.0.0`:

```bash
cd ../server-laravel-hybrid
php artisan migrate --seed     # first run only
php artisan serve --host=0.0.0.0 --port=8002
```

### 3. Start the app

```bash
npm install        # already done if you followed setup
npx expo start
```

Open it in Expo Go on a device, or `i` / `a` for the iOS / Android simulator.

## How the device reaches the backend

The API `baseURL` and the group selector are **two separate axes** (see `src/lib/api.ts`):

- **`baseURL` = where the bytes go.** Derived from Expo's `hostUri` — the LAN IP
  of the machine running Metro — as `http://<devHost>:8002/api`. That IP is what
  a physical device can actually reach (simulators fall back to `localhost` /
  Android emulator to `10.0.2.2`). Override with `EXPO_PUBLIC_API_URL` if needed.
- **`Host` header = which route group answers.** Laravel disambiguates the three
  groups by `Route::domain(...)`. React Native (unlike a browser) is allowed to
  set the `Host` request header, so when you pick a face we set a default
  `Host: <resolved face host>` on rhino-react's shared axios instance
  (`api.defaults.headers.common.Host`). Laravel then routes the request to that
  group + organization.

> **`lvh.me` does NOT resolve on a physical device.** That's fine — we never point
> `baseURL` at an `lvh.me` host. The request is sent to the dev machine's IP and
> the **`Host` header** is the only thing that selects the group. Tenancy is set
> to `'subdomain'`, so the data hooks build `/api/{model}` (no org path segment);
> the org is carried entirely by the host.

## Adding / removing a face

Edit `src/groups/registry.ts` only — add a `GroupFace` entry (label, host pattern,
model, accent, demo creds). The picker, login, and workspace pick it up
automatically.

## Architecture

| File                          | Role                                                              |
| ----------------------------- | ----------------------------------------------------------------- |
| `src/groups/registry.ts`      | The ONLY place per-group specifics live (hosts/models/creds/accent). |
| `src/groups/GroupContext.tsx` | Active face + resolved host + org; persisted; wires the API target. |
| `app/index.tsx`               | `GroupSelect` entry screen (cards + org-slug input).              |
| `app/login.tsx`               | Generic login: face banner, prefilled demo creds, 403 = membership denial, switch-group. |
| `app/workspace.tsx`           | Generic workspace: `useModelIndex(face.model)`, face banner.      |
| `src/lib/api.ts`              | `baseURL` (dev host) + per-face `Host` header wiring.             |
| `metro.config.js`             | Local-lib `watchFolders` + React/RN dedupe (see below).           |

## Metro: local linked lib + React dedupe

`rhino-react`'s `react-native` entry is `./src/index.ts`, so Metro bundles the
lib's **TypeScript source**. Because the lib is a symlink with its **own**
`node_modules` (including its own React), `metro.config.js`:

1. adds `../../rhino-react` to `watchFolders` so lib edits hot-reload;
2. sets `resolver.nodeModulesPaths` to this app's `node_modules`;
3. hard-pins React, React Native, react-query, axios, clsx, tailwind-merge and
   async-storage via `resolver.extraNodeModules` so the symlinked lib can never
   reach a second copy (which would cause the duplicate-React "Invalid hook call").

We do **not** set `disableHierarchicalLookup` — `react-native` resolves some of
its own deps (e.g. `@react-native/virtualized-lists`) from its nested
`node_modules`, which that flag would break.

## Membership demo

Group membership is enforced on the backend. Sign into the **Vendor Portal** face
with the **agency** creds (`agency@acme.com`) and you'll get a 403 → the app shows
"You're not a member of the Vendor Portal." Use the seeded creds for each face for
a 200.

## Verifying

```bash
npx tsc --noEmit                 # type-clean
npx expo export --platform ios   # confirms Metro resolves the local lib, no dup React
```

A real-device end-to-end run is manual: start the backend (`--host=0.0.0.0
--port=8002`), `npx expo start`, open in Expo Go, pick a face, sign in with the
seeded creds, and confirm the workspace lists that group's model.
