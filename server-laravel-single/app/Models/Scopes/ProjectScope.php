<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

/**
 * ProjectScope — single-tenant ownership isolation.
 *
 * Auto-discovered by Rhino's HasAutoScope trait (naming convention
 * {Model}Scope). Applied as a global scope on every Project query, so the
 * authenticated user only ever sees / mutates their own projects.
 *
 * Skipped on the console (artisan/seeders) so seeding can create rows for any
 * user, and skipped when unauthenticated (auth:sanctum middleware handles 401).
 */
class ProjectScope implements Scope
{
    public function apply($builder, $model): void
    {
        if (app()->runningInConsole() && !app()->runningUnitTests()) {
            return;
        }

        $user = auth('sanctum')->user() ?? auth()->user();

        if ($user) {
            $builder->where('projects.user_id', $user->getKey());
        }
    }
}
