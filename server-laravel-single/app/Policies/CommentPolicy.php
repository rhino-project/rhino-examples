<?php

namespace App\Policies;

use Rhino\Policies\ResourcePolicy;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Single-tenant CommentPolicy. Any authenticated user may CRUD; CommentScope
 * enforces ownership (via Task → Project). All attributes are exposed.
 */
class CommentPolicy extends ResourcePolicy
{
    public function permittedAttributesForShow(?Authenticatable $user): array
    {
        return $user ? ['*'] : [];
    }

    public function permittedAttributesForCreate(?Authenticatable $user): array
    {
        return $user ? ['body', 'task_id'] : [];
    }

    public function permittedAttributesForUpdate(?Authenticatable $user): array
    {
        return $user ? ['body'] : [];
    }
}
