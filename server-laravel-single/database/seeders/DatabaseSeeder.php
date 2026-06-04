<?php

namespace Database\Seeders;

use App\Models\Comment;
use App\Models\Label;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Single-tenant seeder.
 *
 * Two plain users, each owning their own projects/tasks/comments. A shared
 * global Label catalog (no owner) is visible to both users.
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ---------------------------------------------------------------
        // Shared GLOBAL label catalog (no owner — visible to everyone).
        // ---------------------------------------------------------------
        $labels = [];
        foreach ([
            ['name' => 'bug', 'color' => '#e11d48'],
            ['name' => 'feature', 'color' => '#2563eb'],
            ['name' => 'urgent', 'color' => '#f59e0b'],
            ['name' => 'documentation', 'color' => '#10b981'],
        ] as $l) {
            $labels[$l['name']] = Label::firstOrCreate(['name' => $l['name']], ['color' => $l['color']]);
        }

        // ---------------------------------------------------------------
        // User A — Alice, with her own projects/tasks/comments.
        // ---------------------------------------------------------------
        $alice = User::firstOrCreate(
            ['email' => 'alice@example.com'],
            ['name' => 'Alice Johnson', 'password' => Hash::make('password')]
        );

        $aliceProject = Project::firstOrCreate(
            ['title' => 'Alice Website Redesign', 'user_id' => $alice->id],
            [
                'description' => 'Personal portfolio website redesign.',
                'status' => 'active',
                'budget' => 5000.00,
                'internal_notes' => 'Alice private notes.',
                'starts_at' => '2026-01-15',
                'ends_at' => '2026-06-30',
            ]
        );

        $aliceTask = Task::firstOrCreate(
            ['title' => 'Design homepage', 'project_id' => $aliceProject->id],
            [
                'description' => 'High-fidelity homepage mockup.',
                'status' => 'in_progress',
                'priority' => 'high',
                'estimated_hours' => 16.00,
                'due_date' => '2026-02-28',
                'assignee_id' => $alice->id,
            ]
        );
        $aliceTask->labels()->syncWithoutDetaching([$labels['feature']->id, $labels['urgent']->id]);

        Comment::firstOrCreate(
            ['body' => 'Kicking off the redesign today.', 'task_id' => $aliceTask->id, 'user_id' => $alice->id]
        );

        // ---------------------------------------------------------------
        // User B — Bob, with his own projects/tasks/comments.
        // ---------------------------------------------------------------
        $bob = User::firstOrCreate(
            ['email' => 'bob@example.com'],
            ['name' => 'Bob Smith', 'password' => Hash::make('password')]
        );

        $bobProject = Project::firstOrCreate(
            ['title' => 'Bob Mobile App', 'user_id' => $bob->id],
            [
                'description' => 'Side-project mobile app MVP.',
                'status' => 'draft',
                'budget' => 12000.00,
                'internal_notes' => 'Bob private notes.',
                'starts_at' => '2026-04-01',
                'ends_at' => '2026-12-31',
            ]
        );

        $bobTask = Task::firstOrCreate(
            ['title' => 'Write user stories', 'project_id' => $bobProject->id],
            [
                'description' => 'Document MVP scope.',
                'status' => 'todo',
                'priority' => 'low',
                'estimated_hours' => 12.00,
                'due_date' => '2026-04-30',
                'assignee_id' => $bob->id,
            ]
        );
        $bobTask->labels()->syncWithoutDetaching([$labels['documentation']->id]);

        Comment::firstOrCreate(
            ['body' => 'Drafting the first set of stories.', 'task_id' => $bobTask->id, 'user_id' => $bob->id]
        );
    }
}
