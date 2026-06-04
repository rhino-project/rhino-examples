<?php

use App\Models\Organization;
use App\Models\Project;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

require_once __DIR__ . '/../Helpers.php';

beforeEach(function () {
    Tests\seedRoles();
    $this->org = Organization::factory()->create();
});

it('admin can view trashed projects', function () {
    $user = Tests\createUserInOrg('admin', $this->org);
    $project = Project::factory()->create(['organization_id' => $this->org->id]);
    $project->delete();

    $response = $this->actingAs($user)
        ->getJson('/api/' . $this->org->slug . '/projects/trashed');

    $response->assertStatus(200);
    $items = $response->json();
    expect($items)->toHaveCount(1);
});

it('admin can restore a soft-deleted project', function () {
    $user = Tests\createUserInOrg('admin', $this->org);
    $project = Project::factory()->create(['organization_id' => $this->org->id]);
    $project->delete();

    $response = $this->actingAs($user)
        ->postJson('/api/' . $this->org->slug . '/projects/' . $project->id . '/restore');

    $response->assertStatus(200);
    expect(Project::find($project->id))->not->toBeNull();
});

it('admin can force-delete a project', function () {
    $user = Tests\createUserInOrg('admin', $this->org);
    $project = Project::factory()->create(['organization_id' => $this->org->id]);
    $project->delete();

    $response = $this->actingAs($user)
        ->deleteJson('/api/' . $this->org->slug . '/projects/' . $project->id . '/force-delete');

    $response->assertStatus(204);
    expect(Project::withTrashed()->find($project->id))->toBeNull();
});

it('viewer cannot restore a project', function () {
    $viewer = Tests\createUserInOrg('viewer', $this->org, [
        'projects.index', 'projects.show',
    ]);
    $project = Project::factory()->create(['organization_id' => $this->org->id]);
    $project->delete();

    $response = $this->actingAs($viewer)
        ->postJson('/api/' . $this->org->slug . '/projects/' . $project->id . '/restore');

    $response->assertStatus(403);
});
