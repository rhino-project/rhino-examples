<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Scope;

/**
 * PersonalProjectScope — user-ownership isolation for the personal group.
 *
 * Auto-discovered by Rhino's HasAutoScope trait. Constrains every query to the
 * authenticated user's own personal projects.
 */
class PersonalProjectScope implements Scope
{
    public function apply($builder, $model): void
    {
        if (app()->runningInConsole() && !app()->runningUnitTests()) {
            return;
        }

        $user = auth('sanctum')->user() ?? auth()->user();

        if ($user) {
            $builder->where('personal_projects.user_id', $user->getKey());
        }
    }
}
