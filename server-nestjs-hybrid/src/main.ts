import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import {
  RHINO_CONFIG,
  RHINO_PRISMA_CLIENT,
  AuthService,
  applyRhinoRouting,
  createDomainRouteResolver,
} from '@rhino-dev/rhino-nestjs';

import { AppModule } from './app.module';
import { RhinoExceptionFilter } from './RhinoExceptionFilter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new RhinoExceptionFilter());

  const config = app.get(RHINO_CONFIG);
  const prisma = app.get(RHINO_PRISMA_CLIENT);
  const auth = app.get(AuthService);

  // Parse the Bearer token at the Express layer so req.user.id is set before the
  // domain resolver runs and before the ownership stamp middleware.
  app.use(async (req: any, _res: any, next: any) => {
    // Public auth entrypoints (login/register/password) must skip the JWT guard
    // even though a domain route group (agency/vendor/personal) claims the host
    // and its empty prefix would otherwise win over the prefix-based `auth`
    // group in RouteGroupMiddleware. The resolved group still flows to the auth
    // controller's hooks via __routeGroup (set by the domain resolver below).
    const path = String(req.originalUrl ?? req.url ?? '').split('?')[0];
    if (/\/auth\/(login|register|password\/)/.test(path)) {
      req.__skipAuth = true;
    }
    const header = String(req.headers?.authorization ?? '');
    const [scheme, token] = header.split(' ');
    if (scheme === 'Bearer' && token) {
      try {
        const payload = auth.verifyToken(token);
        req.user = { id: payload.sub };
      } catch {
        /* invalid token — JwtAuthGuard produces a 401 later */
      }
    }
    next();
  });

  // Host-based route-group + tenant resolution (subdomain analogue of
  // createTenantRouteRewrite). For `{organization}.agency.lvh.me` /
  // `{organization}.vendor.lvh.me` it resolves req.organization from the
  // subdomain and sets req.__routeGroup; for `app.lvh.me` it sets the personal
  // group with no org. The resolver's own membership 404 is disabled so the
  // GroupMembershipGuard surfaces a 403 on group/org mismatch instead.
  app.use(
    createDomainRouteResolver({
      prisma,
      config,
      options: { strict: true, enforceMembership: false },
    }),
  );

  applyRhinoRouting(app, { prefix: 'api' });
  const port = Number(process.env.PORT ?? 8006);
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`TaskFlow NestJS (hybrid) listening on http://localhost:${port}`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start:', err);
  process.exit(1);
});
