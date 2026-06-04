import type { RhinoScope } from '@rhino-dev/rhino-nestjs';

/**
 * TaskScope (hybrid) — ownership inherited via parent Project.
 *
 *   - Org group: project (and thus task) org-scoping is handled by Rhino's
 *     owner FK-chain (`owner: 'project'` + belongsToOrganization on project),
 *     so this scope adds nothing when an org was resolved.
 *   - Personal group (no org): constrain to tasks whose project belongs to the
 *     current user.
 */
export class TaskScope implements RhinoScope {
  apply(where: Record<string, any>, ctx: { user?: any; organization?: any }) {
    if (ctx.organization) return where;
    if (ctx.user?.id) {
      return { ...where, project: { ...(where.project ?? {}), userId: ctx.user.id } };
    }
    return where;
  }
}
