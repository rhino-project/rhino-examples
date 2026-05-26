# Rhino Tasks — server-nestjs

Bugs and missing features in `@rhino-dev/rhino-nestjs` surfaced while implementing the TaskFlow reference in `rhino-template/server-nestjs`. Each task has a detailed `.md` file in this directory with root-cause analysis, repro, and step-by-step resolution.

**All 11 tasks resolved in the library. Template migrated to `^0.2.0` (bumps to `^0.2.1` once the Trusted Publisher CD workflow lands — npm config pending confirmation).**

| ID | Type | Status | Resolved in | Title |
|----|------|--------|-------------|-------|
| [BP-001](BP-001.md) | bug | ✅ resolved | 0.2.0 | Route-group `prefix: ':organization'` never registers tenant routes |
| [BP-002](BP-002.md) | bug | ✅ resolved | 0.2.0 | `PrismaSchemaGenerator` appends duplicate models with broken field shape |
| [BP-003](BP-003.md) | bug | ✅ resolved | 0.2.0 | Array-form `create_fields` emits everything as `.optional()` — required fields ignored |
| [BP-004](BP-004.md) | missing | ✅ resolved | 0.2.0 | Blueprint YAML has no way to declare `fkConstraints` / indirect tenancy (`owner:`) |
| [BP-005](BP-005.md) | missing | ✅ resolved | 0.2.0 | Blueprint YAML ignores `has_uuid: true` option |
| [BP-006](BP-006.md) | bug | ✅ resolved | 0.2.0 | `RouteGroupMiddleware` reads `req.url` (mount-relative) instead of `req.originalUrl` |
| [BP-007](BP-007.md) | bug | ✅ resolved | 0.2.0 + 0.2.1 | `SerializerService` / `ValidationService` called policy attribute methods without `org` context |
| [BP-008](BP-008.md) | missing | ✅ resolved | 0.2.0 | No JSON-array column hydration for dbs without native arrays (SQLite/MySQL) |
| [BP-009](BP-009.md) | bug | ✅ resolved | 0.2.0 | `_*.yaml` shared-roles files treated as invalid blueprints |
| [BP-010](BP-010.md) | missing | ✅ resolved | 0.2.0 | `RHINO_PRISMA_CLIENT` token not exported from public module surface |
| [BP-011](BP-011.md) | parity | ✅ resolved | 0.2.0 | Cross-tenant access returns 403 instead of 404 |

## Template state after 0.2.0 migration

The four workaround files from the 0.1.0 era are deleted:

- `src/public-paths.middleware.ts` — replaced by the library's `RouteGroupMiddleware` (opt in via `autoRouteGroupMiddleware: true`)
- `src/prisma-extensions.ts` — replaced by `coercePermissions` inside the library's permission matcher
- `src/policies/ActiveRolePolicy.ts` — serializer now receives `org`, so generated policies extend `ResourcePolicy` from the library directly
- `src/tenant-rewrite.middleware.ts` — replaced by `createTenantRouteRewrite` exported from the library, installed via `app.use(...)` in `main.ts`

Blueprints now fully express what was previously hand-authored in `rhino.config.ts`:

- `has_uuid: true` on `Comment`
- `owner_chain: project` on `Task`, `owner_chain: task.project` on `Comment`
- `fk_constraints:` on `Task` and `Comment`
- `except_actions: [forceDelete]` on `Label`

`rhino.config.ts` shrank from ~160 lines to ~50 (model-name camelCase override, `TaskScope` attachment, route groups, multi-tenant, auth).

## PRD acceptance-criteria status (template on 0.2.0)

| AC | Status | Notes |
|----|--------|-------|
| AC-1 cross-tenant isolation → 404 | ✅ pass | `createTenantRouteRewrite` + Express-layer JWT pre-parse in `main.ts` |
| AC-2 role-based CRUD | ✅ pass | |
| AC-3 hidden columns per role | ✅ pass | Serializer now threads org to the policy |
| AC-4 role-keyed validation | 🟡 0.2.1 | Validation-path org fix (BP-007 followup) shipped in 0.2.1 |
| AC-5 scoped data (TaskScope) | ✅ pass | |
| AC-6 soft delete + /trashed + restore | ✅ pass | |
| AC-7 UUID primary keys | ✅ pass | `has_uuid: true` expressed purely in YAML |
| AC-8 cross-tenant FK validation | 🟡 0.2.1 | Same validation-path org fix |
| AC-9 labels `exceptActions: [forceDelete]` | ✅ pass | |

Once `0.2.1` is live on npm, bump the template to `^0.2.1` and AC-4 / AC-8 go green with no further template changes.
