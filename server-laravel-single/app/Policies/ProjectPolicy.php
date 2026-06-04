<?php

namespace App\Policies;

use Rhino\Policies\ResourcePolicy;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Single-tenant ProjectPolicy.
 *
 * There are no roles in this variant: any AUTHENTICATED user may perform CRUD,
 * and per-user data isolation is enforced by ProjectScope (a global query scope),
 * not by the policy. The policy therefore only gates "is there a user at all"
 * and exposes all attributes.
 *
 * ResourcePolicy::checkPermission() falls back to `true` when the user model has
 * no hasPermission() method (which this variant's User does not), so the inherited
 * viewAny/view/create/update/delete all allow an authenticated user.
 */
class ProjectPolicy extends ResourcePolicy
{
    public function permittedAttributesForShow(?Authenticatable $user): array
    {
        return $user ? ['*'] : [];
    }

    public function permittedAttributesForCreate(?Authenticatable $user): array
    {
        return $user ? ['title', 'description', 'status', 'budget', 'internal_notes', 'starts_at', 'ends_at'] : [];
    }

    public function permittedAttributesForUpdate(?Authenticatable $user): array
    {
        return $this->permittedAttributesForCreate($user);
    }
}
