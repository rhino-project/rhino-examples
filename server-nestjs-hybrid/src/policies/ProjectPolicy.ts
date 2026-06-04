import { ResourcePolicy } from '@rhino-dev/rhino-nestjs';

/**
 * Project policy — HYBRID. Action authorization is enforced by the
 * ResourcePolicyGuard against the permissions resolved for the matched group
 * membership (enforceGroupMembership ON). Row visibility is by group:
 * org-scoping (agency/vendor) or ProjectHybridScope userId (personal). Attribute
 * permissions are open to any member; `userId` is permitted on create because
 * StampPersonalProjectOwner stamps it (personal group only).
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
