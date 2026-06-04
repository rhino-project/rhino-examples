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
    $this->project = Project::factory()->create(['organization_id' => $this->org->id]);
});

// ---------------------------------------------------------------
// Admin CRUD
// ---------------------------------------------------------------

it('admin can create a task', function () {
    $user = Tests\createUserInOrg('admin', $this->org);

    $response = $this->actingAs($user)
        ->postJson('/api/' . $this->org->slug . '/tasks', [
            'title' => 'New Task',
            'description' => 'Do something important',
            'status' => 'todo',
            'priority' => 'high',
            'estimated_hours' => 8.0,
            'project_id' => $this->project->id,
        ]);

    $response->assertStatus(201);
    expect($response->json('title'))->toBe('New Task');
});

it('admin can list tasks', function () {
    $user = Tests\createUserInOrg('admin', $this->org);
    Task::factory()->create(['project_id' => $this->project->id]);

    $response = $this->actingAs($user)
        ->getJson('/api/' . $this->org->slug . '/tasks');

    $response->assertStatus(200);
});

it('admin can update a task', function () {
    $user = Tests\createUserInOrg('admin', $this->org);
    $task = Task::factory()->create(['project_id' => $this->project->id]);

    $response = $this->actingAs($user)
        ->putJson('/api/' . $this->org->slug . '/tasks/' . $task->id, [
            'title' => 'Updated Task',
            'status' => $task->status,
            'priority' => $task->priority,
            'project_id' => $this->project->id,
        ]);

    $response->assertStatus(200);
    expect($response->json('title'))->toBe('Updated Task');
});

it('admin can delete a task', function () {
    $user = Tests\createUserInOrg('admin', $this->org);
    $task = Task::factory()->create(['project_id' => $this->project->id]);

    $response = $this->actingAs($user)
        ->deleteJson('/api/' . $this->org->slug . '/tasks/' . $task->id);

    $response->assertStatus(204);
});

// ---------------------------------------------------------------
// TaskScope — member sees only assigned tasks
// ---------------------------------------------------------------

it('member only sees tasks assigned to them', function () {
    $member = Tests\createUserInOrg('member', $this->org, [
        'tasks.index', 'tasks.show', 'tasks.update',
    ]);

    // Task assigned to member
    Task::factory()->create([
        'project_id' => $this->project->id,
        'assignee_id' => $member->id,
        'title' => 'My Task',
    ]);

    // Task assigned to someone else
    Task::factory()->create([
        'project_id' => $this->project->id,
        'assignee_id' => null,
        'title' => 'Other Task',
    ]);

    $response = $this->actingAs($member)
        ->getJson('/api/' . $this->org->slug . '/tasks');

    $response->assertStatus(200);
    // Response may be wrapped in { "data": [...] } or flat array
    $tasks = $response->json('data') ?? $response->json();

    // TaskScope filters to only assigned tasks for members
    $taskTitles = array_column($tasks, 'title');
    expect($taskTitles)->toContain('My Task');
    expect($taskTitles)->not->toContain('Other Task');
});

// ---------------------------------------------------------------
// Hidden columns — estimated_hours hidden from member/viewer
// ---------------------------------------------------------------

it('admin sees estimated_hours', function () {
    $user = Tests\createUserInOrg('admin', $this->org);
    $task = Task::factory()->create([
        'project_id' => $this->project->id,
        'estimated_hours' => 16.0,
    ]);

    $response = $this->actingAs($user)
        ->getJson('/api/' . $this->org->slug . '/tasks/' . $task->id);

    $response->assertStatus(200);
    expect($response->json())->toHaveKey('estimated_hours');
});

it('member cannot see estimated_hours', function () {
    $member = Tests\createUserInOrg('member', $this->org, [
        'tasks.index', 'tasks.show', 'tasks.update',
    ]);

    $task = Task::factory()->create([
        'project_id' => $this->project->id,
        'assignee_id' => $member->id,
        'estimated_hours' => 16.0,
    ]);

    $response = $this->actingAs($member)
        ->getJson('/api/' . $this->org->slug . '/tasks/' . $task->id);

    $response->assertStatus(200);
    expect($response->json())->not->toHaveKey('estimated_hours');
});

// ---------------------------------------------------------------
// Member can only update status and description
// ---------------------------------------------------------------

it('member can update task status and description', function () {
    $member = Tests\createUserInOrg('member', $this->org, [
        'tasks.index', 'tasks.show', 'tasks.update',
    ]);

    $task = Task::factory()->create([
        'project_id' => $this->project->id,
        'assignee_id' => $member->id,
        'status' => 'todo',
        'description' => 'Old description',
    ]);

    $response = $this->actingAs($member)
        ->putJson('/api/' . $this->org->slug . '/tasks/' . $task->id, [
            'status' => 'in_progress',
            'description' => 'Updated description',
        ]);

    $response->assertStatus(200);
    expect($response->json('status'))->toBe('in_progress');
    expect($response->json('description'))->toBe('Updated description');
});

it('member cannot update task title (forbidden field)', function () {
    $member = Tests\createUserInOrg('member', $this->org, [
        'tasks.index', 'tasks.show', 'tasks.update',
    ]);

    $task = Task::factory()->create([
        'project_id' => $this->project->id,
        'assignee_id' => $member->id,
    ]);

    $response = $this->actingAs($member)
        ->putJson('/api/' . $this->org->slug . '/tasks/' . $task->id, [
            'title' => 'Should Not Change',
        ]);

    $response->assertStatus(403);
});

// ---------------------------------------------------------------
// Member cannot create tasks
// ---------------------------------------------------------------

it('member cannot create a task', function () {
    $member = Tests\createUserInOrg('member', $this->org, [
        'tasks.index', 'tasks.show', 'tasks.update',
    ]);

    $response = $this->actingAs($member)
        ->postJson('/api/' . $this->org->slug . '/tasks', [
            'title' => 'Should Fail',
            'project_id' => $this->project->id,
        ]);

    $response->assertStatus(403);
});

// ---------------------------------------------------------------
// Viewer cannot update or delete
// ---------------------------------------------------------------

it('viewer cannot update a task', function () {
    $viewer = Tests\createUserInOrg('viewer', $this->org, [
        'tasks.index', 'tasks.show',
    ]);

    $task = Task::factory()->create([
        'project_id' => $this->project->id,
        'assignee_id' => $viewer->id,
    ]);

    $response = $this->actingAs($viewer)
        ->putJson('/api/' . $this->org->slug . '/tasks/' . $task->id, [
            'status' => 'done',
        ]);

    $response->assertStatus(403);
});
