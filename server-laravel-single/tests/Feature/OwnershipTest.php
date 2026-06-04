<?php

use App\Models\Label;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * Single-tenant smoke tests: user-owned projects + shared global Label catalog.
 */

it('scopes projects to the authenticated owner', function () {
    $alice = User::factory()->create();
    $bob = User::factory()->create();

    Project::factory()->create(['user_id' => $alice->id, 'title' => 'Alice P']);
    Project::factory()->create(['user_id' => $bob->id, 'title' => 'Bob P']);

    $response = $this->actingAs($alice, 'sanctum')->getJson('/api/projects');

    $response->assertStatus(200);
    expect($response->json('data'))->toHaveCount(1);
    expect($response->json('data.0.title'))->toBe('Alice P');
});

it('returns 404 when a user requests another user\'s project', function () {
    $alice = User::factory()->create();
    $bob = User::factory()->create();
    $bobProject = Project::factory()->create(['user_id' => $bob->id]);

    $this->actingAs($alice, 'sanctum')
        ->getJson('/api/projects/' . $bobProject->id)
        ->assertStatus(404);
});

it('auto-stamps user_id from the authenticated user on create', function () {
    $alice = User::factory()->create();

    $response = $this->actingAs($alice, 'sanctum')->postJson('/api/projects', [
        'title' => 'Fresh Project',
        'status' => 'draft',
    ]);

    $response->assertStatus(201);
    expect($response->json('user_id'))->toBe($alice->id);
});

it('shares the global Label catalog across users', function () {
    $alice = User::factory()->create();
    $bob = User::factory()->create();
    Label::create(['name' => 'bug', 'color' => '#e11d48']);
    Label::create(['name' => 'feature', 'color' => '#2563eb']);

    $aliceLabels = $this->actingAs($alice, 'sanctum')->getJson('/api/labels')->json('data');
    $bobLabels = $this->actingAs($bob, 'sanctum')->getJson('/api/labels')->json('data');

    expect($aliceLabels)->toHaveCount(2);
    expect($bobLabels)->toHaveCount(2);
});
