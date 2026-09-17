import { z } from 'zod';
import {
  ResourceRequest,
  resolveUserRoleSlug,
  type ResourceRequestContext,
} from '@rhino-dev/rhino-nestjs';

/**
 * Request class for `POST /api/{organization}/tasks`.
 *
 * It owns the whole shape contract for creating a Task and takes precedence
 * over the `validationStore` schemas still declared in
 * `src/resources/TaskResource.ts` — those are left in place on purpose so this
 * app demonstrates the precedence rule (request class wins, legacy schemas are
 * not consulted for this action).
 *
 * The parsed output IS the write payload: anything not declared below is
 * dropped and never persisted, even when the policy permits the role to set
 * it. `estimatedHours` is deliberately absent — see TaskUpdateRequest.
 */
export class TaskStoreRequest extends ResourceRequest {
  /**
   * Seeded scenario (prisma/seed.ts) that `rhino-test` can drive with curl:
   *
   *   alice@acme.com  role 'admin'   permissions ['*']
   *   bob@acme.com    role 'manager' permissions [... 'tasks.*' ...]
   *   carol@acme.com  role 'member'  permissions [... 'tasks.store' ...]
   *   dave@acme.com   role 'viewer'
   *   (all password123; eve@globex.com is the other organization)
   *
   * Only `owner` and `admin` may file a task at CRITICAL priority. Everyone
   * else gets a 403 that is byte-identical to a policy denial:
   *
   *   POST .../tasks as bob  {"title":"x","projectId":1,"priority":"critical"}
   *     → 403 {"code":"FORBIDDEN","message":"This action is unauthorized."}
   *   POST .../tasks as bob  {"title":"x","projectId":1,"priority":"high"}
   *     → 201
   *   POST .../tasks as alice {"title":"x","projectId":1,"priority":"critical"}
   *     → 201
   *
   * (carol/dave never reach this hook: TaskPolicy.permittedAttributesForCreate
   * returns [] for member/viewer, so the forbidden-field gate rejects them
   * first with 403 FORBIDDEN_FIELDS.)
   */
  override authorize(ctx: ResourceRequestContext): boolean {
    if (ctx.input.priority !== 'critical') return true;
    const role = resolveUserRoleSlug(ctx.user, ctx.organization?.id);
    return role === 'owner' || role === 'admin';
  }

  /**
   * Server-authored normalization. It runs AFTER the policy's forbidden-field
   * gate, so it can never launder a denied field, and BEFORE `authorize`, so
   * the priority check above sees the normalized value.
   *
   * It also runs BEFORE `rules()`, which means the input is still RAW — a
   * client may send any JSON type. Every string operation below is guarded
   * with `typeof`, and a non-string is left untouched so Zod rejects it with a
   * 422 rather than a TypeError surfacing as a 500 (e.g. {"title": ["x"]}).
   * Do not `String()`-coerce instead: that would turn ["x"] into "x" and slip
   * it past the `z.string()` rule.
   */
  override prepare(input: Record<string, any>): Record<string, any> {
    return {
      ...input,
      title: typeof input.title === 'string' ? input.title.trim() : input.title,
      priority:
        typeof input.priority === 'string' ? input.priority.toLowerCase() : input.priority,
    };
  }

  rules(_ctx: ResourceRequestContext) {
    return z.object({
      title: z.string().min(1).max(255),
      description: z.string().nullable().optional(),
      status: z.enum(['todo', 'in_progress', 'done']).optional(),
      priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      dueDate: z.string().datetime({ offset: true }).or(z.date()).nullable().optional(),
      // Cross-tenant safety for this FK is NOT re-implemented here: the Task
      // registration declares fkConstraints [{ field: 'projectId', model:
      // 'project' }], and Rhino runs verifyTenantFks on this request class's
      // output, so a projectId belonging to another organization comes back as
      // 422 CROSS_TENANT. Tasks reach their organization through Project
      // (`owner: 'project'`), i.e. the INDIRECT tenancy path.
      projectId: z.number().int(),
      assignedTo: z.number().int().nullable().optional(),
    });
  }
}
