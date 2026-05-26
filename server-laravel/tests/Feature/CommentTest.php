<?php

use App\Models\Comment;
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
    $this->task = Task::factory()->create(['project_id' => $this->project->id]);
});

// ---------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------

it('admin can create a comment', function () {
    $user = Tests\createUserInOrg('admin', $this->org);

    $response = $this->actingAs($user)
        ->postJson('/api/' . $this->org->slug . '/comments', [
            'body' => 'This is a comment',
            'task_id' => $this->task->id,
        ]);

    $response->assertStatus(201);
    expect($response->json('body'))->toBe('This is a comment');
});

it('auto-sets user_id on comment creation', function () {
    $user = Tests\createUserInOrg('admin', $this->org);

    $response = $this->actingAs($user)
        ->postJson('/api/' . $this->org->slug . '/comments', [
            'body' => 'Auto user id test',
            'task_id' => $this->task->id,
        ]);

    $response->assertStatus(201);
    expect($response->json('user_id'))->toBe($user->id);
});

it('comment has a uuid', function () {
    $user = Tests\createUserInOrg('admin', $this->org);

    $response = $this->actingAs($user)
        ->postJson('/api/' . $this->org->slug . '/comments', [
            'body' => 'UUID test',
            'task_id' => $this->task->id,
        ]);

    $response->assertStatus(201);

    $comment = Comment::find($response->json('id'));
    expect($comment->uuid)->not->toBeNull();
    // UUID format: 8-4-4-4-12 hex characters
    expect($comment->uuid)->toMatch('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/');
});

it('admin can list comments', function () {
    $user = Tests\createUserInOrg('admin', $this->org);
    Comment::factory()->create([
        'task_id' => $this->task->id,
        'user_id' => $user->id,
    ]);

    $response = $this->actingAs($user)
        ->getJson('/api/' . $this->org->slug . '/comments');

    $response->assertStatus(200);
});

it('member can create a comment', function () {
    $member = Tests\createUserInOrg('member', $this->org, [
        'comments.index', 'comments.show', 'comments.store', 'comments.update',
    ]);

    $response = $this->actingAs($member)
        ->postJson('/api/' . $this->org->slug . '/comments', [
            'body' => 'Member comment',
            'task_id' => $this->task->id,
        ]);

    $response->assertStatus(201);
});

it('viewer cannot create a comment', function () {
    $viewer = Tests\createUserInOrg('viewer', $this->org, [
        'comments.index', 'comments.show',
    ]);

    $response = $this->actingAs($viewer)
        ->postJson('/api/' . $this->org->slug . '/comments', [
            'body' => 'Should fail',
            'task_id' => $this->task->id,
        ]);

    $response->assertStatus(403);
});
