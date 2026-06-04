<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

/**
 * CommentScope — single-tenant ownership isolation (inherited via Task → Project).
 *
 * A comment is owned through its task's project. We constrain to comments whose
 * task belongs to a project owned by the current user.
 */
class CommentScope implements Scope
{
    public function apply($builder, $model): void
    {
        if (app()->runningInConsole() && !app()->runningUnitTests()) {
            return;
        }

        $user = auth('sanctum')->user() ?? auth()->user();

        if ($user) {
            $builder->whereHas('task.project', function (Builder $q) use ($user) {
                $q->where('projects.user_id', $user->getKey());
            });
        }
    }
}
