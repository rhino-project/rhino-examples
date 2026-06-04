<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

/**
 * TaskScope — single-tenant ownership isolation (inherited via parent Project).
 *
 * A task has no user_id of its own; it is owned by whoever owns its Project. We
 * therefore constrain to tasks whose project belongs to the current user.
 */
class TaskScope implements Scope
{
    public function apply($builder, $model): void
    {
        if (app()->runningInConsole() && !app()->runningUnitTests()) {
            return;
        }

        $user = auth('sanctum')->user() ?? auth()->user();

        if ($user) {
            $builder->whereHas('project', function (Builder $q) use ($user) {
                $q->where('projects.user_id', $user->getKey());
            });
        }
    }
}
