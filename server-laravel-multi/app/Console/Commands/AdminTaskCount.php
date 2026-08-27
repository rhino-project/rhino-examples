<?php

namespace App\Console\Commands;

use App\Models\Organization;
use App\Models\Task;
use Illuminate\Console\Command;
use Rhino\Exceptions\MissingTenantContext;
use Rhino\Facades\Rhino;

/**
 * The job / console case. There is no request here, so no route group resolves
 * and a bare Rhino::query() has nothing to go on — it fails closed, as it should.
 *
 * A back-office job says which group it is acting as with inRouteGroup(). The
 * group's own 'tenant' => false in config/rhino.php is what actually lifts the
 * boundary — naming a tenant group changes nothing.
 */
class AdminTaskCount extends Command
{
    protected $signature = 'admin:task-count';

    protected $description = 'Count tasks across every organization from the console';

    public function handle(): int
    {
        try {
            Rhino::query(Task::class)->count();
            $this->error('LEAKED: a bare Rhino::query() in the console returned rows');

            return self::FAILURE;
        } catch (MissingTenantContext $e) {
            $this->line('bare Rhino::query()              → MissingTenantContext (fail closed)');
        }

        $all = Rhino::inRouteGroup('admin')->query(Task::class)->count();
        $this->line("inRouteGroup('admin')            → {$all} tasks (every organization)");

        $this->line("inRouteGroup('tenant')           → " . $this->probeTenantGroup());

        $org = Organization::where('slug', 'acme-corp')->first();
        $scoped = Rhino::inRouteGroup('admin')->inOrganization($org)->query(Task::class)->count();
        $this->line("inRouteGroup('admin')+inOrg(acme) → {$scoped} tasks (that tenant only)");

        return self::SUCCESS;
    }

    /** Naming a tenant group is not a way around the boundary. */
    protected function probeTenantGroup(): string
    {
        try {
            return Rhino::inRouteGroup('tenant')->query(Task::class)->count() . ' tasks (LEAKED)';
        } catch (MissingTenantContext $e) {
            return 'MissingTenantContext (fail closed)';
        }
    }
}
