import { ResourcePolicy } from '@rhino-dev/rhino-nestjs';

/**
 * Label policy — SINGLE-TENANT (role-free). Label is a SHARED GLOBAL catalog:
 * no ownership scope, every authenticated user sees all labels. Action
 * authorization comes from User.permissions (`labels.*`).
 */
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
