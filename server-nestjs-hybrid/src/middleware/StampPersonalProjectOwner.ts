import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

/**
 * StampPersonalProjectOwner — stamps `userId` onto a Project create ONLY for the
 * personal group (no resolved organization). For agency/vendor (org groups) the
 * library injects `organizationId` and we leave userId null.
 *
 * Runs after the Express-level domainRouteResolver, so `req.organization` is
 * already set for org-group hosts. userId comes from the Bearer parser in main.ts.
 */
@Injectable()
export class StampPersonalProjectOwner implements NestMiddleware {
  use(req: Request & Record<string, any>, _res: Response, next: NextFunction) {
    const hasOrg = !!req.organization;
    const userId = (req.user as any)?.id;
    if (!hasOrg && userId != null && req.body && typeof req.body === 'object') {
      req.body.userId = userId;
    }
    next();
  }
}
