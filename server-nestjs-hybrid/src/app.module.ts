import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaClient } from '@prisma/client';
import { RhinoModule, ResponseInterceptor } from '@rhino-dev/rhino-nestjs';

import { buildRhinoConfig } from './rhino.config';

const prisma = new PrismaClient();

@Module({
  imports: [
    RhinoModule.forRoot(buildRhinoConfig(prisma), {
      registerControllers: true,
      // Let the module wire the guard chain in the correct order:
      //   JwtAuthGuard → GroupMembershipGuard → ResourcePolicyGuard.
      // The membership guard enforces enforceGroupMembership (ON here): an
      // authenticated user must hold a user_roles row matching the resolved
      // route group (+ org for tenant groups), else 403.
      autoAuthGuard: true,
      autoMembershipGuard: true,
      autoPolicyGuard: true,
      autoRouteGroupMiddleware: true,
      // Domain-based org resolution runs in main.ts (createDomainRouteResolver),
      // so the built-in path-prefix tenant middleware is disabled.
      autoTenantMiddleware: false,
    }),
  ],
  providers: [{ provide: APP_INTERCEPTOR, useClass: ResponseInterceptor }],
})
export class AppModule {}
