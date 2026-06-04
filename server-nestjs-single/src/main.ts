import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AuthService, applyRhinoRouting } from '@rhino-dev/rhino-nestjs';

import { AppModule } from './app.module';
import { RhinoExceptionFilter } from './RhinoExceptionFilter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new RhinoExceptionFilter());

  const auth = app.get(AuthService);

  // Parse the Bearer token at the Express layer so req.user.id is available to
  // the ownership middleware (StampProjectOwner) and scopes before the route
  // handler runs. The JwtAuthGuard still loads the full user for the policy
  // check; this only pre-populates the id. (Single-tenant: there is NO tenant
  // route rewrite — ownership is by userId, not org.)
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

  applyRhinoRouting(app, { prefix: 'api' });
  const port = Number(process.env.PORT ?? 8004);
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`TaskFlow NestJS (single-tenant) listening on http://localhost:${port}`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start:', err);
  process.exit(1);
});
