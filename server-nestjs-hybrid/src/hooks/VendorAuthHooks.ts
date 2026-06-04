import { Injectable, Logger } from '@nestjs/common';
import type { AuthHookContext, AuthLifecycleHooks } from '@rhino-dev/rhino-nestjs';

/**
 * Vendor group lifecycle hooks — a DIFFERENT sign-in flow from the agency group.
 * Logs a vendor-tagged line after login (distinct side effect / audit channel).
 */
@Injectable()
export class VendorAuthHooks implements AuthLifecycleHooks {
  private readonly logger = new Logger('VendorAuth');

  afterLogin(ctx: AuthHookContext): void {
    this.logger.log(
      `[vendor] login user=${ctx.user?.id} org=${ctx.organization?.slug ?? '-'} group=${ctx.routeGroup}`,
    );
  }
}
