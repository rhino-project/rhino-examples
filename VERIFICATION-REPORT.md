# TaskFlow config-variants — Verification Report

**Branch:** `examples/config-variants`
**Date:** 2026-06-07
**Goal:** Confirm the single / multitenant / hybrid example variants work end-to-end against the **local dev libraries** (sibling `rhino-*` repos on `main`) before merging to `main`.
**Scope tested:** all 9 backends (Laravel / Rails / NestJS × single / multi / hybrid) + 3 web clients. Mobile (Expo) and desktop (Electron) skipped per request.

---

## Verdict

**All three variants work across all three backends.** Auth, resource listing, org scoping, tenant isolation, per-attribute RBAC, subdomain route groups, and group-membership enforcement all behaved correctly. The web clients (single / multi / hybrid) sign in and render live data with **clean consoles**.

There are **no functional blockers in the library**. There **are** several setup rough edges in the example apps (mostly missing setup steps and one cross-stack behavior inconsistency) that should be fixed or documented before merge — listed at the bottom.

Dev-lib wiring confirmed: Laravel/Rails consume the sibling repos as source (Composer `path:` / Bundler `path:`); the JS packages are symlinked (`file:` → `../../rhino-react`, `../../rhino-nestjs`). There is **no `dev-main` branch** — the latest dev line is `main` on every lib (ahead of `release/4.1.0`), so all libs were left on `main`.

---

## Results matrix

| Variant | Backend | Port | Boot | Auth | Resources | Notes |
|---|---|---|---|---|---|---|
| **single** | Laravel | 8000 | ✅ | ✅ `org:null` | ✅ projects/tasks/labels 200 | allowlists enforced (400 on disallowed include/sort); owner sees `budget`/`internal_notes` |
| single | Rails | 3000 | ✅ | ✅ `org:null` | ✅ 200 | |
| single | NestJS | 8004 | ✅ | ✅ `org:null` | ✅ 200 | |
| **multi** | Laravel | 8001 | ✅ | ✅ `org:acme-corp` | ✅ 200 | tenant isolation: acme→globex = 404; admin sees budget |
| multi | Rails | 3001 | ✅ | ✅ `org:acme-corp` | ✅ 200 | isolation = 404 |
| multi | NestJS | 8005 | ✅ | ✅ `org:acme` | ✅ 200 | org slug seeded `acme` (not `acme-corp`) |
| **hybrid** | Laravel | 8002 | ✅ | ✅ per-group | ✅ all 3 groups | cross-group login = **403**; subdomain routing OK |
| hybrid | Rails | 3002 | ✅ | ✅ per-group | ✅ all 3 groups | cross-group login = **403** |
| hybrid | NestJS | 8006 | ✅ | ✅ per-group | ✅ all 3 groups | cross-group **resource** = 403, but **login = 201** (see Finding F6) |

**Web clients** (browser sign-in verified, console clean):

| Client | Port | Backend | Result |
|---|---|---|---|
| `client-web-single` | 5180 | laravel-single :8000 | ✅ dashboard: 5 projects / 21 tasks / 10 labels |
| `client-web` (multi) | 5173 | laravel-multi :8001¹ | ✅ `alice@acme.com`, org `/acme-corp`, projects/tasks/labels |
| `client-web-hybrid` | 5182 | laravel-hybrid :8002 | ✅ group picker → personal sign-in loads `personal-projects`; cross-group Agency sign-in shows **403 membership denied** |

¹ `client-web`'s Vite proxy is hardcoded to `:8000`; temporarily repointed to `:8001` for the multi test and **reverted**. There is no dedicated `client-web-multi`.

---

## What was verified in depth

- **Single-tenant**: login returns `organization_slug: null`; data hooks hit `/api/{model}` (no org segment, `tenancy:'subdomain'`). Query allowlists enforced — `?include=labels` and `?sort=-id` correctly return **400** when not in the model's allow-list.
- **Multitenant**: login returns the org slug; data is org-scoped at `/api/{org}/{model}`; cross-tenant access (`acme` user → `globex-inc`) returns **404** (info-hiding). Per-attribute RBAC: admin `alice` sees `budget` + `internal_notes`.
- **Hybrid**: three route groups on subdomains (`app.lvh.me` personal / `{org}.agency.lvh.me` / `{org}.vendor.lvh.me`), each with its own sign-in. Membership enforced: an agency member is denied vendor access. Verified via `Host:` headers and in the browser.

---

## Environment prerequisites discovered (needed to run, not bugs)

1. **PHP 8.4 required.** The Laravel apps pin Laravel 13 + Symfony 8 (`composer.lock`), which require **PHP ≥ 8.4.1**. The box had 8.3.30; installed `php@8.4` via Homebrew. (README says "Laravel 11 + PHP 8.4" — the label is stale; it's Laravel 13.)
2. **Dev JS libs must be built first.** `rhino-react` and `rhino-nestjs` are TS source repos whose `package.json` `exports` point to `dist/`. Until built (`npm install && npm run build`), Vite fails with *“Failed to resolve entry for package @rhino-dev/rhino-react”* and Nest can't resolve `@rhino-dev/rhino-nestjs`. Built both.
3. **Ruby:** ran Rails under `RBENV_VERSION=3.4.4` (see Finding F1).

---

## Findings to address before merge

| # | Severity | Area | Issue |
|---|---|---|---|
| **F1** | **High** | Rails (all 3) | `.ruby-version` pins **`4.0.4`**, which is not a released/installable Ruby. `bin/rails` is blocked by the rbenv shim for anyone who doesn't have that exact version. Gemfile.lock has **no** Ruby pin and the apps run fine on 3.4.x. → set `.ruby-version` to a real version (e.g. `3.4.4`). |
| **F2** | **Med** | NestJS (all 3) | No `.env` is shipped (only `.env.example`), and the README quick-start never says to copy it. Without `DATABASE_URL`, Prisma + the app fail. → add a setup step or commit a dev `.env`. |
| **F3** | **Med** | NestJS (all 3) | `npm run db:seed` runs `ts-node prisma/seed.ts` directly, which does **not** load `.env` → fails with *“Environment variable not found: DATABASE_URL”*. The CLI loads `.env`, ts-node doesn't. → use `prisma db seed` or load dotenv at the top of `seed.ts`. |
| **F4** | **Med** | NestJS (all 3) | Every variant `.env(.example)` ships `PORT=8004`; multi/hybrid then collide with single if run together. README documents 8004/8005/8006. → set distinct PORT per variant (the new `.vscode/launch.json` overrides PORT to compensate). |
| **F5** | Low | README | Quick-start doesn't mention building the sibling dev libs (Finding-prereq #2) for the variants — first-run will fail without it. |
| **F6** | **Med** | Cross-stack parity | **Group-membership enforcement point differs.** Laravel & Rails reject a cross-group **login** with `403` at `/auth/login`. NestJS **issues a token** (`201`, scoped to the user's real org) and only returns `403 MEMBERSHIP_DENIED` on the **resource** request. Net security is equivalent (no cross-group data leak), but behavior differs — and `client-web-hybrid`'s LoginPage assumes the login itself returns the 403. Worth aligning, given the project's "identical across stacks" rule. |
| **F7** | Low | Seeds | Cosmetic per-stack differences: org slug `acme` (Nest) vs `acme-corp` (LV/RB); personal user `solo@app.com` (Nest) vs `personal@example.com` (LV/RB); Nest models personal as the `projects` slug while LV/RB use a separate `personal-projects` model. Not bugs, but the README's single credential table doesn't match the variants. |

---

## Artifacts produced

- **`.vscode/launch.json`** — run configs (incl. compound "stacks") for every server and web client, with the documented port map. NestJS configs override `PORT` to work around F4.
- **`.claude/launch.json`** (workspace root) — preview server configs used to drive the browser sign-in checks.

## How to reproduce a stack quickly

```bash
# libs (once): build the JS dev libs
( cd rhino-react   && npm i && npm run build )
( cd rhino-nestjs  && npm i && npm run build )

# single-tenant Laravel + web
export PATH="/opt/homebrew/opt/php@8.4/bin:$PATH"
( cd rhino-examples/server-laravel-single && composer install && cp -n .env.example .env \
  && php artisan key:generate && php artisan migrate:fresh --seed \
  && php artisan serve --port=8000 )
( cd rhino-examples/client-web-single && npm i && npm run dev -- --port 5180 )
# sign in: alice@example.com / password   (NestJS seeds use password123)
```
