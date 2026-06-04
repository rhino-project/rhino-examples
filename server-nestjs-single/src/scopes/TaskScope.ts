import type { RhinoScope } from '@rhino-dev/rhino-nestjs';

/**
 * TaskScope — single-tenant ownership isolation (inherited via parent Project).
 *
 * A Task has no userId of its own; it is owned by whoever owns its Project. We
 * therefore constrain to tasks whose project belongs to the current user, via a
 * Prisma relation filter.
 */
export class TaskScope implements RhinoScope {
  apply(where: Record<string, any>, ctx: { user?: any }) {
    if (ctx.user?.id) {
      return { ...where, project: { ...(where.project ?? {}), userId: ctx.user.id } };
    }
    return where;
  }
}
