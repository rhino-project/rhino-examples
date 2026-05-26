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
