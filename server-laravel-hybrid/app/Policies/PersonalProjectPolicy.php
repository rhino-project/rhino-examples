<?php

namespace App\Policies;

use Rhino\Policies\ResourcePolicy;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * PersonalProjectPolicy — personal group is user-owned (no roles).
 *
 * With group-membership enforcement ON, the personal user resolves permissions
 * from their `route_group = 'personal'` (org-less) user_roles row. The policy's
 * checkPermission delegates to User::hasPermission with that route_group, so the
 * membership row's `permissions` blob gates CRUD. Ownership isolation is handled
 * by PersonalProjectScope.
 */
class PersonalProjectPolicy extends ResourcePolicy
{
    public function permittedAttributesForShow(?Authenticatable $user): array
    {
        return $user ? ['*'] : [];
    }

    public function permittedAttributesForCreate(?Authenticatable $user): array
    {
        return $user ? ['title', 'description', 'status'] : [];
    }

    public function permittedAttributesForUpdate(?Authenticatable $user): array
    {
        return $this->permittedAttributesForCreate($user);
    }
}
