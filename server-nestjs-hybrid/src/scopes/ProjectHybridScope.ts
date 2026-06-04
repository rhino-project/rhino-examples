import type { RhinoScope } from '@rhino-dev/rhino-nestjs';

/**
 * ProjectHybridScope — ownership isolation that adapts to the resolved route group.
 *
 *   - Org group (agency/vendor): an organization was resolved for the request,
 *     so org filtering is already applied by `belongsToOrganization: true`.
 *     This scope adds nothing.
 *   - Personal group (no org resolved): constrain to the current user's own
 *     projects (userId == current user), the user-owned form.
 */
export class ProjectHybridScope implements RhinoScope {
  apply(where: Record<string, any>, ctx: { user?: any; organization?: any }) {
    if (ctx.organization) {
      return where; // org-scoped — handled by belongsToOrganization
    }
    if (ctx.user?.id) {
      return { ...where, userId: ctx.user.id };
    }
    return where;
  }
}
