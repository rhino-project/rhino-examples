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
        //
        // An attribute may also declare PARAMETERS the client supplies, using
        // the same bracket wire form named scopes use:
        //
        //   ?computed_attributes=isOverdue                    legacy comma list
        //   ?computed_attributes[isOverdue]=                  bracket, no args
        //   ?computed_attributes[isDueBefore]=2026-01-01      one declared param
        //   ?computed_attributes[isDueBefore][date]=...       named parameter
        //
        // Record callables receive the bound arguments as a named object in
        // their third parameter. Serialization is synchronous, so a record
        // callable still cannot be async.
        recordComputedAttributes: {
          isOverdue: (record: any) =>
            record.dueDate != null &&
            record.status !== 'done' &&
            new Date(record.dueDate) < new Date(),

          // Parameterised record attribute: is this row due before the
          // client-supplied date?
          isDueBefore: {
            params: ['date'],
            using: (record: any, _user: any, args: any) =>
              record.dueDate != null &&
              new Date(record.dueDate) < new Date(args.date),
          },
        },
        // COLLECTION-level aggregates — awaited ONCE per request over the
        // scoped, filtered where. GET /api/{org}/tasks/computed?attributes=...
        //
        //   ?attributes=totalCount,doneTasksCount            legacy comma list
        //   ?attributes[totalCount]=                         bracket, no args
        //   ?attributes[countByStatus]=todo                  one declared param
        //   ?attributes[tasksDueBetween][from]=a&...[to]=b   named parameters
        //
        // A bare GET /computed still returns everything the policy allows,
        // minus any attribute with a REQUIRED parameter — those are skipped
        // silently, so adding one here never breaks a client that asks for
        // everything.
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

          // Two required parameters: skipped by a bare /computed.
          tasksDueBetween: {
            params: ['from', 'to'],
            using: (ctx: any) =>
              ctx.delegate.count({
                where: {
                  ...ctx.where,
                  dueDate: {
                    gte: new Date(ctx.args.from),
                    lte: new Date(ctx.args.to),
                  },
                },
              }),
          },

          // One required parameter, so the bare-value form binds it:
          // ?attributes[countByStatus]=todo
          countByStatus: {
            params: ['status'],
            using: (ctx: any) =>
              ctx.delegate.count({
                where: { ...ctx.where, status: ctx.args.status },
              }),
          },

          // Every parameter optional: evaluated with no arguments by a bare
          // /computed, and narrowed when the client supplies a window.
          // 'onlyHighPriority' also shows "true"/"false" coercing to a real
          // boolean before the callable sees it.
          windowedTaskCount: {
            params: ['from', 'to', 'onlyHighPriority'],
            optionalParams: ['from', 'to', 'onlyHighPriority'],
            using: (ctx: any) => {
              const where: any = { ...ctx.where };
              const args = ctx.args ?? {};
              if (args.from != null || args.to != null) {
                where.dueDate = {
                  ...(args.from != null ? { gte: new Date(args.from) } : {}),
                  ...(args.to != null ? { lte: new Date(args.to) } : {}),
                };
              }
              if (args.onlyHighPriority === true) {
                where.priority = 'high';
              }
              return ctx.delegate.count({ where });
            },
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
