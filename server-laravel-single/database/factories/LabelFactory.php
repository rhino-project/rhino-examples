<?php

namespace Database\Factories;

use App\Models\Label;
use Illuminate\Database\Eloquent\Factories\Factory;

class LabelFactory extends Factory
{
    protected $model = Label::class;

    public function definition(): array
    {
        return [
            // Labels are a shared global catalog — no owner.
            'name' => fake()->name(),
            'color' => fake()->optional()->sentence(3),
        ];
    }
}
