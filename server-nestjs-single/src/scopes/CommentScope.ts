import type { RhinoScope } from '@rhino-dev/rhino-nestjs';

/**
 * CommentScope — single-tenant ownership isolation (inherited via Task → Project).
 *
 * A comment is owned through its task's project. Constrain to comments whose
 * task belongs to a project owned by the current user.
 */
export class CommentScope implements RhinoScope {
  apply(where: Record<string, any>, ctx: { user?: any }) {
    if (ctx.user?.id) {
      return {
        ...where,
        task: { ...(where.task ?? {}), project: { userId: ctx.user.id } },
      };
    }
    return where;
  }
}
