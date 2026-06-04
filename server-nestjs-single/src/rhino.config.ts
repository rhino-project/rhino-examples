import { PrismaClient } from '@prisma/client';
import type { RhinoConfig } from '@rhino-dev/rhino-nestjs';

import { projectsRegistration } from './resources/ProjectResource';
import { tasksRegistration } from './resources/TaskResource';
import { commentsRegistration } from './resources/CommentResource';
import { labelsRegistration } from './resources/LabelResource';

import { ProjectScope } from './scopes/ProjectScope';
import { TaskScope } from './scopes/TaskScope';
import { CommentScope } from './scopes/CommentScope';
import { StampProjectOwner } from './middleware/StampProjectOwner';

/**
 * SINGLE-TENANT TaskFlow config.
 *
 *  - No multiTenant block, no Organization/Role/UserRole models.
 *  - One `default` route group: empty prefix, no domain, no org middleware.
 *  - Auth is the standard global /api/auth/* set.
 *  - Ownership is enforced by per-model scopes (userId == current user). Project
 *    carries userId; Task/Comment inherit via parent. Label is a shared global
 *    catalog (no scope → every user sees all labels).
 *  - Project create stamps userId via StampProjectOwner action middleware.
 */
export function buildRhinoConfig(prisma: PrismaClient): RhinoConfig {
  return {
    prismaClient: prisma as any,
    models: {
      projects: {
        ...projectsRegistration,
        model: 'project',
        scopes: [ProjectScope],
        actionMiddleware: { store: [StampProjectOwner] },
      },
      tasks: { ...tasksRegistration, model: 'task', scopes: [TaskScope] },
      comments: { ...commentsRegistration, model: 'comment', scopes: [CommentScope] },
      // Label: shared global catalog — intentionally NO scope.
      labels: { ...labelsRegistration, model: 'label' },
    },
    routeGroups: {
      auth: {
        prefix: 'auth',
        models: [],
        skipAuth: true,
      },
      default: {
        prefix: '',
        models: '*',
      },
    },
    // No multiTenant block → multiTenantEnabled() is false (org-less).
    auth: {
      jwtSecret: process.env.JWT_SECRET ?? 'change-me-in-production',
      jwtExpiresIn: '7d',
      userModel: 'user',
      enforceGroupMembership: false,
    },
  };
}
