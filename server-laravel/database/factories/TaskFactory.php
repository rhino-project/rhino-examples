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
            'title' => fake()->sentence(3),
            'description' => fake()->optional()->paragraph(),
            'status' => fake()->sentence(3),
            'priority' => fake()->sentence(3),
            'estimated_hours' => fake()->optional()->randomFloat(2, 0, 1000),
            'due_date' => fake()->optional()->date(),
            'project_id' => \App\Models\Project::factory(),
            'assignee_id' => \App\Models\User::factory(),
        ];
    }
}
