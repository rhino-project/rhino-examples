<?php

use App\Models\Organization;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

require_once __DIR__ . '/../Helpers.php';

beforeEach(function () {
    Tests\seedRoles();
    $this->org = Organization::factory()->create();
});

it('admin can create multiple resources in a single nested request', function () {
    $user = Tests\createUserInOrg('admin', $this->org);
    $project = Project::factory()->create(['organization_id' => $this->org->id]);

    $response = $this->actingAs($user)
        ->postJson('/api/' . $this->org->slug . '/nested', [
            'operations' => [
                [
                    'model' => 'tasks',
                    'action' => 'create',
                    'data' => [
                        'title' => 'Nested Task 1',
                        'status' => 'todo',
                        'priority' => 'high',
                        'project_id' => $project->id,
                    ],
                ],
                [
                    'model' => 'tasks',
                    'action' => 'create',
                    'data' => [
                        'title' => 'Nested Task 2',
                        'status' => 'todo',
                        'priority' => 'low',
                        'project_id' => $project->id,
                    ],
                ],
            ],
        ]);

    $response->assertStatus(200);

    $results = $response->json('results');
    expect($results)->toHaveCount(2);
    expect($results[0]['data']['title'])->toBe('Nested Task 1');
    expect($results[1]['data']['title'])->toBe('Nested Task 2');
});

it('nested operation is atomic - rolls back on failure', function () {
    $user = Tests\createUserInOrg('admin', $this->org);
    $project = Project::factory()->create(['organization_id' => $this->org->id]);

    $taskCountBefore = Task::count();

    $response = $this->actingAs($user)
        ->postJson('/api/' . $this->org->slug . '/nested', [
            'operations' => [
                [
                    'model' => 'tasks',
                    'action' => 'create',
                    'data' => [
                        'title' => 'Will Be Rolled Back',
                        'status' => 'todo',
                        'priority' => 'medium',
                        'project_id' => $project->id,
                    ],
                ],
                [
                    'model' => 'tasks',
                    'action' => 'create',
                    'data' => [
                        // Missing required 'title' — should cause validation failure
                        'status' => 'todo',
                        'priority' => 'medium',
                        'project_id' => $project->id,
                    ],
                ],
            ],
        ]);

    // Should fail with validation error
    $response->assertStatus(422);

    // First task should NOT have been created (transaction rolled back)
    expect(Task::count())->toBe($taskCountBefore);
});

it('nested create and update in single transaction', function () {
    $user = Tests\createUserInOrg('admin', $this->org);
    $project = Project::factory()->create(['organization_id' => $this->org->id]);
    $existingTask = Task::factory()->create([
        'project_id' => $project->id,
        'title' => 'Original Title',
        'status' => 'todo',
        'priority' => 'medium',
    ]);

    $response = $this->actingAs($user)
        ->postJson('/api/' . $this->org->slug . '/nested', [
            'operations' => [
                [
                    'model' => 'tasks',
                    'action' => 'create',
                    'data' => [
                        'title' => 'New Task',
                        'status' => 'todo',
                        'priority' => 'high',
                        'project_id' => $project->id,
                    ],
                ],
                [
                    'model' => 'tasks',
                    'action' => 'update',
                    'id' => $existingTask->id,
                    'data' => [
                        'title' => 'Updated Title',
                        'status' => 'in_progress',
                        'priority' => 'high',
                        'project_id' => $project->id,
                    ],
                ],
            ],
        ]);

    $response->assertStatus(200);

    $results = $response->json('results');
    expect($results)->toHaveCount(2);
    expect($results[0]['action'])->toBe('create');
    expect($results[1]['action'])->toBe('update');

    $existingTask->refresh();
    expect($existingTask->title)->toBe('Updated Title');
    expect($existingTask->status)->toBe('in_progress');
});
