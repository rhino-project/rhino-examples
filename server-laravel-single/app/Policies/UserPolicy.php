<?php

namespace App\Policies;

use Illuminate\Contracts\Auth\Authenticatable;
use Rhino\Policies\ResourcePolicy;

/**
 * Single-tenant UserPolicy.
 *
 * No roles in this variant — any authenticated user may view users. This exists
 * so `?include=assignee` (a User relation on tasks) passes the library's
 * per-include `viewAny` authorization. We override viewAny/view explicitly
 * because User is NOT a registered Rhino model, so ResourcePolicy can't resolve
 * a permission slug for it and would otherwise deny.
 */
class UserPolicy extends ResourcePolicy
{
    public function viewAny(?Authenticatable $user): bool
    {
        return $user !== null;
    }

    public function view(?Authenticatable $user, $model = null): bool
    {
        return $user !== null;
    }
}
