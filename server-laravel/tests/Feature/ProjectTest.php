<?php

use App\Models\Organization;
use App\Models\Project;
use App\Models\Role;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

require_once __DIR__ . '/../Helpers.php';

beforeEach(function () {
    Tests\seedRoles();
    $this->org = Organization::factory()->create();
});

// ---------------------------------------------------------------
// Admin CRUD
// ---------------------------------------------------------------

it('admin can list projects', function () {
    $user = Tests\createUserInOrg('admin', $this->org);
    Project::factory()->create(['organization_id' => $this->org->id]);

    $response = $this->actingAs($user)
        ->getJson('/api/' . $this->org->slug . '/projects');

    $response->assertStatus(200);
    expect($response->json())->toBeArray()->toHaveCount(1);
});

it('admin can create a project', function () {
    $user = Tests\createUserInOrg('admin', $this->org);

    $response = $this->actingAs($user)
        ->postJson('/api/' . $this->org->slug . '/projects', [
            'title' => 'New Project',
            'description' => 'A test project',
            'status' => 'draft',
            'budget' => 10000.00,
            'internal_notes' => 'Secret notes',
            'starts_at' => '2026-01-01',
            'ends_at' => '2026-12-31',
        ]);

    $response->assertStatus(201);
    expect($response->json('title'))->toBe('New Project');
    expect($response->json('organization_id'))->toBe($this->org->id);
});

it('admin can update a project', function () {
    $user = Tests\createUserInOrg('admin', $this->org);
    $project = Project::factory()->create(['organization_id' => $this->org->id]);

    $response = $this->actingAs($user)
        ->putJson('/api/' . $this->org->slug . '/projects/' . $project->id, [
            'title' => 'Updated Title',
            'status' => $project->status,
        ]);

    $response->assertStatus(200);
    expect($response->json('title'))->toBe('Updated Title');
});

it('admin can delete a project', function () {
    $user = Tests\createUserInOrg('admin', $this->org);
    $project = Project::factory()->create(['organization_id' => $this->org->id]);

    $response = $this->actingAs($user)
        ->deleteJson('/api/' . $this->org->slug . '/projects/' . $project->id);

    $response->assertStatus(204);
    expect(Project::find($project->id))->toBeNull();
    expect(Project::withTrashed()->find($project->id))->not->toBeNull();
});

// ---------------------------------------------------------------
// Hidden columns
// ---------------------------------------------------------------

it('admin sees all fields including budget and internal_notes', function () {
    $user = Tests\createUserInOrg('admin', $this->org);
    $project = Project::factory()->create([
        'organization_id' => $this->org->id,
        'budget' => 50000,
        'internal_notes' => 'Top secret',
    ]);

    $response = $this->actingAs($user)
        ->getJson('/api/' . $this->org->slug . '/projects/' . $project->id);

    $response->assertStatus(200);
    $data = $response->json();
    expect($data)->toHaveKey('budget');
    expect($data)->toHaveKey('internal_notes');
});

it('member cannot see budget or internal_notes', function () {
    $user = Tests\createUserInOrg('member', $this->org, [
        'projects.index', 'projects.show',
    ]);
    $project = Project::factory()->create([
        'organization_id' => $this->org->id,
        'budget' => 50000,
        'internal_notes' => 'Top secret',
    ]);

    $response = $this->actingAs($user)
        ->getJson('/api/' . $this->org->slug . '/projects/' . $project->id);

    $response->assertStatus(200);
    $data = $response->json();
    expect($data)->not->toHaveKey('budget');
    expect($data)->not->toHaveKey('internal_notes');
    expect($data)->toHaveKey('title');
});

it('viewer cannot see budget or internal_notes', function () {
    $user = Tests\createUserInOrg('viewer', $this->org, [
        'projects.index', 'projects.show',
    ]);
    $project = Project::factory()->create([
        'organization_id' => $this->org->id,
        'budget' => 50000,
        'internal_notes' => 'Top secret',
    ]);

    $response = $this->actingAs($user)
        ->getJson('/api/' . $this->org->slug . '/projects/' . $project->id);

    $response->assertStatus(200);
    $data = $response->json();
    expect($data)->not->toHaveKey('budget');
    expect($data)->not->toHaveKey('internal_notes');
});

// ---------------------------------------------------------------
// Role-keyed validation (forbidden fields)
// ---------------------------------------------------------------

it('manager cannot set budget when creating a project', function () {
    $user = Tests\createUserInOrg('manager', $this->org, [
        'projects.index', 'projects.show', 'projects.store', 'projects.update',
    ]);

    $response = $this->actingAs($user)
        ->postJson('/api/' . $this->org->slug . '/projects', [
            'title' => 'Manager Project',
            'status' => 'draft',
            'budget' => 99999,
        ]);

    $response->assertStatus(403);
});

// ---------------------------------------------------------------
// Member/viewer cannot create/update/delete
// ---------------------------------------------------------------

it('member cannot create a project', function () {
    $user = Tests\createUserInOrg('member', $this->org, [
        'projects.index', 'projects.show',
    ]);

    $response = $this->actingAs($user)
        ->postJson('/api/' . $this->org->slug . '/projects', [
            'title' => 'Should Fail',
        ]);

    $response->assertStatus(403);
});

it('viewer cannot delete a project', function () {
    $user = Tests\createUserInOrg('viewer', $this->org, [
        'projects.index', 'projects.show',
    ]);
    $project = Project::factory()->create(['organization_id' => $this->org->id]);

    $response = $this->actingAs($user)
        ->deleteJson('/api/' . $this->org->slug . '/projects/' . $project->id);

    $response->assertStatus(403);
});

// ---------------------------------------------------------------
// Cross-org isolation
// ---------------------------------------------------------------

it('cannot access projects from another organization', function () {
    $otherOrg = Organization::factory()->create();
    $user = Tests\createUserInOrg('admin', $this->org);

    $project = Project::factory()->create(['organization_id' => $otherOrg->id]);

    // User tries to access project from their org scope -- shouldn't find it
    $response = $this->actingAs($user)
        ->getJson('/api/' . $this->org->slug . '/projects/' . $project->id);

    $response->assertStatus(404);
});

it('cannot access another organization endpoint', function () {
    $otherOrg = Organization::factory()->create();
    $user = Tests\createUserInOrg('admin', $this->org);

    // User is not a member of otherOrg
    $response = $this->actingAs($user)
        ->getJson('/api/' . $otherOrg->id . '/projects');

    $response->assertStatus(404);
});
