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
 * Single-tenant seeder (richer dataset).
 *
 * Two plain users, each owning a handful of projects with multiple tasks and
 * comments — enough to populate the dashboard, lists, filters, and trash. A
 * shared GLOBAL Label catalog (no owner) is visible to both users.
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
            ['name' => 'bug',           'color' => '#e11d48'],
            ['name' => 'feature',       'color' => '#2563eb'],
            ['name' => 'urgent',        'color' => '#f59e0b'],
            ['name' => 'documentation', 'color' => '#10b981'],
            ['name' => 'enhancement',   'color' => '#8b5cf6'],
            ['name' => 'design',        'color' => '#ec4899'],
            ['name' => 'backend',       'color' => '#0ea5e9'],
            ['name' => 'frontend',      'color' => '#22c55e'],
            ['name' => 'testing',       'color' => '#eab308'],
            ['name' => 'devops',        'color' => '#64748b'],
        ] as $l) {
            $labels[] = Label::create($l);
        }

        $projectStatuses = ['active', 'draft', 'completed', 'on_hold'];
        $taskStatuses    = ['todo', 'in_progress', 'in_review', 'done'];
        $priorities      = ['low', 'medium', 'high', 'urgent'];

        // ---------------------------------------------------------------
        // Users, each owning their own projects/tasks/comments.
        // ---------------------------------------------------------------
        $users = [
            ['email' => 'alice@example.com', 'name' => 'Alice Johnson', 'projects' => 6],
            ['email' => 'bob@example.com',   'name' => 'Bob Smith',     'projects' => 5],
        ];

        foreach ($users as $u) {
            $user = User::create([
                'email'    => $u['email'],
                'name'     => $u['name'],
                'password' => Hash::make('password'),
            ]);

            for ($p = 1; $p <= $u['projects']; $p++) {
                $project = Project::create([
                    'user_id'        => $user->id,
                    'title'          => "{$user->name}: Project {$p}",
                    'description'    => "Demo project {$p} owned by {$user->name}.",
                    'status'         => $projectStatuses[($p - 1) % count($projectStatuses)],
                    'budget'         => 1000 * $p + ($user->id * 250),
                    'internal_notes' => "Private notes for {$user->name}'s project {$p}.",
                    'starts_at'      => sprintf('2026-%02d-01', (($p - 1) % 12) + 1),
                    'ends_at'        => sprintf('2026-%02d-28', (($p + 3) % 12) + 1),
                ]);

                $taskCount = 3 + ($p % 3); // 3..5 tasks per project
                for ($t = 1; $t <= $taskCount; $t++) {
                    $task = Task::create([
                        'project_id'      => $project->id,
                        'title'           => "P{$p} · Task {$t}",
                        'description'     => "Work item {$t} for project {$p}.",
                        'status'          => $taskStatuses[($t - 1) % count($taskStatuses)],
                        'priority'        => $priorities[($t + $p) % count($priorities)],
                        'estimated_hours' => $t * 2.5,
                        'due_date'        => sprintf('2026-%02d-15', (($p + $t) % 12) + 1),
                        'assignee_id'     => $user->id,
                    ]);

                    $task->labels()->syncWithoutDetaching([
                        $labels[($p + $t) % count($labels)]->id,
                        $labels[($t * 2) % count($labels)]->id,
                    ]);

                    Comment::create([
                        'body'    => "Kicking off P{$p}·T{$t}.",
                        'task_id' => $task->id,
                        'user_id' => $user->id,
                    ]);
                    if ($t % 2 === 0) {
                        Comment::create([
                            'body'    => "Update on P{$p}·T{$t}: progressing.",
                            'task_id' => $task->id,
                            'user_id' => $user->id,
                        ]);
                    }
                }
            }

            // Soft-delete the most recent project so the Trash page has content.
            Project::where('user_id', $user->id)->latest('id')->first()?->delete();
        }
    }
}
