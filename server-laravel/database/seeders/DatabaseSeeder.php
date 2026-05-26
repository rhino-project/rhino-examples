<?php

namespace Database\Seeders;

use App\Models\Comment;
use App\Models\Label;
use App\Models\Organization;
use App\Models\Project;
use App\Models\Role;
use App\Models\Task;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // ---------------------------------------------------------------
        // 1. Roles
        // ---------------------------------------------------------------
        $roles = [];
        foreach (['owner', 'admin', 'manager', 'member', 'viewer'] as $slug) {
            $roles[$slug] = Role::firstOrCreate(
                ['slug' => $slug],
                [
                    'name' => ucfirst($slug),
                    'description' => ucfirst($slug) . ' role',
                ]
            );
        }

        // ---------------------------------------------------------------
        // 2. Organizations
        // ---------------------------------------------------------------
        $acme = Organization::firstOrCreate(
            ['slug' => 'acme-corp'],
            [
                'name' => 'Acme Corp',
                'description' => 'A leading provider of everything.',
                'is_active' => true,
            ]
        );

        $globex = Organization::firstOrCreate(
            ['slug' => 'globex-inc'],
            [
                'name' => 'Globex Inc',
                'description' => 'Global excellence in innovation.',
                'is_active' => true,
            ]
        );

        // ---------------------------------------------------------------
        // 3. Users
        // ---------------------------------------------------------------
        $alice = User::firstOrCreate(
            ['email' => 'alice@acme.com'],
            ['name' => 'Alice Johnson', 'password' => Hash::make('password')]
        );

        $bob = User::firstOrCreate(
            ['email' => 'bob@acme.com'],
            ['name' => 'Bob Smith', 'password' => Hash::make('password')]
        );

        $carol = User::firstOrCreate(
            ['email' => 'carol@acme.com'],
            ['name' => 'Carol Williams', 'password' => Hash::make('password')]
        );

        $dave = User::firstOrCreate(
            ['email' => 'dave@acme.com'],
            ['name' => 'Dave Brown', 'password' => Hash::make('password')]
        );

        $eve = User::firstOrCreate(
            ['email' => 'eve@globex.com'],
            ['name' => 'Eve Davis', 'password' => Hash::make('password')]
        );

        // ---------------------------------------------------------------
        // 4. User-Role Assignments
        // ---------------------------------------------------------------
        // All Acme permissions
        $acmePermissions = [
            'projects.*', 'tasks.*', 'comments.*', 'labels.*',
        ];

        // Alice = admin @ Acme
        UserRole::firstOrCreate(
            ['user_id' => $alice->id, 'role_id' => $roles['admin']->id, 'organization_id' => $acme->id],
            ['permissions' => ['*']]
        );

        // Bob = manager @ Acme
        UserRole::firstOrCreate(
            ['user_id' => $bob->id, 'role_id' => $roles['manager']->id, 'organization_id' => $acme->id],
            ['permissions' => [
                'projects.index', 'projects.show', 'projects.store', 'projects.update',
                'tasks.index', 'tasks.show', 'tasks.store', 'tasks.update',
                'comments.index', 'comments.show', 'comments.store', 'comments.update', 'comments.destroy',
                'labels.index', 'labels.show', 'labels.store', 'labels.update',
            ]]
        );

        // Carol = member @ Acme
        UserRole::firstOrCreate(
            ['user_id' => $carol->id, 'role_id' => $roles['member']->id, 'organization_id' => $acme->id],
            ['permissions' => [
                'projects.index', 'projects.show',
                'tasks.index', 'tasks.show', 'tasks.update',
                'comments.index', 'comments.show', 'comments.store', 'comments.update',
                'labels.index', 'labels.show',
            ]]
        );

        // Dave = viewer @ Acme
        UserRole::firstOrCreate(
            ['user_id' => $dave->id, 'role_id' => $roles['viewer']->id, 'organization_id' => $acme->id],
            ['permissions' => [
                'projects.index', 'projects.show',
                'tasks.index', 'tasks.show',
                'comments.index', 'comments.show',
                'labels.index', 'labels.show',
            ]]
        );

        // Eve = admin @ Globex
        UserRole::firstOrCreate(
            ['user_id' => $eve->id, 'role_id' => $roles['admin']->id, 'organization_id' => $globex->id],
            ['permissions' => ['*']]
        );

        // ---------------------------------------------------------------
        // 5. Projects
        // ---------------------------------------------------------------
        $websiteRedesign = Project::firstOrCreate(
            ['title' => 'Website Redesign', 'organization_id' => $acme->id],
            [
                'description' => 'Complete overhaul of the company website with modern design.',
                'status' => 'active',
                'budget' => 50000.00,
                'internal_notes' => 'Priority project for Q2. CEO is personally involved.',
                'starts_at' => '2026-01-15',
                'ends_at' => '2026-06-30',
            ]
        );

        $mobileApp = Project::firstOrCreate(
            ['title' => 'Mobile App MVP', 'organization_id' => $acme->id],
            [
                'description' => 'Build the first version of our mobile application.',
                'status' => 'draft',
                'budget' => 120000.00,
                'internal_notes' => 'Awaiting final approval from the board.',
                'starts_at' => '2026-04-01',
                'ends_at' => '2026-12-31',
            ]
        );

        $apiIntegration = Project::firstOrCreate(
            ['title' => 'API Integration', 'organization_id' => $acme->id],
            [
                'description' => 'Integrate with third-party payment and shipping APIs.',
                'status' => 'active',
                'budget' => 30000.00,
                'internal_notes' => null,
                'starts_at' => '2026-02-01',
                'ends_at' => '2026-05-15',
            ]
        );

        // ---------------------------------------------------------------
        // 6. Tasks
        // ---------------------------------------------------------------
        $task1 = Task::firstOrCreate(
            ['title' => 'Design homepage mockup', 'project_id' => $websiteRedesign->id],
            [
                'description' => 'Create high-fidelity mockup for the new homepage.',
                'status' => 'in_progress',
                'priority' => 'high',
                'estimated_hours' => 16.00,
                'due_date' => '2026-02-28',
                'assignee_id' => $carol->id,
            ]
        );

        $task2 = Task::firstOrCreate(
            ['title' => 'Set up CI/CD pipeline', 'project_id' => $websiteRedesign->id],
            [
                'description' => 'Configure GitHub Actions for automated testing and deployment.',
                'status' => 'todo',
                'priority' => 'medium',
                'estimated_hours' => 8.00,
                'due_date' => '2026-03-15',
                'assignee_id' => $bob->id,
            ]
        );

        $task3 = Task::firstOrCreate(
            ['title' => 'Research payment gateways', 'project_id' => $apiIntegration->id],
            [
                'description' => 'Evaluate Stripe, PayPal, and local payment options.',
                'status' => 'done',
                'priority' => 'high',
                'estimated_hours' => 4.00,
                'due_date' => '2026-02-15',
                'assignee_id' => $alice->id,
            ]
        );

        $task4 = Task::firstOrCreate(
            ['title' => 'Write user stories', 'project_id' => $mobileApp->id],
            [
                'description' => 'Document all user stories for the mobile app MVP scope.',
                'status' => 'todo',
                'priority' => 'low',
                'estimated_hours' => 12.00,
                'due_date' => '2026-04-30',
                'assignee_id' => $bob->id,
            ]
        );

        // ---------------------------------------------------------------
        // 7. Labels
        // ---------------------------------------------------------------
        $labelBug = Label::firstOrCreate(
            ['name' => 'bug', 'organization_id' => $acme->id],
            ['color' => '#e11d48']
        );

        $labelFeature = Label::firstOrCreate(
            ['name' => 'feature', 'organization_id' => $acme->id],
            ['color' => '#2563eb']
        );

        $labelUrgent = Label::firstOrCreate(
            ['name' => 'urgent', 'organization_id' => $acme->id],
            ['color' => '#f59e0b']
        );

        $labelDocs = Label::firstOrCreate(
            ['name' => 'documentation', 'organization_id' => $acme->id],
            ['color' => '#10b981']
        );

        // Attach labels to tasks
        $task1->labels()->syncWithoutDetaching([$labelFeature->id]);
        $task2->labels()->syncWithoutDetaching([$labelFeature->id, $labelUrgent->id]);
        $task3->labels()->syncWithoutDetaching([$labelDocs->id]);

        // ---------------------------------------------------------------
        // 8. Comments
        // ---------------------------------------------------------------
        Comment::firstOrCreate(
            ['body' => 'Looking great so far! Let me know when the first draft is ready.', 'task_id' => $task1->id, 'user_id' => $alice->id],
        );

        Comment::firstOrCreate(
            ['body' => 'I will have the mockup ready by Friday.', 'task_id' => $task1->id, 'user_id' => $carol->id],
        );

        Comment::firstOrCreate(
            ['body' => 'Stripe seems like the best option for our use case.', 'task_id' => $task3->id, 'user_id' => $alice->id],
        );
    }
}
