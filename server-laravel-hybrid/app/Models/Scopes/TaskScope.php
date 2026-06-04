<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

/**
 * TaskScope -- members and viewers only see tasks assigned to them.
 *
 * Auto-discovered by the HasAutoScope trait via naming convention.
 */
class TaskScope implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     */
    public function apply($builder, $model): void
    {
        if (app()->runningInConsole() && !app()->runningUnitTests()) {
            return;
        }

        $user = auth('sanctum')->user() ?? auth()->user();

        if (!$user) {
            return;
        }

        $organization = request()->attributes->get('organization');

        if (!$organization) {
            return;
        }

        if (!method_exists($user, 'getRoleSlugForValidation')) {
            return;
        }

        $roleSlug = $user->getRoleSlugForValidation($organization);

        // Members and viewers only see tasks assigned to them
        if (in_array($roleSlug, ['member', 'viewer'])) {
            $builder->where('tasks.assignee_id', $user->id);
        }
    }
}
