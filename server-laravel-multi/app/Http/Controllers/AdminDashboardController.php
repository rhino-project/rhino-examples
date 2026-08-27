<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\Request;
use Rhino\Exceptions\MissingTenantContext;
use Rhino\Facades\Rhino;

/**
 * Back-office controller: the SAME Rhino::query() resolver as DashboardController,
 * but reached through the 'admin' route group, which config/rhino.php declares
 * 'tenant' => false.
 *
 * There is no {organization} in the URL and no ResolveOrganizationFromRoute
 * middleware here, so no organization is ever resolved. In a tenant group that
 * would throw MissingTenantContext (fail closed). Because the route is tagged
 * with the non-tenant 'admin' group — ->defaults('route_group', 'admin') in
 * routes/api.php — the resolver applies no organization filter instead, and these
 * aggregates legitimately span every tenant.
 *
 * What still applies here: the app's own user-aware global scopes, whitelisted
 * named scopes, and the policies. Only the organization filter is lifted.
 */
class AdminDashboardController extends Controller
{
    /** Aggregates across EVERY organization. */
    public function summary(Request $request)
    {
        return response()->json([
            'scope'              => 'all-organizations',
            'route_group'        => $request->route()?->defaults['route_group'] ?? null,
            'projects_total'     => Rhino::query(Project::class)->count(),
            'tasks_total'        => Rhino::query(Task::class)->count(),
            'projects_by_org'    => Rhino::query(Project::class)
                ->selectRaw('organization_id, count(*) as c')
                ->groupBy('organization_id')
                ->pluck('c', 'organization_id'),
        ]);
    }

    /**
     * The contrast, on the SAME resolver call: this route is tagged with the
     * TENANT group and reached with no organization resolved, so Rhino::query()
     * must fail closed rather than return every tenant's rows.
     */
    public function tenantProbe()
    {
        try {
            return response()->json([
                'leaked'      => true,
                'tasks_total' => Rhino::query(Task::class)->count(),
            ]);
        } catch (MissingTenantContext $e) {
            return response()->json([
                'fail_closed' => true,
                'error'       => 'MissingTenantContext',
                'message'     => $e->getMessage(),
            ], 422);
        }
    }
}
