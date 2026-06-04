<?php

namespace Database\Seeders;

use App\Models\Organization;
use App\Models\PersonalProject;
use App\Models\Project;
use App\Models\Role;
use App\Models\Task;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Hybrid seeder (GROUP_AUTH_DESIGN, enforce_group_membership = ON).
 *
 * Seeds three isolated audiences:
 *   - an agency org (acme) + an agency member  (route_group = 'agency')
 *   - a vendor org (globex) + a vendor member  (route_group = 'vendor', distinct user)
 *   - a personal user (route_group = 'personal', org-less) who owns PersonalProjects
 *
 * Memberships are keyed by (user, route_group, organization, role), so the agency
 * member is NOT a member of the vendor group (and vice versa) → 403 cross-group.
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Roles
        $roles = [];
        foreach (['owner', 'admin', 'manager', 'member', 'viewer'] as $slug) {
            $roles[$slug] = Role::firstOrCreate(
                ['slug' => $slug],
                ['name' => ucfirst($slug), 'description' => ucfirst($slug) . ' role']
            );
        }

        // -------------------------------------------------------------------
        // Agency org + agency member
        // -------------------------------------------------------------------
        $acme = Organization::firstOrCreate(
            ['slug' => 'acme'],
            ['name' => 'Acme Agency', 'description' => 'Agency org', 'is_active' => true]
        );

        $agencyUser = User::firstOrCreate(
            ['email' => 'agency@acme.com'],
            ['name' => 'Agency Annie', 'password' => Hash::make('password')]
        );

        UserRole::firstOrCreate(
            [
                'user_id' => $agencyUser->id,
                'role_id' => $roles['admin']->id,
                'organization_id' => $acme->id,
                'route_group' => 'agency',
            ],
            ['permissions' => ['*']]
        );

        $acmeProject = Project::firstOrCreate(
            ['title' => 'Acme Campaign', 'organization_id' => $acme->id],
            ['description' => 'Agency campaign work.', 'status' => 'active', 'budget' => 25000.00]
        );
        Task::firstOrCreate(
            ['title' => 'Draft creative brief', 'project_id' => $acmeProject->id],
            ['status' => 'in_progress', 'priority' => 'high', 'assignee_id' => $agencyUser->id]
        );

        // -------------------------------------------------------------------
        // Vendor org + vendor member (DISTINCT user, distinct group)
        // -------------------------------------------------------------------
        $globex = Organization::firstOrCreate(
            ['slug' => 'globex'],
            ['name' => 'Globex Vendor', 'description' => 'Vendor org', 'is_active' => true]
        );

        $vendorUser = User::firstOrCreate(
            ['email' => 'vendor@globex.com'],
            ['name' => 'Vendor Vince', 'password' => Hash::make('password')]
        );

        UserRole::firstOrCreate(
            [
                'user_id' => $vendorUser->id,
                'role_id' => $roles['admin']->id,
                'organization_id' => $globex->id,
                'route_group' => 'vendor',
            ],
            ['permissions' => ['*']]
        );

        $globexProject = Project::firstOrCreate(
            ['title' => 'Globex Supply', 'organization_id' => $globex->id],
            ['description' => 'Vendor supply work.', 'status' => 'active', 'budget' => 40000.00]
        );
        Task::firstOrCreate(
            ['title' => 'Confirm SKUs', 'project_id' => $globexProject->id],
            ['status' => 'todo', 'priority' => 'medium', 'assignee_id' => $vendorUser->id]
        );

        // -------------------------------------------------------------------
        // Personal user (org-less, route_group = 'personal')
        // -------------------------------------------------------------------
        $personalUser = User::firstOrCreate(
            ['email' => 'personal@example.com'],
            ['name' => 'Personal Pat', 'password' => Hash::make('password')]
        );

        UserRole::firstOrCreate(
            [
                'user_id' => $personalUser->id,
                'role_id' => $roles['owner']->id,
                'organization_id' => null,
                'route_group' => 'personal',
            ],
            ['permissions' => ['personal-projects.*']]
        );

        PersonalProject::firstOrCreate(
            ['title' => 'My Side Hustle', 'user_id' => $personalUser->id],
            ['description' => 'A private personal project.', 'status' => 'active']
        );
    }
}
