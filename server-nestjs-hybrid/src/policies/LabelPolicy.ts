import { ResourcePolicy } from '@rhino-dev/rhino-nestjs';

/** Label policy — HYBRID (role-free attrs; gating via group membership perms). */
export class LabelPolicy extends ResourcePolicy {
  override resourceSlug = 'labels';

  override permittedAttributesForShow(): string[] {
    return ['*'];
  }
  override hiddenAttributesForShow(): string[] {
    return [];
  }
  override permittedAttributesForCreate(): string[] {
    return ['name', 'color'];
  }
  override permittedAttributesForUpdate(): string[] {
    return ['name', 'color'];
  }
}
