<?php

namespace App\Policies;

use Rhino\Policies\ResourcePolicy;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Policy for the User resource.
 *
 * Users are read-only through the API: every organization member can list
 * teammates (Members page, task assignee includes), but user records are
 * never created, updated, or deleted through Rhino endpoints.
 */
class UserPolicy extends ResourcePolicy
{
    public function permittedAttributesForShow(?Authenticatable $user): array
    {
        return ['id', 'name', 'email', 'created_at'];
    }

    public function create(?Authenticatable $user): bool
    {
        return false;
    }

    public function update(?Authenticatable $user, $model = null): bool
    {
        return false;
    }

    public function delete(?Authenticatable $user, $model = null): bool
    {
        return false;
    }
}
