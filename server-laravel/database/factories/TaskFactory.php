<?php

namespace Database\Factories;

use App\Models\Task;
use Illuminate\Database\Eloquent\Factories\Factory;

class TaskFactory extends Factory
{
    protected $model = Task::class;

    public function definition(): array
    {
        return [
            // Route Key feature: short random hex identifier used in URLs.
            'hash_id' => bin2hex(random_bytes(6)),
            'title' => fake()->sentence(3),
            'description' => fake()->optional()->paragraph(),
            // Real enum values: the API constrains these to
            // in:todo,in_progress,done and in:low,medium,high.
            //
            // 'done' is deliberately excluded: Task::$defaultScope is 'active',
            // which filters it out of index responses, and TaskUpdateRequest
            // only lets an owner/admin reopen a finished task. A factory that
            // rolled 'done' would make unrelated tests flaky.
            'status' => fake()->randomElement(['todo', 'in_progress']),
            'priority' => fake()->randomElement(['low', 'medium', 'high']),
            'estimated_hours' => fake()->optional()->randomFloat(2, 0, 1000),
            'due_date' => fake()->optional()->date(),
            'project_id' => \App\Models\Project::factory(),
            'assignee_id' => \App\Models\User::factory(),
        ];
    }
}
