# TaskFlow — Product Requirements Document

**Rhino Reference Implementation**
A multi-tenant task management application that exercises all 28 Rhino features.

---

## 1. Overview

TaskFlow is a B2B task management SaaS where multiple organizations share the same application. Each organization has projects, tasks, comments, and labels — all isolated by tenant. The app demonstrates Rhino's full feature set: automatic CRUD, role-based access control, multi-tenancy, audit trails, soft deletes, nested operations, and more.

**Purpose:** Reference implementation + integration test for the Rhino library across Laravel, NestJS, and Rails.

### 1.1 Route Architecture — Tenant Route Group (REQUIRED)

All resource endpoints MUST use the Rhino **tenant route group**. This means:

- All CRUD routes are prefixed with `/{organization_slug}/` (e.g., `/api/acme/projects`)
- The `ResolveOrganizationFromRoute` middleware runs on every tenant request
- The middleware resolves the organization from the URL slug, verifies the authenticated user belongs to that org, and sets the org context for all subsequent operations
- `BelongsToOrganization` trait auto-scopes queries to the current org
- Cross-org access returns 404 ("Organization not found")

**Auth routes** (login, register, password reset) are NOT in the tenant group — they use a plain `/api/auth/` prefix with no org context.

---

## 2. Data Model

### 2.1 Entity Relationship Diagram

```
Organization (root tenant)
│
├── User ← (many-to-many via user_roles, with Role)
│
├── Project (direct tenant: has organization_id)
│   │
│   └── Task (indirect tenant via project → org)
│       │
│       ├── Comment (indirect tenant via task → project → org, UUID primary key)
│       │
│       └── TaskLabel (pivot: task_id + label_id)
│
└── Label (direct tenant: has organization_id)
```

### 2.2 Tables & Columns

#### projects
| Column | Type | Constraints |
|--------|------|-------------|
| id | bigint | PK, auto-increment |
| organization_id | bigint | FK → organizations, required |
| title | string(255) | required |
| description | text | nullable |
| status | enum | draft, active, completed, archived. Default: draft |
| budget | decimal(12,2) | nullable. **Hidden from member/viewer roles** |
| internal_notes | text | nullable. **Hidden from manager/member/viewer** |
| starts_at | date | nullable |
| ends_at | date | nullable |
| timestamps + soft deletes | | |

**Rhino features:** BelongsToOrganization, HasAuditTrail, SoftDeletes, HasValidation, HidableColumns

#### tasks
| Column | Type | Constraints |
|--------|------|-------------|
| id | bigint | PK, auto-increment |
| project_id | bigint | FK → projects, required. **Cross-tenant validated** |
| assigned_to | bigint | FK → users, nullable |
| title | string(255) | required |
| description | text | nullable |
| status | enum | todo, in_progress, in_review, done. Default: todo |
| priority | enum | low, medium, high, critical. Default: medium |
| estimated_hours | decimal(6,2) | nullable. **Hidden from member/viewer** |
| due_date | date | nullable |
| completed_at | timestamp | nullable |
| timestamps + soft deletes | | |

**Rhino features:** Indirect tenant (via project), HasAuditTrail, HasAutoScope (TaskScope), SoftDeletes, HasValidation, HidableColumns, cross-tenant FK, throttle middleware on store

#### comments
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, auto-generated. **Uses HasUuid** |
| task_id | bigint | FK → tasks, required. **Cross-tenant validated** |
| user_id | bigint | FK → users, required (auto-set to current user) |
| body | text | required |
| timestamps + soft deletes | | |

**Rhino features:** Indirect tenant (3 levels), HasUuid, SoftDeletes, cross-tenant FK

#### labels
| Column | Type | Constraints |
|--------|------|-------------|
| id | bigint | PK, auto-increment |
| organization_id | bigint | FK → organizations, required |
| name | string(100) | required |
| color | string(7) | nullable, hex color |
| timestamps + soft deletes | | |

**Rhino features:** BelongsToOrganization, SoftDeletes, exceptActions: forceDelete, many-to-many with tasks

#### task_labels (pivot)
| Column | Type | Constraints |
|--------|------|-------------|
| task_id | bigint | FK → tasks |
| label_id | bigint | FK → labels |
| created_at | timestamp | |

---

## 3. Roles & Permissions

### 3.1 Permission Matrix

| Action | owner | admin | manager | member | viewer |
|--------|-------|-------|---------|--------|--------|
| **projects.index** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **projects.show** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **projects.store** | ✓ | ✓ | ✓ | ✗ | ✗ |
| **projects.update** | ✓ | ✓ | ✓ | ✗ | ✗ |
| **projects.destroy** | ✓ | ✓ | ✗ | ✗ | ✗ |
| **projects.trashed** | ✓ | ✓ | ✗ | ✗ | ✗ |
| **projects.restore** | ✓ | ✓ | ✗ | ✗ | ✗ |
| **projects.forceDelete** | ✓ | ✗ | ✗ | ✗ | ✗ |
| **tasks.index** | ✓ | ✓ | ✓ | ✓ (scoped) | ✓ |
| **tasks.show** | ✓ | ✓ | ✓ | ✓ (scoped) | ✓ |
| **tasks.store** | ✓ | ✓ | ✓ | ✓ | ✗ |
| **tasks.update** | ✓ | ✓ | ✓ | ✓ (own) | ✗ |
| **tasks.destroy** | ✓ | ✓ | ✓ | ✗ | ✗ |
| **comments.index** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **comments.store** | ✓ | ✓ | ✓ | ✓ | ✗ |
| **comments.update** | ✓ | ✓ | ✓ | ✓ (own) | ✗ |
| **comments.destroy** | ✓ | ✓ | ✓ | ✓ (own) | ✗ |
| **labels.index** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **labels.store** | ✓ | ✓ | ✗ | ✗ | ✗ |
| **labels.update** | ✓ | ✓ | ✗ | ✗ | ✗ |
| **labels.destroy** | ✓ | ✓ | ✗ | ✗ | ✗ |
| **labels.forceDelete** | ✗ | ✗ | ✗ | ✗ | ✗ |

### 3.2 Hidden Columns per Role

| Field | owner/admin | manager | member | viewer |
|-------|------------|---------|--------|--------|
| project.budget | visible | visible | hidden | hidden |
| project.internal_notes | visible | hidden | hidden | hidden |
| task.estimated_hours | visible | visible | hidden | hidden |

### 3.3 Writable Fields (Role-Keyed Validation)

#### Project — Store/Update
| Field | owner/admin | manager | member/viewer |
|-------|------------|---------|---------------|
| title | ✓ | ✓ | ✗ |
| description | ✓ | ✓ | ✗ |
| status | ✓ | ✓ | ✗ |
| budget | ✓ | ✗ | ✗ |
| internal_notes | ✓ | ✗ | ✗ |
| starts_at | ✓ | ✓ | ✗ |
| ends_at | ✓ | ✓ | ✗ |

#### Task — Store/Update
| Field | owner/admin | manager | member | viewer |
|-------|------------|---------|--------|--------|
| project_id | ✓ | ✓ | ✓ | ✗ |
| title | ✓ | ✓ | ✓ | ✗ |
| description | ✓ | ✓ | ✓ | ✗ |
| status | ✓ | ✓ | ✓ | ✗ |
| priority | ✓ | ✓ | ✗ | ✗ |
| assigned_to | ✓ | ✓ | ✗ | ✗ |
| estimated_hours | ✓ | ✗ | ✗ | ✗ |
| due_date | ✓ | ✓ | ✓ | ✗ |

---

## 4. Scopes

### TaskScope (HasAutoScope)
Members see only tasks assigned to them:
```
IF role == 'member': WHERE assigned_to = auth.user.id
```

---

## 5. Seed Data

### Organizations
| Name | Slug |
|------|------|
| Acme Corp | acme |
| Globex Inc | globex |

### Users
| Name | Email | Password |
|------|-------|----------|
| Alice Admin | alice@acme.com | password123 |
| Bob Manager | bob@acme.com | password123 |
| Carol Member | carol@acme.com | password123 |
| Dave Viewer | dave@acme.com | password123 |
| Eve Admin | eve@globex.com | password123 |

### User Roles
| User | Org | Role | Permissions |
|------|-----|------|------------|
| Alice | Acme | admin | ["*"] |
| Bob | Acme | manager | ["projects.index","projects.show","projects.store","projects.update","tasks.*","comments.*","labels.index","labels.show"] |
| Carol | Acme | member | ["projects.index","projects.show","tasks.index","tasks.show","tasks.store","tasks.update","comments.*"] |
| Dave | Acme | viewer | ["projects.index","projects.show","tasks.index","tasks.show","comments.index","comments.show"] |
| Eve | Globex | admin | ["*"] |

### Projects (Acme)
| Title | Status | Budget |
|-------|--------|--------|
| Website Redesign | active | 50000.00 |
| Mobile App | draft | 120000.00 |
| API Migration | completed | 25000.00 |

### Tasks (Website Redesign project)
| Title | Status | Priority | Assigned To | Hours | Due |
|-------|--------|----------|-------------|-------|-----|
| Design homepage | in_progress | high | Carol | 16.00 | 2026-05-01 |
| Implement auth | todo | critical | Carol | 24.00 | 2026-05-15 |
| Write API docs | todo | medium | Bob | 8.00 | 2026-05-20 |
| Setup CI/CD | done | low | Alice | 4.00 | 2026-04-15 |

### Labels (Acme)
| Name | Color |
|------|-------|
| bug | #dc3545 |
| feature | #28a745 |
| urgent | #ffc107 |
| documentation | #17a2b8 |

---

## 6. Acceptance Criteria

### AC-1: Multi-Tenancy Isolation
- Acme data invisible to Globex users
- Cannot reference Acme's project_id when creating a task in Globex

### AC-2: Role-Based CRUD
- Owner can do everything
- Viewer gets 403 on create/update/delete
- Member gets 403 on task delete

### AC-3: Hidden Columns
- Member doesn't see budget or internal_notes
- Manager sees budget but not internal_notes

### AC-4: Role-Keyed Validation
- Manager can set title but not budget (field silently stripped)
- Member can set title but not priority

### AC-5: Scoped Data (TaskScope)
- Member sees only tasks assigned to them

### AC-6: Soft Deletes
- DELETE soft-deletes, GET /trashed shows deleted, POST /restore restores

### AC-7: UUID Primary Keys
- Comments use UUID

### AC-8: Cross-Tenant FK Validation
- Task with project_id from another org → 422

### AC-9: Labels Action Exclusion
- Force-delete on labels → 404

---

## 7. Server Ports

| Framework | Port |
|-----------|------|
| Laravel | 8001 |
| NestJS | 8004 |
| Rails | 8003 |
