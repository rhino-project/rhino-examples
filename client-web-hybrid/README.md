# TaskFlow Hybrid — Group-Aware Auth Web Demo

A React (React 18 + Vite) client wired to the **hybrid multi-group Laravel
backend** (`server-laravel-hybrid`). It demonstrates **subdomain-based,
group-aware sign-in** in the browser:

| Subdomain                     | Route group | Org      | Data model         |
|-------------------------------|-------------|----------|--------------------|
| `app.lvh.me:5173`             | `personal`  | _none_   | `personal-projects` (user-owned) |
| `acme.agency.lvh.me:5173`     | `agency`    | `acme`   | `projects` (org-scoped) |
| `globex.vendor.lvh.me:5173`   | `vendor`    | `globex` | `projects` (org-scoped) |

The backend runs `enforce_group_membership = ON`, so a user who belongs to one
group is **denied (403)** on another group's subdomain. That cross-group 403 is
the headline of this demo.

## How it works

- **Group/org detection** (`src/lib/group.ts`): parses `window.location.hostname`.
  `*.agency.lvh.me` → group `agency` (org = leftmost label); `*.vendor.lvh.me` →
  `vendor`; anything else (`app.lvh.me`) → `personal` (org `null`).
- **No route-group prefix, no `setOrganization`**: the groups are *domain*-scoped,
  so the subdomain `Host` header carries BOTH the group and the org. Auth stays at
  `/api/auth/*` and data at `/api/projects` / `/api/personal-projects`.
- **`configureApi({ baseURL: '/api', onForbidden })`** is called once at startup
  (`src/main.tsx`). `onForbidden` surfaces the membership 403.
- **Vite proxy** forwards `/api` to the backend with **`changeOrigin: false`** so
  the original subdomain `Host` reaches Laravel's `Route::domain(...)` matching.

This client is wired to the **local dev** React lib via
`"@rhino-dev/rhino-react": "file:../../rhino-react"`.

## Run

```bash
# 1. Build the local rhino-react lib (its package main is dist/index.js)
cd ../../rhino-react && npm install && npm run build

# 2. Install this client's deps (links the local lib)
cd ../rhino-examples/client-web-hybrid && npm install

# 3. Start the hybrid Laravel backend on port 8002 (bound to all interfaces)
cd ../server-laravel-hybrid
php artisan migrate:fresh --seed   # first time only
php artisan serve --host=0.0.0.0 --port=8002

# 4. Start the Vite dev server (port 5173, answers on *.lvh.me)
cd ../client-web-hybrid && npm run dev
```

Then open in the browser:

- Personal: <http://app.lvh.me:5173>
- Agency:   <http://acme.agency.lvh.me:5173>
- Vendor:   <http://globex.vendor.lvh.me:5173>

`lvh.me` and its wildcards resolve to `127.0.0.1` via public DNS (no `/etc/hosts`
edits needed).

### Seeded accounts

| Group    | Email                  | Password   |
|----------|------------------------|------------|
| personal | `personal@example.com` | `password` |
| agency   | `agency@acme.com`      | `password` |
| vendor   | `vendor@globex.com`    | `password` |

The login page auto-detects the group from the subdomain and pre-fills that
group's account.

### Cross-group 403 demo

Open <http://globex.vendor.lvh.me:5173> and sign in with the **agency** account
(`agency@acme.com` / `password`). Membership enforcement denies it and the page
shows an explicit **"You're not a member of the vendor group"** 403 message.

## Deterministic check (no browser)

With the backend on 8002 and Vite on 5173, prove the proxy → backend → group path
with `curl` through the Vite proxy using `Host` headers:

```bash
# Agency login on the agency subdomain -> token
curl -H 'Host: acme.agency.lvh.me' -X POST http://127.0.0.1:5173/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"agency@acme.com","password":"password"}'

# Same agency creds on the VENDOR subdomain -> 403 (membership)
curl -H 'Host: globex.vendor.lvh.me' -X POST http://127.0.0.1:5173/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"agency@acme.com","password":"password"}'

# Personal user on the apex host -> token
curl -H 'Host: app.lvh.me' -X POST http://127.0.0.1:5173/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"personal@example.com","password":"password"}'
```
