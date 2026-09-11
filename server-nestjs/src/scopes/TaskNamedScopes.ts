import type { RhinoNamedScope, ScopeContext } from '@rhino-dev/rhino-nestjs';

/**
 * Client-selectable named scopes for tasks (`?scope=`).
 *
 * A scope class declares the parameters the client may fill in as `static
 * params` (and `static optionalParams`); the bound values arrive as `ctx.args`.
 *
 *   ?scope=assignedToMe                                  no arguments
 *   ?scope[dueBefore]=2026-12-31                         one declared parameter
 *   ?scope[dueBetween][from]=a&scope[dueBetween][to]=b   named parameters
 *   ?scope[byStatus][status]=todo                        'priority' is optional
 */
export class ActiveScope implements RhinoNamedScope {
  apply(): Record<string, any> {
    return { status: { not: 'done' } };
  }
}

export class AssignedToMeScope implements RhinoNamedScope {
  apply(ctx: ScopeContext): Record<string, any> {
    if (!ctx.user) return { id: { in: [] } }; // fail closed
    return { assignedTo: ctx.user.id };
  }
}

export class DueBeforeScope implements RhinoNamedScope {
  static params = ['date'];

  apply(ctx: ScopeContext): Record<string, any> {
    return { dueDate: { not: null, lt: new Date(String(ctx.args?.date)) } };
  }
}

export class DueBetweenScope implements RhinoNamedScope {
  static params = ['from', 'to'];

  apply(ctx: ScopeContext): Record<string, any> {
    return {
      dueDate: {
        gte: new Date(String(ctx.args?.from)),
        lte: new Date(String(ctx.args?.to)),
      },
    };
  }
}

export class ByStatusScope implements RhinoNamedScope {
  static params = ['status', 'priority'];
  static optionalParams = ['priority'];

  apply(ctx: ScopeContext): Record<string, any> {
    const where: Record<string, any> = { status: ctx.args?.status };
    if (ctx.args?.priority !== undefined) where.priority = ctx.args.priority;
    return where;
  }
}
