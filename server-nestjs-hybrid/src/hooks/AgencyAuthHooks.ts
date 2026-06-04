import { Injectable, Logger } from '@nestjs/common';
import type { AuthHookContext, AuthLifecycleHooks } from '@rhino-dev/rhino-nestjs';

/**
 * Agency group lifecycle hooks. Demonstrates per-group post-auth logic that is
 * DISTINCT from the vendor group's. Here we simply log a tagged audit line after
 * each agency login; a real app might check an agency-specific entitlement and
 * reject by throwing RhinoAuthRejected.
 */
@Injectable()
export class AgencyAuthHooks implements AuthLifecycleHooks {
  private readonly logger = new Logger('AgencyAuth');

  afterLogin(ctx: AuthHookContext): void {
    this.logger.log(
      `[agency] login user=${ctx.user?.id} org=${ctx.organization?.slug ?? '-'} group=${ctx.routeGroup}`,
    );
  }
}
