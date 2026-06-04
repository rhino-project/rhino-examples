<?php

return [
    // Single-tenant: NO organizations / roles / user_roles models at all.
    'models' => [
        'comments' => \App\Models\Comment::class,
        'labels' => \App\Models\Label::class,
        'projects' => \App\Models\Project::class,
        'tasks' => \App\Models\Task::class,
    ],

    // One route group: 'default'. Empty prefix, no domain, no org middleware.
    // Auth is the standard global /api/auth/* set. Ownership is enforced by the
    // per-model query scopes in app/Models/Scopes (user_id == auth id), so there
    // is no organization resolution here.
    'route_groups' => [
        'default' => [
            'prefix' => '',
            'middleware' => [],
            'models' => '*',
        ],
    ],

    // Membership enforcement is off (no groups/roles in this variant).
    'auth' => [
        'enforce_group_membership' => false,
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
];
