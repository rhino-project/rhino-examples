<?php

namespace App\Policies;

use Rhino\Policies\ResourcePolicy;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Single-tenant TaskPolicy. Any authenticated user may CRUD; TaskScope enforces
 * ownership (via the parent Project). All attributes are exposed.
 */
class TaskPolicy extends ResourcePolicy
{
    public function permittedAttributesForShow(?Authenticatable $user): array
    {
        return $user ? ['*'] : [];
    }

    public function permittedAttributesForCreate(?Authenticatable $user): array
    {
        return $user
            ? ['title', 'description', 'status', 'priority', 'estimated_hours', 'due_date', 'project_id', 'assignee_id']
            : [];
    }

    public function permittedAttributesForUpdate(?Authenticatable $user): array
    {
        return $this->permittedAttributesForCreate($user);
    }
}
