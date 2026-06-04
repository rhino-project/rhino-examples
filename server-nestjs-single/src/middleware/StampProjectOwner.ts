import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

/**
 * StampOwner — auto-stamps `userId` from the authenticated user onto the request
 * body before a row is created. The single-tenant analogue of Laravel's
 * `creating` ownership hook.
 *
 * Rhino's ResourceService only auto-injects `organizationId` (multi-tenant); it
 * has no user-ownership stamping. Rather than letting clients forge `userId`
 * through validation, we overwrite it here from `req.user` (set by the Bearer
 * parser in main.ts) so the caller can never claim another user's ownership.
 *
 * Used for Project (owner) and Comment (author). `userId` is included in the
 * relevant store validation schema + permitted create attributes so the value
 * survives validation.
 */
@Injectable()
export class StampProjectOwner implements NestMiddleware {
  use(req: Request & Record<string, any>, _res: Response, next: NextFunction) {
    const userId = (req.user as any)?.id;
    if (userId != null && req.body && typeof req.body === 'object') {
      req.body.userId = userId;
    }
    next();
  }
}
