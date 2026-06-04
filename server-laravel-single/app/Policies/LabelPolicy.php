<?php

namespace App\Policies;

use Rhino\Policies\ResourcePolicy;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Single-tenant LabelPolicy.
 *
 * Labels are a SHARED GLOBAL catalog (no scope). Any authenticated user may read
 * and manage the shared catalog. All attributes are exposed.
 */
class LabelPolicy extends ResourcePolicy
{
    public function permittedAttributesForShow(?Authenticatable $user): array
    {
        return $user ? ['*'] : [];
    }

    public function permittedAttributesForCreate(?Authenticatable $user): array
    {
        return $user ? ['name', 'color'] : [];
    }

    public function permittedAttributesForUpdate(?Authenticatable $user): array
    {
        return $this->permittedAttributesForCreate($user);
    }
}
