import { ResourcePolicy } from '@rhino-dev/rhino-nestjs';

/** Comment policy — HYBRID (role-free attrs; gating via group membership perms). */
export class CommentPolicy extends ResourcePolicy {
  override resourceSlug = 'comments';

  override permittedAttributesForShow(): string[] {
    return ['*'];
  }
  override hiddenAttributesForShow(): string[] {
    return [];
  }
  override permittedAttributesForCreate(): string[] {
    return ['body', 'taskId'];
  }
  override permittedAttributesForUpdate(): string[] {
    return ['body'];
  }
}
