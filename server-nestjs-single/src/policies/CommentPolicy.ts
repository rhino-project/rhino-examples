import { ResourcePolicy } from '@rhino-dev/rhino-nestjs';

/**
 * Comment policy — SINGLE-TENANT (role-free). Ownership inherited via
 * CommentScope (Task → Project userId). `userId` is the comment author, stamped
 * by StampProjectOwner on create and never client-trusted.
 */
export class CommentPolicy extends ResourcePolicy {
  override resourceSlug = 'comments';

  override permittedAttributesForShow(): string[] {
    return ['*'];
  }
  override hiddenAttributesForShow(): string[] {
    return [];
  }
  override permittedAttributesForCreate(): string[] {
    return ['userId', 'body', 'taskId'];
  }
  override permittedAttributesForUpdate(): string[] {
    return ['body'];
  }
}
