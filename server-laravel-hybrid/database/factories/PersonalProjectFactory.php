<?php

namespace Database\Factories;

use App\Models\PersonalProject;
use Illuminate\Database\Eloquent\Factories\Factory;

class PersonalProjectFactory extends Factory
{
    protected $model = PersonalProject::class;

    public function definition(): array
    {
        return [
            'user_id' => \App\Models\User::factory(),
            'title' => fake()->sentence(3),
            'description' => fake()->optional()->paragraph(),
            'status' => 'active',
        ];
    }
}
