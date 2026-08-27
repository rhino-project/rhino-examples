/**
 * The job / script case. There is no request here, so nothing populates
 * `req.__routeGroup` — the context is hand-built, exactly as a queued job would
 * build it. A ctx with no `routeGroup` fails closed; naming the non-tenant
 * `admin` group is what lets the query span every organization, and the group's
 * own `tenant: false` in src/rhino.config.ts is what makes that legal.
 *
 *   npx ts-node scripts/admin-task-count.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import {
  PrismaService,
  QueryBuilderService,
  ResourceScopeService,
  RhinoConfigService,
  ScopeService,
  normalizeConfig,
} from '@rhino-dev/rhino-nestjs';

import { buildRhinoConfig } from '../src/rhino.config';

async function main() {
  const prismaClient = new PrismaClient();
  const config = new RhinoConfigService(normalizeConfig(buildRhinoConfig(prismaClient) as any));
  const scope = new ResourceScopeService(
    new PrismaService(prismaClient as any),
    config,
    new QueryBuilderService(),
    new ScopeService(),
  );

  const probe = async (label: string, ctx: any) => {
    try {
      console.log(`${label} → ${await scope.count('tasks', ctx)} tasks`);
    } catch (e: any) {
      const body = e?.getResponse?.() ?? {};
      console.log(`${label} → ${body.code ?? e?.message} (fail closed)`);
    }
  };

  await probe('no routeGroup                     ', {});
  await probe("routeGroup: 'admin'               ", { routeGroup: 'admin' });
  await probe("routeGroup: 'tenant'              ", { routeGroup: 'tenant' });

  const acme = await prismaClient.organization.findFirst({ where: { slug: 'acme' } });
  await probe("routeGroup: 'admin' + organization", { routeGroup: 'admin', organization: acme });

  await prismaClient.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
