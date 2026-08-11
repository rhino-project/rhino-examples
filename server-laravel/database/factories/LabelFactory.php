<?php

namespace Database\Factories;

use App\Models\Label;
use Illuminate\Database\Eloquent\Factories\Factory;

class LabelFactory extends Factory
{
    protected $model = Label::class;

    public function definition(): array
    {
        $name = fake()->unique()->name();

        return [
            'organization_id' => \App\Models\Organization::factory(),
            'name' => $name,
            // Route Key feature: kebab-case slug used in URLs.
            'slug' => \Illuminate\Support\Str::slug($name),
            'color' => fake()->optional()->sentence(3),
        ];
    }
}
