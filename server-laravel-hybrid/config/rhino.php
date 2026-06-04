<?php

return [
    'models' => [
        'organizations' => \App\Models\Organization::class,
        'roles' => \App\Models\Role::class,
        'comments' => \App\Models\Comment::class,
        'labels' => \App\Models\Label::class,
        'projects' => \App\Models\Project::class,
        'tasks' => \App\Models\Task::class,
        // User-owned model served ONLY by the personal group.
        'personal-projects' => \App\Models\PersonalProject::class,
    ],

    // Three coexisting route groups (GROUP_AUTH_DESIGN):
    //
    //  - personal: user-owned, no org, served at the apex host (no domain).
    //    Its own sign-in (auth: true). Only the user-owned PersonalProject model.
    //  - agency:   org-scoped multitenant on {organization}.agency.lvh.me, its
    //    OWN sign-in + lifecycle hooks, ResolveOrganizationFromRoute, membership.
    //  - vendor:   org-scoped multitenant on {organization}.vendor.lvh.me, a
    //    DIFFERENT sign-in + different hooks. A distinct membership from agency.
    //
    // agency and vendor share the same (empty) prefix but are disambiguated by
    // their distinct domains. personal's models are disjoint from the org models,
    // so no group silently shadows another (RouteGroupValidator passes).
    'route_groups' => [
        'personal' => [
            'prefix' => '',
            // Apex host. A distinguishing domain is REQUIRED here: with an empty
            // prefix AND no domain, this group's per-group auth route (carrying
            // route_group=personal) would have the exact same URI as the legacy
            // unprefixed /api/auth/* set and be shadowed by it, so the personal
            // route_group default would never apply and membership would 403.
            // Pinning the host to app.lvh.me makes the personal auth route win.
            'domain' => 'app.lvh.me',
            'auth' => true,
            'middleware' => [],
            'models' => ['personal-projects'],
        ],
        'agency' => [
            'prefix' => '',
            'domain' => '{organization}.agency.lvh.me',
            'auth' => true,
            'hooks' => \App\Auth\AgencyAuthHooks::class,
            'middleware' => [\Rhino\Http\Middleware\ResolveOrganizationFromRoute::class],
            'models' => ['organizations', 'roles', 'projects', 'tasks', 'comments', 'labels'],
        ],
        'vendor' => [
            'prefix' => '',
            'domain' => '{organization}.vendor.lvh.me',
            'auth' => true,
            'hooks' => \App\Auth\VendorAuthHooks::class,
            'middleware' => [\Rhino\Http\Middleware\ResolveOrganizationFromRoute::class],
            'models' => ['organizations', 'roles', 'projects', 'tasks', 'comments', 'labels'],
        ],
    ],

    // Membership enforcement ON: each group's users are isolated. An authenticated
    // user must hold a user_roles row matching the request's route_group (and, for
    // the tenant agency/vendor groups, the resolved organization) — else 403.
    'auth' => [
        'enforce_group_membership' => true,
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
