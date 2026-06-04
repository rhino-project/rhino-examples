import type { RhinoScope } from '@rhino-dev/rhino-nestjs';

/**
 * ProjectScope — single-tenant ownership isolation.
 *
 * Project is a top-level user-owned model: constrain every query to rows whose
 * `userId` equals the authenticated user. Applied by Rhino's ScopeService to
 * index/show/update/delete `where` clauses, so user A can never see/mutate
 * user B's projects.
 */
export class ProjectScope implements RhinoScope {
  apply(where: Record<string, any>, ctx: { user?: any }) {
    if (ctx.user?.id) {
      return { ...where, userId: ctx.user.id };
    }
    return where;
  }
}
