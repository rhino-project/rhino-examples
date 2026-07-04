<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Rhino\Facades\Rhino;
use App\Models\Task;
use App\Models\Project;

class DashboardController extends Controller
{
    /**
     * Dashboard aggregates for the CURRENT tenant.
     *
     * DIRECT (ambient) mode: the tenant route group's ResolveOrganizationFromRoute
     * middleware already resolved the org from the {organization} route param and
     * set it on the request (also enforcing that the authenticated user belongs to
     * that org). Rhino::query() therefore reads the org from ambient context and
     * scopes every query to THIS tenant automatically — Project directly by
     * organization_id, Task by walking its project -> organization FK chain.
     *
     * Note: a cross-tenant request (a user hitting an org they don't belong to) is
     * rejected by the middleware with 404 before this controller ever runs, so the
     * dashboard is only ever reached with a valid (user, org) pairing.
     */
    public function summary(Request $request)
    {
        $org = $request->attributes->get('organization');

        // A fresh closure per use so the aggregate builders don't share state.
        $tasks = fn () => Rhino::query(Task::class);

        return response()->json([
            'organization'      => optional($org)->slug,
            'organization_id'   => optional($org)->id,
            'projects_total'    => Rhino::query(Project::class)->count(),
            'tasks_total'       => $tasks()->count(),
            'tasks_by_status'   => $tasks()
                ->selectRaw('status, count(*) as c')
                ->groupBy('status')
                ->pluck('c', 'status'),
            'projects_by_status' => Rhino::query(Project::class)
                ->selectRaw('status, count(*) as c')
                ->groupBy('status')
                ->pluck('c', 'status'),
        ]);
    }
}
