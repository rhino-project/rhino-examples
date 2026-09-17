import { z } from 'zod';
import {
  ResourceRequest,
  type ResourceRequestContext,
} from '@rhino-dev/rhino-nestjs';

/**
 * Request class for `PUT /api/{organization}/tasks/{hashId}`.
 *
 * Every field is optional — a request class does NOT get the legacy path's
 * automatic partial-update relaxation, so an Update class declares it itself.
 *
 * `estimatedHours` is intentionally NOT declared, although
 * TaskPolicy.permittedAttributesForUpdate permits it for owner/admin/manager.
 * Sending it returns 200 with the stored value unchanged — the fail-closed
 * write-payload rule in action:
 *
 *   PUT .../tasks/{hashId} as alice {"estimatedHours": 99}
 *     → 200, estimatedHours unchanged
 */
export class TaskUpdateRequest extends ResourceRequest {
  rules(ctx: ResourceRequestContext) {
    // Record-dependent rule. `ctx.record` is the PRE-UPDATE row, loaded with
    // the organization scope already applied. Status only moves forward: once
    // a task has left 'todo' it can never go back.
    //
    //   seed: task "Design homepage" starts at 'in_progress'
    //   PUT {"status":"todo"} → 422 {"code":"VALIDATION_FAILED", ...
    //        "details":{"errors":{"status":["..."]}}}
    //   PUT {"status":"done"} → 200
    const current = (ctx.record as any)?.status;
    const status =
      current && current !== 'todo'
        ? z.enum(['in_progress', 'done'])
        : z.enum(['todo', 'in_progress', 'done']);

    return z.object({
      title: z.string().min(1).max(255).optional(),
      description: z.string().nullable().optional(),
      status: status.optional(),
      priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      dueDate: z.string().datetime({ offset: true }).or(z.date()).nullable().optional(),
      // Same indirect-tenancy FK path as TaskStoreRequest — see the comment
      // there; verifyTenantFks runs on this class's output too.
      projectId: z.number().int().optional(),
      assignedTo: z.number().int().nullable().optional(),
    });
  }
}
