<?php

namespace Tests;

use App\Models\Organization;
use App\Models\Role;
use App\Models\User;
use App\Models\UserRole;

/**
 * Seed the five standard roles used by TaskFlow.
 */
function seedRoles(): array
{
    $roles = [];
    foreach (['owner', 'admin', 'manager', 'member', 'viewer'] as $slug) {
        $roles[$slug] = Role::firstOrCreate(
            ['slug' => $slug],
            ['name' => ucfirst($slug), 'description' => ucfirst($slug) . ' role']
        );
    }
    return $roles;
}

/**
 * Create a user with a specific role in a given organization.
 */
function createUserInOrg(string $roleSlug, Organization $org, array $permissions = ['*']): User
{
    $user = User::factory()->create();
    $role = Role::where('slug', $roleSlug)->firstOrFail();

    UserRole::create([
        'user_id' => $user->id,
        'role_id' => $role->id,
        'organization_id' => $org->id,
        'permissions' => $permissions,
    ]);

    return $user;
}
