# Rhino Template — TaskFlow

Reference implementation of Rhino across Laravel, Rails, and NestJS.

A multi-tenant task management app (TaskFlow) that exercises all Rhino features:
automatic CRUD, role-based access, multi-tenancy, audit trails, soft deletes,
nested operations, Blueprint generation, and more.

## Projects

| Directory | Framework | Port | Status |
|-----------|-----------|------|--------|
| `server-laravel/` | Laravel + Rhino | 8001 | |
| `server-rails/` | Rails + Rhino | 8003 | |
| `server-nestjs/` | NestJS + Rhino | 8004 | |
| `client-web/` | React | 3000 | Planned |
| `client-mobile/` | React Native | — | Planned |

## Getting Started

Each server project is built using the same steps:
1. Install the framework
2. Install Rhino
3. Run `rhino:install` (or equivalent)
4. Create Blueprint YAML files
5. Run `rhino:blueprint` to generate models, policies, tests, seeders
6. Customize the generated code as needed
7. Run migrations and seed
8. Start the server

See each project's README for detailed instructions.
