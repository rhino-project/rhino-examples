import { ResourcePolicy } from '@rhino-dev/rhino-nestjs';

/**
 * Task policy — SINGLE-TENANT (role-free). Ownership inherited via TaskScope
 * (parent Project's userId). Action authorization comes from User.permissions.
 */
export class TaskPolicy extends ResourcePolicy {
  override resourceSlug = 'tasks';

  override permittedAttributesForShow(): string[] {
    return ['*'];
  }
  override hiddenAttributesForShow(): string[] {
    return [];
  }
  override permittedAttributesForCreate(): string[] {
    return ['title', 'description', 'status', 'priority', 'estimatedHours', 'dueDate', 'projectId', 'assignedTo'];
  }
  override permittedAttributesForUpdate(): string[] {
    return ['title', 'description', 'status', 'priority', 'estimatedHours', 'dueDate', 'projectId', 'assignedTo'];
  }
}
