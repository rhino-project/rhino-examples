import { PrismaClient } from '@prisma/client';
import type { RhinoConfig } from '@rhino-dev/rhino-nestjs';

import { projectsRegistration } from './resources/ProjectResource';
import { tasksRegistration } from './resources/TaskResource';
import { commentsRegistration } from './resources/CommentResource';
import { labelsRegistration } from './resources/LabelResource';

import { TaskScope } from './scopes/TaskScope';

/**
 * Compose Rhino configuration. In 0.2.0 the blueprint generator emits
 * correct validation (required fields via column.nullable), hasUuid,
 * owner / fkConstraints, and exceptActions — so this file now does only
 * what can't be expressed in YAML:
 *
 *   - Lower-case the Prisma delegate name (PascalCase in the registration
 *     → camelCase for prisma client access)
 *   - Attach TaskScope (a runtime class can't live in YAML)
 *   - Wire route groups + multi-tenant settings
 *   - Provide the PrismaClient instance
 */
export function buildRhinoConfig(prisma: PrismaClient): RhinoConfig {
  return {
    prismaClient: prisma as any,
    models: {
      projects: { ...projectsRegistration, model: 'project' },
      tasks: { ...tasksRegistration, model: 'task', scopes: [TaskScope] },
      comments: { ...commentsRegistration, model: 'comment' },
      labels: { ...labelsRegistration, model: 'label' },
    },
    routeGroups: {
      auth: {
        prefix: 'auth',
        models: [],
        skipAuth: true,
      },
      tenant: {
        prefix: ':organization',
        models: '*',
      },
      // Back office. It has NO tenant boundary: its operators are meant to see
      // every organization's rows, so `tenant: false` tells the resource-scope
      // resolver not to require an organization there (and not to throw
      // TENANT_CONTEXT_REQUIRED). The tenant group above is untouched and keeps
      // failing closed. Declaring the group also makes `/api/admin/*` a
      // non-tenant path for createTenantRouteRewrite, so its first segment is
      // never mistaken for an organization slug.
      //
      // `models: []` on purpose: this group exists to declare the boundary for
      // the CUSTOM admin controller, not to expose a second, unscoped copy of
      // the CRUD API.
      admin: {
        prefix: 'admin',
        tenant: false,
        models: [],
      },
    },
    multiTenant: {
      enabled: true,
      organizationIdentifierColumn: 'slug',
      organizationModel: 'organization',
      userOrganizationModel: 'userRole',
    },
    auth: {
      jwtSecret: process.env.JWT_SECRET ?? 'change-me-in-production',
      jwtExpiresIn: '7d',
      userModel: 'user',
    },
  };
}
