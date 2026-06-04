import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaClient } from '@prisma/client';
import {
  RhinoModule,
  JwtAuthGuard,
  ResponseInterceptor,
} from '@rhino-dev/rhino-nestjs';

import { buildRhinoConfig } from './rhino.config';

const prisma = new PrismaClient();

@Module({
  imports: [
    RhinoModule.forRoot(buildRhinoConfig(prisma), {
      registerControllers: true,
      // JwtAuthGuard is wired as APP_GUARD below. autoRouteGroupMiddleware
      // sets req.__skipAuth for public groups (auth/* in this config), so
      // login stays unauthenticated despite the global guard.
      autoAuthGuard: false,
      autoPolicyGuard: true,
      autoRouteGroupMiddleware: true, // BP-006 fixed in 0.2.0
      autoTenantMiddleware: false, // tenant rewrite runs in main.ts
    }),
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
})
export class AppModule {}
