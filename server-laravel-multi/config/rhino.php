<?php

return [
    'models' => [
        'organizations' => \App\Models\Organization::class,
        'roles' => \App\Models\Role::class,
        'comments' => \App\Models\Comment::class,
        'labels' => \App\Models\Label::class,
        'projects' => \App\Models\Project::class,
        'tasks' => \App\Models\Task::class,
    ],
    'route_groups' => [
        'tenant' => [
            'prefix' => '{organization}',
            'middleware' => [\Rhino\Http\Middleware\ResolveOrganizationFromRoute::class],
            'models' => '*',
        ],
        // Back office. It has NO tenant boundary: its operators are meant to see
        // every organization's rows, so 'tenant' => false tells Rhino::query()
        // not to require an organization there (and not to throw). The tenant
        // group above is untouched and keeps failing closed.
        //
        // 'models' => [] on purpose: this group exists to declare the boundary
        // for the CUSTOM admin route registered in routes/api.php, not to expose
        // a second, unscoped copy of the CRUD API. A real back office would list
        // the models it wants to administer across tenants.
        'admin' => [
            'prefix' => 'admin',
            'tenant' => false,
            'middleware' => [],
            'models' => [],
        ],
    ],
    // Group-membership enforcement stays OFF in this multitenant-only variant:
    // behavior is byte-for-byte the current example. The user_roles.route_group
    // column exists (additive migration) to match the canonical group-auth schema.
    'auth' => [
        'enforce_group_membership' => false,
    ],
    'multi_tenant' => [
        'organization_identifier_column' => 'slug',
    ],
    'invitations' => [
        'expires_days' => env('INVITATION_EXPIRES_DAYS', 7),
        'allowed_roles' => null,
    ],
    'nested' => [
        'path' => 'nested',
        'max_operations' => 50,
        'allowed_models' => null,
    ],
    'client_path' => env('RHINO_CLIENT_PATH'),
    'mobile_path' => env('RHINO_MOBILE_PATH'),
    'test_framework' => 'pest',
    'postman' => [
        'role_class' => 'App\Models\Role',
        'user_role_class' => 'App\Models\UserRole',
        'user_class' => 'App\Models\User',
    ],
];
