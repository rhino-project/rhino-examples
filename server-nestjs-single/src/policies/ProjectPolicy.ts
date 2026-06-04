import { ResourcePolicy } from '@rhino-dev/rhino-nestjs';

/**
 * Project policy — SINGLE-TENANT (role-free).
 *
 * No roles in this variant: action authorization is driven by the user's global
 * `permissions` (User.permissions JSON) checked by ResourcePolicyGuard via
 * `{slug}.{action}`. Row-level ownership is enforced separately by ProjectScope
 * (userId == current user), so attribute permissions are simply "the owner sees
 * and edits everything they own".
 *
 * `userId` is permitted on create because StampProjectOwner stamps it from the
 * authenticated user before validation — it is never client-trusted.
 */
export class ProjectPolicy extends ResourcePolicy {
  override resourceSlug = 'projects';

  override permittedAttributesForShow(): string[] {
    return ['*'];
  }
  override hiddenAttributesForShow(): string[] {
    return [];
  }
  override permittedAttributesForCreate(): string[] {
    return ['userId', 'title', 'description', 'status', 'budget', 'internalNotes', 'startsAt', 'endsAt'];
  }
  override permittedAttributesForUpdate(): string[] {
    return ['title', 'description', 'status', 'budget', 'internalNotes', 'startsAt', 'endsAt'];
  }
}
