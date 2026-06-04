import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import {
  RHINO_CONFIG,
  RHINO_PRISMA_CLIENT,
  AuthService,
  applyRhinoRouting,
  createTenantRouteRewrite,
} from '@rhino-dev/rhino-nestjs';

import { AppModule } from './app.module';
import { RhinoExceptionFilter } from './RhinoExceptionFilter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new RhinoExceptionFilter());

  const config = app.get(RHINO_CONFIG);
  const prisma = app.get(RHINO_PRISMA_CLIENT);
  const auth = app.get(AuthService);

  // Parse the Bearer token at the Express layer so req.user is set before
  // createTenantRouteRewrite runs its membership check. Without this, Nest's
  // JwtAuthGuard (which populates req.user) fires AFTER the tenant rewrite
  // is done, so cross-tenant access would return 403 from the policy guard
  // instead of 404 (PRD AC-1 parity with Laravel).
  app.use(async (req: any, _res: any, next: any) => {
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

  app.use(createTenantRouteRewrite({ prisma, config }));

  applyRhinoRouting(app, { prefix: 'api' });
  const port = Number(process.env.PORT ?? 8005);
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`TaskFlow NestJS (multitenant) listening on http://localhost:${port}`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start:', err);
  process.exit(1);
});
