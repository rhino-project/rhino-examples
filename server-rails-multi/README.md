# TaskFlow - Rhino Rails Template

A multi-tenant task management API built with [Rhino](https://github.com/rhino-project/rhino-rails) on Rails. This project serves as a reference implementation showing how to build a full-featured REST API using Rhino's Blueprint system.

## Features

- Multi-tenant architecture with Organizations
- Role-based access control (owner, admin, manager, member, viewer)
- Per-role field visibility (hidden columns)
- Per-role field editability (permitted attributes)
- Auto-scoped queries (members only see assigned tasks)
- Soft deletes with trash/restore/force-delete
- Audit trail on Projects and Tasks
- UUID primary keys on Comments
- Many-to-many relationships (Tasks <-> Labels)
- Nested operations (atomic multi-model transactions)
- Comprehensive RSpec test suite

## Prerequisites

- Ruby 3.3+
- Rails 8.0+
- SQLite3 (default)

## Setup

```bash
# 1. Install dependencies
bundle install

# 2. Run migrations and seed data
rails db:migrate
rails db:seed
```

## Seed Data

The seeder creates the following test data:

| User | Email | Role | Organization |
|------|-------|------|--------------|
| Alice Johnson | alice@acme.com | admin | Acme Corp |
| Bob Smith | bob@acme.com | manager | Acme Corp |
| Carol Williams | carol@acme.com | member | Acme Corp |
| Dave Brown | dave@acme.com | viewer | Acme Corp |
| Eve Davis | eve@globex.com | admin | Globex Inc |

Password for all users: `password`

## Running the Server

```bash
rails server -p 8003
```

## API Usage

### Login

```bash
curl -X POST http://localhost:8003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@acme.com", "password": "password"}'
```

### List Projects (using the returned token)

```bash
curl http://localhost:8003/api/{org_id}/projects \
  -H "Authorization: Bearer {token}"
```

## Running Tests

```bash
bundle exec rspec
```

## Project Structure

```
app/
  models/
    project.rb          # BelongsToOrganization, HasAuditTrail, Discard
    task.rb             # HasAuditTrail, Discard, HasAutoScope (TaskScope)
    comment.rb          # HasUuid, Discard, auto-set user_id
    label.rb            # BelongsToOrganization, Discard, exceptActions: forceDelete
    scopes/
      task_scope.rb     # Members only see tasks assigned to them
  policies/
    project_policy.rb   # Hidden: budget (member/viewer), internal_notes (manager/member/viewer)
    task_policy.rb      # Hidden: estimated_hours (member/viewer)
    comment_policy.rb   # All roles see all fields
    label_policy.rb     # All roles see all fields
.rhino/
  blueprints/           # YAML blueprint definitions
config/
  initializers/
    rhino.rb        # Model registration and route group config
spec/
  requests/             # RSpec request specs mirroring Laravel Pest tests
```

## Rhino Features Used

| Feature | Where |
|---------|-------|
| Automatic CRUD | All models via ResourcesController |
| Multi-Tenancy | Organization-scoped via BelongsToOrganization |
| RBAC | Policies with role-based permissions |
| Hidden Columns | ProjectPolicy, TaskPolicy |
| Role-Keyed Validation | Permitted attributes per role |
| Soft Deletes | Discard gem on all models |
| Audit Trail | Project, Task |
| Auto-Scope | TaskScope for member filtering |
| UUID | Comment model |
| Action Exclusion | Label (forceDelete disabled) |
| Nested Operations | POST /{org}/nested |
| Cross-Tenant FK | Validates task.project belongs to same org |
