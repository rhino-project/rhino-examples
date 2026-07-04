import { Controller, Get, Param, Req } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  ResourceScopeService,
  AuthService,
  RhinoException,
} from '@rhino-dev/rhino-nestjs';

/**
 * Dashboard demo controller — exercises the Rhino resource-scope resolver
 * (ResourceScopeService, the NestJS equivalent of Laravel's Rhino::query) to
 * aggregate ACROSS resources from a custom (non-CRUD) route while staying
 * tenant-safe.
 *
 * Routing note (BP-001): the tenant rewrite installed in main.ts strips the
 * `:organization` slug from the URL and attaches the resolved org to
 * `req.organization` BEFORE Nest matches this handler. So the controller is
 * declared at the bare `dashboard` path (Nest adds the global `api` prefix →
 * `/api/dashboard`); the request the user makes is `/api/<org>/dashboard`.
 *
 * Context is built EXPLICITLY (the documented NestJS pattern): we prefer the
 * org/user the framework already resolved, and fall back to resolving the org
 * from the route slug + the user from the bearer token when a raw route is
 * hit without the middleware having populated them. Either way the resolver
 * itself enforces tenant isolation and fails closed.
 */
@Controller('dashboard')
export class DashboardController {
  private readonly prisma = new PrismaClient();

  constructor(
    private readonly scope: ResourceScopeService,
    private readonly auth: AuthService,
  ) {}

  @Get()
  async summary(@Req() req: any) {
    const ctx = await this.buildContext(req);

    // project belongsToOrganization:true → the resolver's orgFilter scopes it
    // to { organizationId } and FAILS CLOSED (403 TENANT_CONTEXT_REQUIRED) if
    // no org context is present.
    const [projectsTotal, projectsByStatus] = await Promise.all([
      this.scope.count('projects', ctx),
      this.scope.groupBy('projects', ctx, {
        by: ['status'],
        _count: { _all: true },
      }),
    ]);

    // task is owner-scoped through project (belongsToOrganization:false,
    // owner:'project'), so the resolver's built-in orgFilter does NOT add an
    // org predicate for it. We pass the org boundary explicitly as extraWhere
    // (project.organizationId) — the resolver AND-wraps it with its scoped
    // where + global scopes (compose()), so tenant isolation still holds and
    // the caller cannot drop it.
    const orgTaskWhere = { project: { organizationId: ctx.organization.id } };
    const [tasksTotal, tasksByStatus] = await Promise.all([
      this.scope.count('tasks', ctx, orgTaskWhere),
      this.scope.groupBy('tasks', ctx, {
        by: ['status'],
        where: orgTaskWhere,
        _count: { _all: true },
      }),
    ]);

    return {
      organization: { id: ctx.organization.id, slug: ctx.organization.slug },
      projects_total: projectsTotal,
      projects_by_status: projectsByStatus
        .map((r: any) => ({ status: r.status, count: r._count._all }))
        .sort((a: any, b: any) => a.status.localeCompare(b.status)),
      tasks_total: tasksTotal,
      tasks_by_status: tasksByStatus
        .map((r: any) => ({ status: r.status, count: r._count._all }))
        .sort((a: any, b: any) => a.status.localeCompare(b.status)),
    };
  }

  /**
   * Explicit-context builder. Resilient to the middleware not having run: it
   * resolves the org from `req.organization` (set by the tenant rewrite) or,
   * failing that, from the slug the rewrite stashed on `req.__orgSlug`; and
   * the user from `req.user` or the bearer token. The full user (with
   * userRoles.role) is loaded so global scopes can resolve the role slug.
   */
  private async buildContext(req: any) {
    // --- organization ---
    let organization = req.organization ?? null;
    if (!organization) {
      const slug = req.__orgSlug;
      if (slug) {
        organization = await this.prisma.organization.findFirst({
          where: { slug },
        });
      }
    }
    if (!organization) {
      // No org resolved for a tenant-shaped route → surface the resolver's
      // fail-closed contract rather than silently returning cross-tenant data.
      throw RhinoException.tenantContextRequired(
        'Dashboard requires an organization context',
      );
    }

    // --- user (full record with roles, for scope resolution) ---
    let user: any = null;
    const uid = req.user?.id ?? this.userIdFromBearer(req);
    if (uid != null) {
      user = await this.prisma.user.findUnique({
        where: { id: Number(uid) },
        include: { userRoles: { include: { role: true } } },
      });
    }

    return { user, organization };
  }

  private userIdFromBearer(req: any): number | null {
    const header = String(req.headers?.authorization ?? '');
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) return null;
    try {
      const payload: any = this.auth.verifyToken(token);
      return payload?.sub != null ? Number(payload.sub) : null;
    } catch {
      return null;
    }
  }
}
