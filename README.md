# Rhino Examples — TaskFlow

> The same multi-tenant project-management SaaS, built five times — in **Laravel**, **Rails**, **NestJS**, **React**, and **React Native** — to show what [Rhino](https://github.com/rhino-project) gives you out of the box.

[![CI](https://github.com/rhino-project/rhino-examples/actions/workflows/ci.yml/badge.svg)](https://github.com/rhino-project/rhino-examples/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rhino--project.github.io-blue)](https://rhino-project.github.io/rhino-docs/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## What is Rhino?

Rhino is a **convention-over-configuration** library that turns plain models into a complete REST API — CRUD endpoints, multi-tenancy, role-based access, soft deletes, audit trails, blueprint-driven scaffolding, and exportable TypeScript types — without writing controllers.

You describe your domain once (a model + a policy). Rhino gives you:

- `GET / POST / PATCH / DELETE` for every resource
- Per-attribute permissions (hide `budget` from viewers, show it to admins)
- Multi-tenant URL scoping (`/api/{org-slug}/...`)
- `?filter[...] ?sort ?include ?search` query support
- Auto-generated TypeScript clients and Postman collections

This repo is the **reference implementation** — the same product (TaskFlow), the same API contract, three backends, two clients. Pick the stack you already know; the API behaves the same.

---

## What's in the box

| Directory | Stack | Default Port | Install |
|---|---|---|---|
| [`server-laravel/`](./server-laravel) | Laravel 13 + PHP 8.4 | `8000` | `composer require rhino-project/rhino-laravel` |
| [`server-rails/`](./server-rails) | Rails 7 + Ruby 3.3 | `3000` | `bundle add rhino-rails` |
| [`server-nestjs/`](./server-nestjs) | NestJS 10 + Prisma | `8004` | `npm i @rhino-dev/rhino-nestjs` |
| [`client-web/`](./client-web) | React 19 + Vite + Tailwind | `5173` | `npm i @rhino-dev/rhino-react` |
| [`client-mobile/`](./client-mobile) | Expo SDK 54 + React Native 0.81 | Expo | `npm i @rhino-dev/rhino-react` |

All five apps share the same product spec — see [`PRD.md`](./PRD.md) for the 28 features covered.

---

## Configuration variants

> These build the **same TaskFlow domain** in three multi-tenancy shapes (single / multi / hybrid) across all three backends. Like the base apps, they install the libraries **from the registry** (Composer `^4.2.0`, Bundler `~> 4.2.0`, npm `^4.2.0`) — no local checkout of the `rhino-*` repos required.

The base `server-laravel` / `server-rails` / `server-nestjs` above show **one** multi-tenancy shape: the classic path-prefix tenant (`/api/{org}/...`). Real apps come in more shapes, and Rhino expresses them with route-group **config**, not controllers. These variants build the **same TaskFlow domain** three different ways, in **all three backends**, so you can see and test each end to end:

| Variant | Tenancy model | What it demonstrates | Ports (LV / RB / Nest) |
|---|---|---|---|
| `*-single` | **Single-tenant, no org** | No `Organization`/`Role`/`UserRole` at all — every record is owned by its `user_id`; shared reference tables (labels) stay global. | 8000 / 3000 / 8004 |
| `*-multi` | **Multitenant-only** | One `tenant` group, `/api/{org}/...`, org-scoped data — same shape as the base app. | 8001 / 3001 / 8005 |
| `*-hybrid` | **Hybrid (multiple groups)** | Three route groups in one app: a user-owned `personal` group **plus** two org-scoped client types (`agency`, `vendor`) on **separate subdomains**, each with its **own sign-in** + group-membership enforcement. | 8002 / 3002 / 8006 |

### Running the variants — setup

Each app installs its Rhino library from the registry, so a plain install is enough. Per-stack prerequisites:

- **Laravel** (`server-laravel-*`): needs **PHP ≥ 8.4.1** — the apps are on Laravel 13 / Symfony 8. `composer install && cp .env.example .env && php artisan key:generate && php artisan migrate:fresh --seed`.
- **Rails** (`server-rails-*`): needs the Ruby in `.ruby-version` (**3.4.7**). `bundle install && bin/rails db:prepare && bin/rails db:seed`.
- **NestJS** (`server-nestjs-*`): **copy the env file** first — `cp .env.example .env` — then `npx prisma migrate deploy && npm run db:seed`. (`.env` is git-ignored; `.env.example` carries the right `PORT` and `DATABASE_URL`.)

Seeded credentials differ per variant (all passwords `password`, except NestJS which uses `password123`):

| Variant | Sign-in accounts | Org slug(s) |
|---|---|---|
| `*-single` | `alice@example.com`, `bob@example.com` | — (no orgs) |
| `*-multi` | `alice@acme.com` … (`carol`, `dave`) | `acme-corp`, `globex-inc` (NestJS seeds `acme` / `globex`) |
| `*-hybrid` | `agency@acme.com` (agency), `vendor@globex.com` (vendor), `personal@example.com` (personal; NestJS: `solo@app.com`) | `acme` (agency), `globex` (vendor) |

A ready-made `.vscode/launch.json` (with compound "stack" launchers and the full port map) is included for running servers + clients from the editor.

### Why they exist

- **Show the range of Rhino multi-tenancy** — single-tenant, multitenant, and hybrid multi-group — as a config change over one codebase, not a rewrite.
- **Exercise the newer library features** end to end: per-group `domain` route groups (subdomains), group-aware auth (a separate sign-in per group), `user_roles` group membership + enforcement, and auth lifecycle hooks.

### Multi-face clients

`client-web-hybrid` and `client-mobile-hybrid` are the hybrid app's front ends. The **first screen is a group picker** (personal / agency / vendor) — one app presenting multiple "faces." All per-group differences live in a single `src/groups/registry.ts`, so adding/removing a face is a one-file change.

### Running a hybrid app + testing subdomains locally

Subdomain route groups need host-based routing. Use **`lvh.me`** (and any subdomain of it) — it resolves to `127.0.0.1` with no `/etc/hosts` edits and works with ports:

```bash
cd server-laravel-hybrid && php artisan serve --host=0.0.0.0 --port=8002
#   personal -> http://app.lvh.me:8002
#   agency   -> http://acme.agency.lvh.me:8002      (domain {organization}.agency.lvh.me)
#   vendor   -> http://globex.vendor.lvh.me:8002    (domain {organization}.vendor.lvh.me)
```

For scripted/offline checks (no DNS), send the `Host` header directly:

```bash
curl -H 'Host: acme.agency.lvh.me' http://127.0.0.1:8002/api/...
```

(Rails dev also needs `config.hosts << /.*\.lvh\.me/`. On a **physical mobile device** `lvh.me` won't resolve, so `client-mobile-hybrid` targets the dev machine's IP and sets a per-face `Host` header instead — see its README.)

### Base vs. variants

The base `server-*` apps are the minimal "production-style" reference (one multi-tenancy shape). The `*-single` / `*-multi` / `*-hybrid` variants demonstrate the full range of Rhino's tenancy models over the same domain. Both install the libraries from the registry; the base and `*-multi` overlap **by design** (same config).

---

## Architecture

```
        ┌─────────────────────┐      ┌─────────────────────┐
        │   client-web        │      │   client-mobile     │
        │   React + Vite      │      │   Expo / RN         │
        └──────────┬──────────┘      └──────────┬──────────┘
                   │                            │
                   │   @rhino-dev/rhino-react   │
                   └──────────────┬─────────────┘
                                  │
                ┌─────────────────┼─────────────────┐
                │                 │                 │
        ┌───────▼──────┐  ┌───────▼──────┐  ┌──────▼───────┐
        │ server-laravel│  │ server-rails │  │ server-nestjs│
        │  Laravel 13   │  │  Rails 7     │  │  NestJS 10   │
        └───────┬───────┘  └───────┬──────┘  └──────┬───────┘
                │                  │                │
                └──────────────────┼────────────────┘
                                   │
                            ┌──────▼──────┐
                            │  Database   │
                            │ SQLite/PG   │
                            └─────────────┘
```

Each backend exposes the same REST surface under `/api/{org-slug}/...`. Swap the `baseURL` in either client and it just works.

---

## Quick start (60 seconds)

Pick one backend and one client. They're independent — no Docker, no orchestration.

<details>
<summary><b>Laravel backend</b> (port 8000)</summary>

```bash
cd server-laravel
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve --host=0.0.0.0 --port=8000
```

> `--host=0.0.0.0` is required if you want a phone on the same LAN to reach the API (Expo Go). Drop it for sim-only.

</details>

<details>
<summary><b>Rails backend</b> (port 3000)</summary>

```bash
cd server-rails
bundle install
bin/rails db:setup
bin/rails server -b 0.0.0.0 -p 3000
```

</details>

<details>
<summary><b>NestJS backend</b> (port 8004)</summary>

```bash
cd server-nestjs
npm install
npx prisma migrate deploy
npm run seed
npm run start:dev
```

</details>

<details>
<summary><b>React web client</b> (Vite, port 5173)</summary>

```bash
cd client-web
npm install
npm run dev
```

Open http://localhost:5173 and log in (credentials below).

</details>

<details>
<summary><b>React Native client</b> (Expo)</summary>

```bash
cd client-mobile
npm install
npx expo start
```

Scan the QR code with **Expo Go**. The app auto-detects your dev machine's LAN IP via Expo's `hostUri` — make sure your Laravel/Rails server is bound to `0.0.0.0`.

</details>

---

## Seeded users

All backends seed the same fixtures. Default password is `password` (NestJS uses `password123`).

| Email | Role | What they see |
|---|---|---|
| `alice@acme.com` | Admin | Everything — budgets, internal notes, member management |
| `bob@acme.com` | Manager | Manages projects, sees budgets, can invite members |
| `carol@acme.com` | Member | Creates / edits tasks; **budget hidden** |
| `dave@acme.com` | Viewer | Read-only; **budget and internal notes hidden** |
| `eve@globex.com` | Admin (other org) | Demonstrates tenant isolation — can't see Acme data |

> The org slug is `acme` (or `globex` for Eve). Auth requests look like `POST /api/acme/auth/sign-in`.

---

## Highlights to play with

Log in as different users to see Rhino's per-attribute RBAC in action:

- **`alice` vs `dave`** — fetch `GET /api/acme/projects/1`. Alice gets `budget` and `internal_notes`. Dave's response simply omits those keys — same endpoint, different shape, zero controller code.
- **Multi-tenancy** — try `GET /api/globex/projects` as `alice@acme.com`. 403. The org slug is enforced on every route.
- **Query string superpowers** — `GET /api/acme/tasks?filter[status]=open&sort=-created_at&include=assignee,labels&search=deploy`. All free.
- **Soft delete + restore** — `DELETE /api/acme/tasks/42` then visit `/api/acme/tasks/42?with_archived=true`.
- **Audit trail** — every change to a Project shows up in `/api/acme/projects/1/audits`.
- **Invitations** — `POST /api/acme/invitations` to add a member; they get a tokenized signup link.

See [`PRD.md`](./PRD.md) for the full feature matrix.

---

## Generate a typed client

Each backend ships a command that emits a `.d.ts` of every model:

```bash
# Laravel
php artisan rhino:export-types --output=../client-web/rhino.d.ts

# Rails
bundle exec rake rhino:export_types

# NestJS
npx rhino export-types
```

The React clients drop the file in and get `useModelIndex<'Project'>()`, `useModelShow<'Task'>()`, etc. — fully typed.

---

## Postman / Insomnia

Each backend can also export an OpenAPI-compatible Postman collection:

```bash
# Laravel
php artisan rhino:export-postman > rhino.postman_collection.json

# Rails
bundle exec rake rhino:export_postman

# NestJS
npx rhino export-postman
```

---

## Project layout

```
rhino-examples/
├── server-laravel/      # Laravel + rhino-project/rhino-laravel
├── server-rails/        # Rails + rhino-rails
├── server-nestjs/       # NestJS + @rhino-dev/rhino-nestjs
├── client-web/          # React 19 + Vite + Tailwind + @rhino-dev/rhino-react
├── client-mobile/       # Expo SDK 54 + @rhino-dev/rhino-react
├── PRD.md               # Product spec — 28 features
└── README.md            # You are here
```

---

## Resources

| | Library | Repo | Registry |
|---|---|---|---|
| 🐘 | `rhino-project/rhino-laravel` | [GitHub](https://github.com/rhino-project/rhino-laravel) | [Packagist](https://packagist.org/packages/rhino-project/rhino-laravel) |
| 💎 | `rhino-rails` | [GitHub](https://github.com/rhino-project/rhino-rails) | [RubyGems](https://rubygems.org/gems/rhino-rails) |
| 🪺 | `@rhino-dev/rhino-nestjs` | [GitHub](https://github.com/rhino-project/rhino-nestjs) | [npm](https://www.npmjs.com/package/@rhino-dev/rhino-nestjs) |
| ⚛️ | `@rhino-dev/rhino-react` | [GitHub](https://github.com/rhino-project/rhino-react) | [npm](https://www.npmjs.com/package/@rhino-dev/rhino-react) |
| 📘 | Documentation | [rhino-docs](https://github.com/rhino-project/rhino-docs) | [Site](https://rhino-project.github.io/rhino-docs/) |

---

## License

MIT — see [LICENSE](LICENSE).
