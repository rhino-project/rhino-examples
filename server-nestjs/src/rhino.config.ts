import { PrismaClient } from '@prisma/client';
import type { RhinoConfig } from '@rhino-dev/rhino-nestjs';

import { projectsRegistration } from './resources/ProjectResource';
import { tasksRegistration } from './resources/TaskResource';
import { commentsRegistration } from './resources/CommentResource';
import { labelsRegistration } from './resources/LabelResource';

import { TaskScope } from './scopes/TaskScope';
import {
  ActiveScope,
  AssignedToMeScope,
  ByStatusScope,
  DueBeforeScope,
  DueBetweenScope,
} from './scopes/TaskNamedScopes';

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
    // How many named scopes one request may combine (403 over the cap).
    maxScopesPerRequest: 3,
    models: {
      projects: { ...projectsRegistration, model: 'project' },
      // Route Key: match member routes (/tasks/:id) on hashId instead of
      // the numeric primary key. PK values no longer resolve.
      tasks: {
        ...tasksRegistration,
        model: 'task',
        scopes: [TaskScope],
        // Client-selectable named scopes (?scope=). Scopes with declared
        // parameters take them as ?scope[name][param]=value.
        namedScopes: {
          active: ActiveScope,
          assignedToMe: AssignedToMeScope,
          dueBefore: DueBeforeScope,
          dueBetween: DueBetweenScope,
          byStatus: ByStatusScope,
        },
        defaultScope: 'active',
        routeKey: 'hashId',
        // Computed attributes (see "Computed Attributes" in the Rhino docs).
        // OPT-IN per-row values — nothing is evaluated unless the client asks
        // for it by name via ?computed_attributes=isOverdue
        recordComputedAttributes: {
          isOverdue: (record: any) =>
            record.dueDate != null &&
            record.status !== 'done' &&
            new Date(record.dueDate) < new Date(),
        },
        // COLLECTION-level aggregates — awaited ONCE per request over the
        // scoped, filtered where. GET /api/{org}/tasks/computed?attributes=...
        collectionComputedAttributes: {
          totalCount: (ctx: any) => ctx.delegate.count({ where: ctx.where }),
          openTasksCount: (ctx: any) =>
            ctx.delegate.count({ where: { ...ctx.where, status: { not: 'done' } } }),
          doneTasksCount: (ctx: any) =>
            ctx.delegate.count({ where: { ...ctx.where, status: 'done' } }),
          highPriorityCount: (ctx: any) =>
            ctx.delegate.count({ where: { ...ctx.where, priority: 'high' } }),
          estimatedHoursTotal: async (ctx: any) => {
            const r = await ctx.delegate.aggregate({
              where: ctx.where,
              _sum: { estimatedHours: true },
            });
            return Number(r._sum.estimatedHours ?? 0);
          },
        },
      },
      comments: { ...commentsRegistration, model: 'comment' },
      // Route Key: labels are addressed by slug (/labels/:id → slug column).
      labels: { ...labelsRegistration, model: 'label', routeKey: 'slug' },
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
