import { Controller, Get, Req } from '@nestjs/common';
import { ResourceScopeService, RhinoException } from '@rhino-dev/rhino-nestjs';

/**
 * Back-office controller: the SAME ResourceScopeService resolver as
 * DashboardController, but served by the `admin` route group, which
 * src/rhino.config.ts declares `tenant: false`.
 *
 * There is no `:organization` in the URL and no org is ever resolved here.
 * In a tenant group that would throw TENANT_CONTEXT_REQUIRED (fail closed).
 * Because `ctx.routeGroup` is the non-tenant `admin` group — RouteGroupMiddleware
 * puts the group on `req.__routeGroup` for every request — the resolver applies
 * no organization filter instead, and these aggregates legitimately span every
 * tenant.
 *
 * What still applies here: the models' own `scopes`, whitelisted named scopes,
 * and the policies. Only the organization filter is lifted.
 */
@Controller('admin')
export class AdminDashboardController {
  constructor(private readonly scope: ResourceScopeService) {}

  /** Aggregates across EVERY organization. */
  @Get('dashboard')
  async summary(@Req() req: any) {
    const ctx = { user: req.user, routeGroup: req.__routeGroup ?? 'admin' };

    const [projectsTotal, tasksTotal, projectsByOrg] = await Promise.all([
      this.scope.count('projects', ctx),
      this.scope.count('tasks', ctx),
      this.scope.groupBy('projects', ctx, {
        by: ['organizationId'],
        _count: { _all: true },
      }),
    ]);

    return {
      scope: 'all-organizations',
      route_group: ctx.routeGroup,
      projects_total: projectsTotal,
      tasks_total: tasksTotal,
      projects_by_org: Object.fromEntries(
        projectsByOrg.map((row: any) => [row.organizationId, row._count?._all ?? 0]),
      ),
    };
  }

  /**
   * The contrast, on the SAME resolver call: this handler passes the TENANT
   * group with no organization, so the resolver must fail closed rather than
   * return every tenant's rows.
   */
  @Get('tenant-probe')
  async tenantProbe(@Req() req: any) {
    try {
      const tasksTotal = await this.scope.count('tasks', {
        user: req.user,
        routeGroup: 'tenant',
      });
      return { leaked: true, tasks_total: tasksTotal };
    } catch (e) {
      if (e instanceof RhinoException) {
        const body = e.getResponse() as any;
        return { fail_closed: true, error: body.code, message: body.message };
      }
      throw e;
    }
  }
}
