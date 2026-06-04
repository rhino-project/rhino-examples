import { PrismaClient } from '@prisma/client';
import type { RhinoConfig } from '@rhino-dev/rhino-nestjs';

import { projectsRegistration } from './resources/ProjectResource';
import { tasksRegistration } from './resources/TaskResource';
import { commentsRegistration } from './resources/CommentResource';
import { labelsRegistration } from './resources/LabelResource';

import { TaskScope } from './scopes/TaskScope';
import { ProjectHybridScope } from './scopes/ProjectHybridScope';
import { StampPersonalProjectOwner } from './middleware/StampPersonalProjectOwner';
import { AgencyAuthHooks } from './hooks/AgencyAuthHooks';
import { VendorAuthHooks } from './hooks/VendorAuthHooks';

/**
 * HYBRID TaskFlow config — three route groups in one app, selected by HOST:
 *
 *   personal  →  app.lvh.me               user-owned (no org), auth:true
 *   agency    →  {organization}.agency.lvh.me   org-scoped multitenant, auth:true, AgencyAuthHooks
 *   vendor    →  {organization}.vendor.lvh.me   org-scoped multitenant, auth:true, VendorAuthHooks
 *
 * `auth.enforceGroupMembership` is ON: each authenticated request must hold a
 * user_roles row matching the resolved group (NULL = wildcard) and, for tenant
 * groups, the resolved org. An agency member is therefore 403 on the vendor
 * group and vice-versa.
 *
 * Project is org-owned (agency/vendor) OR user-owned (personal). ProjectHybridScope
 * applies the right ownership filter based on whether an org was resolved for the
 * request; StampPersonalProjectOwner stamps userId on personal-group creates.
 */
export function buildRhinoConfig(prisma: PrismaClient): RhinoConfig {
  return {
    prismaClient: prisma as any,
    models: {
      projects: {
        ...projectsRegistration,
        model: 'project',
        scopes: [ProjectHybridScope],
        actionMiddleware: { store: [StampPersonalProjectOwner] },
      },
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
      personal: {
        domain: 'app.lvh.me',
        models: ['projects', 'tasks', 'comments', 'labels'],
        auth: true,
        tenant: false, // org-less: membership ignores org for this group
      },
      agency: {
        domain: '{organization}.agency.lvh.me',
        models: ['projects', 'tasks', 'comments', 'labels'],
        auth: true,
        hooks: AgencyAuthHooks,
      },
      vendor: {
        domain: '{organization}.vendor.lvh.me',
        models: ['projects', 'tasks', 'comments', 'labels'],
        auth: true,
        hooks: VendorAuthHooks,
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
      enforceGroupMembership: true,
    },
  };
}
