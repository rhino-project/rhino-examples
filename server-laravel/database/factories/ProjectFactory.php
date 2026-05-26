<?php

namespace Database\Factories;

use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProjectFactory extends Factory
{
    protected $model = Project::class;

    public function definition(): array
    {
        return [
            'organization_id' => \App\Models\Organization::factory(),
            'title' => fake()->sentence(3),
            'description' => fake()->optional()->paragraph(),
            'status' => fake()->sentence(3),
            'budget' => fake()->optional()->randomFloat(2, 0, 1000),
            'internal_notes' => fake()->optional()->paragraph(),
            'starts_at' => fake()->optional()->date(),
            'ends_at' => fake()->optional()->date(),
        ];
    }
}
