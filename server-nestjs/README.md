# TaskFlow — Rhino NestJS reference

Implements the shared PRD (`../PRD.md`) using `@rhino-dev/rhino-nestjs`. Produces identical JSON responses to the Laravel (`../server-laravel`, port 8001) and Rails (`../server-rails`, port 8003) reference implementations.

## Quick start

```bash
npm ci
cp .env.example .env
npx prisma migrate dev --schema=prisma/schema.prisma
npx ts-node prisma/seed.ts
npx ts-node src/main.ts   # → http://localhost:8004
```

## Verify parity

Alongside the Laravel (`php artisan serve --port 8001`) and/or Rails (`bin/rails s -p 8003`) stacks running:

```bash
TOKEN=$(curl -s -X POST http://localhost:8004/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice@acme.com","password":"password123"}' | jq -r .token)

curl http://localhost:8004/api/acme/projects -H "Authorization: Bearer $TOKEN"
```

Should match:
```bash
LTOKEN=$(curl -s -X POST http://localhost:8001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice@acme.com","password":"password123"}' | jq -r .token)
curl http://localhost:8001/api/acme/projects -H "Authorization: Bearer $LTOKEN"
```

## Known gaps / workarounds

See [`../.tasks/server-nestjs/tasks.md`](../.tasks/server-nestjs/tasks.md) for the tracking list of every library bug and missing feature this template hits, with detailed resolution plans.

Active workarounds in this template:

| File | Workaround | Tracks |
|------|-----------|--------|
| `src/main.ts` (`tenantRewrite`) | Raw-Express middleware rewrites `/api/<slug>/…` → `/api/…` before Nest routing | [BP-001](../.tasks/server-nestjs/BP-001.md) |
| `src/public-paths.middleware.ts` | Sets `req.__skipAuth` for `/api/auth/*` (library's `RouteGroupMiddleware` is broken) | [BP-006](../.tasks/server-nestjs/BP-006.md) |
| `src/policies/ActiveRolePolicy.ts` | Resolves active role from `user.userRoles[0]` instead of failing when `org` arg missing | [BP-007](../.tasks/server-nestjs/BP-007.md) |
| `src/prisma-extensions.ts` | Parses JSON-string `permissions` columns on read | [BP-008](../.tasks/server-nestjs/BP-008.md) |
| `prisma/schema.prisma` | Hand-authored — blueprint schema generator produces unusable output | [BP-002](../.tasks/server-nestjs/BP-002.md) |
| `src/rhino.config.ts` | Hand-authored validation schemas with required fields; hand-authored `fkConstraints` / `owner` / `hasUuid` | [BP-003](../.tasks/server-nestjs/BP-003.md), [BP-004](../.tasks/server-nestjs/BP-004.md), [BP-005](../.tasks/server-nestjs/BP-005.md) |

Once each task is resolved upstream in the library, delete the corresponding workaround.
