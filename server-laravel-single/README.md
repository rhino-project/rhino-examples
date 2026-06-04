# TaskFlow - Rhino Laravel Template

A multi-tenant task management API built with [Rhino](https://github.com/rhino-project/rhino-laravel) on Laravel. This project serves as a reference implementation showing how to build a full-featured REST API using Rhino's Blueprint system.

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
- Comprehensive Pest test suite

## Prerequisites

- PHP 8.2+
- Composer
- SQLite (default) or PostgreSQL/MySQL

## Setup

```bash
# 1. Install dependencies
composer install

# 2. Copy environment file
cp .env.example .env

# 3. Generate application key
php artisan key:generate

# 4. Run migrations and seed data
php artisan migrate:fresh --seed
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

Default password for all users: `password`

## Running the Server

```bash
php artisan serve --port=8001
```

## API Usage

### Authentication

```bash
# Login
curl -s -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@acme.com","password":"password"}'

# Response: { "token": "1|abc123..." }
```

### CRUD Operations

All tenant-scoped endpoints use the pattern: `/api/{organization_id}/{resource}`

```bash
TOKEN="your-token-here"
ORG_ID=1

# List projects
curl -s http://localhost:8001/api/$ORG_ID/projects \
  -H "Authorization: Bearer $TOKEN"

# Create a project
curl -s -X POST http://localhost:8001/api/$ORG_ID/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"New Project","status":"draft"}'

# Show a project
curl -s http://localhost:8001/api/$ORG_ID/projects/1 \
  -H "Authorization: Bearer $TOKEN"

# Update a project
curl -s -X PUT http://localhost:8001/api/$ORG_ID/projects/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Project","status":"active"}'

# Delete a project (soft delete)
curl -s -X DELETE http://localhost:8001/api/$ORG_ID/projects/1 \
  -H "Authorization: Bearer $TOKEN"
```

### Soft Deletes

```bash
# View trashed items
curl -s http://localhost:8001/api/$ORG_ID/projects/trashed \
  -H "Authorization: Bearer $TOKEN"

# Restore
curl -s -X POST http://localhost:8001/api/$ORG_ID/projects/1/restore \
  -H "Authorization: Bearer $TOKEN"

# Force delete (permanent)
curl -s -X DELETE http://localhost:8001/api/$ORG_ID/projects/1/force-delete \
  -H "Authorization: Bearer $TOKEN"
```

### Nested Operations

Create or update multiple resources in a single atomic transaction:

```bash
curl -s -X POST http://localhost:8001/api/$ORG_ID/nested \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "operations": [
      {"model": "tasks", "action": "create", "data": {"title": "Task 1", "status": "todo", "priority": "high", "project_id": 1}},
      {"model": "tasks", "action": "create", "data": {"title": "Task 2", "status": "todo", "priority": "low", "project_id": 1}}
    ]
  }'
```

## Running Tests

```bash
# Run all tests
php artisan test

# Run only feature tests
php artisan test tests/Feature/

# Run specific test file
php artisan test tests/Feature/ProjectTest.php
```

## Project Structure

```
app/
  Models/
    Organization.php    # Root tenant (created by rhino:install)
    Role.php            # Role definitions (owner/admin/manager/member/viewer)
    UserRole.php        # Pivot: user <-> role <-> organization
    User.php            # Updated with HasPermissions trait
    Project.php         # Direct tenant (has organization_id)
    Task.php            # Indirect tenant (via project -> organization)
    Comment.php         # UUID primary keys, auto-set user_id
    Label.php           # $exceptActions = ['forceDelete']
    Scopes/
      TaskScope.php     # Members/viewers only see assigned tasks
  Policies/
    ProjectPolicy.php   # Role-based field visibility and editability
    TaskPolicy.php
    CommentPolicy.php
    LabelPolicy.php
config/
  rhino.php         # Model registration and route groups
.rhino/
  blueprints/
    _roles.yaml         # Global role definitions
    projects.yaml       # Project blueprint with permissions
    tasks.yaml          # Task blueprint with permissions
    comments.yaml       # Comment blueprint with permissions
    labels.yaml         # Label blueprint with permissions
database/
  migrations/           # All table definitions
  factories/            # Model factories for testing
  seeders/
    DatabaseSeeder.php  # Complete seed data
tests/
  Feature/
    AuthTest.php        # Login, logout, invalid credentials
    ProjectTest.php     # CRUD, hidden columns, role validation, cross-org isolation
    TaskTest.php        # CRUD, TaskScope, hidden columns, member restrictions
    CommentTest.php     # UUID, auto-set user_id, role access
    LabelTest.php       # CRUD, force-delete disabled, org isolation
    SoftDeleteTest.php  # Trash, restore, force-delete
    NestedOperationTest.php  # Atomic transactions
```

## Role Permissions Matrix

| Action | owner | admin | manager | member | viewer |
|--------|-------|-------|---------|--------|--------|
| **Projects** | | | | | |
| index/show | yes | yes | yes | yes | yes |
| store/update | yes | yes | yes | -- | -- |
| destroy | yes | yes | -- | -- | -- |
| See budget | yes | yes | yes | -- | -- |
| See internal_notes | yes | yes | -- | -- | -- |
| **Tasks** | | | | | |
| index/show | all | all | all | assigned | assigned |
| store | yes | yes | yes | -- | -- |
| update | all fields | all fields | all fields | status, description | -- |
| destroy | yes | yes | -- | -- | -- |
| See estimated_hours | yes | yes | yes | -- | -- |
| **Comments** | | | | | |
| index/show | yes | yes | yes | yes | yes |
| store | yes | yes | yes | yes | -- |
| update (body) | yes | yes | yes | yes | -- |
| destroy | yes | yes | yes | -- | -- |
| **Labels** | | | | | |
| index/show | yes | yes | yes | yes | yes |
| store/update | yes | yes | yes | -- | -- |
| destroy | yes | yes | -- | -- | -- |
| forceDelete | -- | -- | -- | -- | -- |
