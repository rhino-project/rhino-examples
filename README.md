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
| [`server-laravel/`](./server-laravel) | Laravel 11 + PHP 8.4 | `8000` | `composer require rhino-project/rhino-laravel` |
| [`server-rails/`](./server-rails) | Rails 7 + Ruby 3.3 | `3000` | `bundle add rhino-rails` |
| [`server-nestjs/`](./server-nestjs) | NestJS 10 + Prisma | `8004` | `npm i @rhino-dev/rhino-nestjs` |
| [`client-web/`](./client-web) | React 19 + Vite + Tailwind | `5173` | `npm i @rhino-dev/rhino-react` |
| [`client-mobile/`](./client-mobile) | Expo SDK 54 + React Native 0.81 | Expo | `npm i @rhino-dev/rhino-react` |

All five apps share the same product spec — see [`PRD.md`](./PRD.md) for the 28 features covered.

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
        │  Laravel 11   │  │  Rails 7     │  │  NestJS 10   │
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
