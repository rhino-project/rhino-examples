<?php

namespace App\Policies;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class OrganizationPolicy
{
    public function viewAny(?User $user): Response
    {
        return $user ? Response::allow() : Response::deny();
    }

    public function view(?User $user, Organization $organization): Response
    {
        if (!$user) {
            return Response::deny();
        }

        return $user->organizations()->where('organizations.id', $organization->id)->exists()
            ? Response::allow()
            : Response::deny();
    }

    public function create(?User $user): Response
    {
        return $user ? Response::allow() : Response::deny();
    }

    public function update(?User $user, Organization $organization): Response
    {
        if (!$user) {
            return Response::deny();
        }

        return $user->organizations()->where('organizations.id', $organization->id)->exists()
            ? Response::allow()
            : Response::deny();
    }

    public function delete(?User $user, Organization $organization): Response
    {
        if (!$user) {
            return Response::deny();
        }

        return $user->organizations()->where('organizations.id', $organization->id)->exists()
            ? Response::allow()
            : Response::deny();
    }
}
