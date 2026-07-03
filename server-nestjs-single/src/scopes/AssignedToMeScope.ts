import type { RhinoNamedScope, ScopeContext } from '@rhino-dev/rhino-nestjs';

/**
 * Client-selectable named scopes for Task (`?scope=<key>`).
 *
 * Unlike the global TaskScope (which enforces project-ownership isolation and
 * runs on every request), these are opt-in via the query string. Rhino ANDs the
 * returned where-fragment into the existing (already ownership-scoped) query, so
 * a named scope can only NARROW results — never widen them.
 */
export class ActiveTasksScope implements RhinoNamedScope {
  apply(): Record<string, any> {
    return { status: { not: 'done' } };
  }
}

export class AssignedToMeScope implements RhinoNamedScope {
  apply(ctx: ScopeContext): Record<string, any> {
    if (!ctx.user) return { id: { in: [] } };
    return { assignedTo: ctx.user.id, status: { not: 'done' } };
  }
}
