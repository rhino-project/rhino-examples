import { ResourcePolicy } from '@rhino-dev/rhino-nestjs';

/** Task policy — HYBRID (role-free attrs; gating via group membership perms). */
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
