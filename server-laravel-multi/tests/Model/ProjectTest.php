<?php

use App\Models\User;
use App\Models\Project;
use App\Models\Role;
use App\Models\Organization;
use App\Models\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// ---------------------------------------------------------------
// Helper: create a user with a specific role and permissions
// ---------------------------------------------------------------

function createUserWithRole(string $roleSlug, ?Organization $organization = null, array $permissions = []): User
{
    $user = User::factory()->create();
    $org = $organization ?? Organization::factory()->create();
    $role = Role::where('slug', $roleSlug)->firstOrFail();

    UserRole::create([
        'user_id' => $user->id,
        'role_id' => $role->id,
        'organization_id' => $org->id,
        'permissions' => $permissions,
    ]);

    return $user;
}

// ---------------------------------------------------------------
// Role-based CRUD access tests
// ---------------------------------------------------------------

it('allows owner permitted projects endpoints', function () {
    $org = Organization::factory()->create();
    $user = createUserWithRole('owner', $org, ['projects.*']);
    $model = Project::factory()->create();

    $this->actingAs($user);

    $this->getJson('/api/' . $org->id . '/projects')->assertStatus(200);
    $this->getJson('/api/' . $org->id . '/projects/' . $model->id)->assertStatus(200);
    // $this->postJson('/api/' . $org->id . '/projects', [...])->assertStatus(201);
    // $this->putJson('/api/' . $org->id . '/projects/' . $model->id, [...])->assertStatus(200);
    $this->deleteJson('/api/' . $org->id . '/projects/' . $model->id)->assertStatus(200);
});

it('allows admin permitted projects endpoints', function () {
    $org = Organization::factory()->create();
    $user = createUserWithRole('admin', $org, ['projects.index', 'projects.show', 'projects.store', 'projects.update', 'projects.destroy', 'projects.trashed', 'projects.restore']);
    $model = Project::factory()->create();

    $this->actingAs($user);

    $this->getJson('/api/' . $org->id . '/projects')->assertStatus(200);
    $this->getJson('/api/' . $org->id . '/projects/' . $model->id)->assertStatus(200);
    // $this->postJson('/api/' . $org->id . '/projects', [...])->assertStatus(201);
    // $this->putJson('/api/' . $org->id . '/projects/' . $model->id, [...])->assertStatus(200);
    $this->deleteJson('/api/' . $org->id . '/projects/' . $model->id)->assertStatus(200);
});

it('allows manager permitted projects endpoints', function () {
    $org = Organization::factory()->create();
    $user = createUserWithRole('manager', $org, ['projects.index', 'projects.show', 'projects.store', 'projects.update']);
    $model = Project::factory()->create();

    $this->actingAs($user);

    $this->getJson('/api/' . $org->id . '/projects')->assertStatus(200);
    $this->getJson('/api/' . $org->id . '/projects/' . $model->id)->assertStatus(200);
    // $this->postJson('/api/' . $org->id . '/projects', [...])->assertStatus(201);
    // $this->putJson('/api/' . $org->id . '/projects/' . $model->id, [...])->assertStatus(200);
});

it('blocks manager restricted projects endpoints', function () {
    $org = Organization::factory()->create();
    $user = createUserWithRole('manager', $org, ['projects.index', 'projects.show', 'projects.store', 'projects.update']);
    $model = Project::factory()->create();

    $this->actingAs($user);

    $this->deleteJson('/api/' . $org->id . '/projects/' . $model->id)->assertStatus(403);
});

it('allows member permitted projects endpoints', function () {
    $org = Organization::factory()->create();
    $user = createUserWithRole('member', $org, ['projects.index', 'projects.show']);
    $model = Project::factory()->create();

    $this->actingAs($user);

    $this->getJson('/api/' . $org->id . '/projects')->assertStatus(200);
    $this->getJson('/api/' . $org->id . '/projects/' . $model->id)->assertStatus(200);
});

it('blocks member restricted projects endpoints', function () {
    $org = Organization::factory()->create();
    $user = createUserWithRole('member', $org, ['projects.index', 'projects.show']);
    $model = Project::factory()->create();

    $this->actingAs($user);

    $this->postJson('/api/' . $org->id . '/projects', [])->assertStatus(403);
    $this->putJson('/api/' . $org->id . '/projects/' . $model->id, [])->assertStatus(403);
    $this->deleteJson('/api/' . $org->id . '/projects/' . $model->id)->assertStatus(403);
});

it('allows viewer permitted projects endpoints', function () {
    $org = Organization::factory()->create();
    $user = createUserWithRole('viewer', $org, ['projects.index', 'projects.show']);
    $model = Project::factory()->create();

    $this->actingAs($user);

    $this->getJson('/api/' . $org->id . '/projects')->assertStatus(200);
    $this->getJson('/api/' . $org->id . '/projects/' . $model->id)->assertStatus(200);
});

it('blocks viewer restricted projects endpoints', function () {
    $org = Organization::factory()->create();
    $user = createUserWithRole('viewer', $org, ['projects.index', 'projects.show']);
    $model = Project::factory()->create();

    $this->actingAs($user);

    $this->postJson('/api/' . $org->id . '/projects', [])->assertStatus(403);
    $this->putJson('/api/' . $org->id . '/projects/' . $model->id, [])->assertStatus(403);
    $this->deleteJson('/api/' . $org->id . '/projects/' . $model->id)->assertStatus(403);
});

// ---------------------------------------------------------------
// Field visibility tests
// ---------------------------------------------------------------

it('shows only permitted fields for manager on projects', function () {
    $org = Organization::factory()->create();
    $user = createUserWithRole('manager', $org, ['projects.index', 'projects.show', 'projects.store', 'projects.update']);
    $model = Project::factory()->create(['organization_id' => $org->id]);

    $this->actingAs($user);

    $response = $this->getJson('/api/' . $org->id . '/projects/' . $model->id);
    $response->assertStatus(200);

    $data = $response->json();

    // Should see these fields
    $this->assertArrayHasKey('id', $data);
    $this->assertArrayHasKey('title', $data);
    $this->assertArrayHasKey('description', $data);
    $this->assertArrayHasKey('status', $data);
    $this->assertArrayHasKey('budget', $data);
    // ... and 2 more permitted fields

    // Should NOT see these fields
    $this->assertArrayNotHasKey('internal_notes', $data);
});

it('shows only permitted fields for member on projects', function () {
    $org = Organization::factory()->create();
    $user = createUserWithRole('member', $org, ['projects.index', 'projects.show']);
    $model = Project::factory()->create(['organization_id' => $org->id]);

    $this->actingAs($user);

    $response = $this->getJson('/api/' . $org->id . '/projects/' . $model->id);
    $response->assertStatus(200);

    $data = $response->json();

    // Should see these fields
    $this->assertArrayHasKey('id', $data);
    $this->assertArrayHasKey('title', $data);
    $this->assertArrayHasKey('description', $data);
    $this->assertArrayHasKey('status', $data);
    $this->assertArrayHasKey('starts_at', $data);
    // ... and 1 more permitted fields

    // Should NOT see these fields
    $this->assertArrayNotHasKey('budget', $data);
    $this->assertArrayNotHasKey('internal_notes', $data);
});

it('shows only permitted fields for viewer on projects', function () {
    $org = Organization::factory()->create();
    $user = createUserWithRole('viewer', $org, ['projects.index', 'projects.show']);
    $model = Project::factory()->create(['organization_id' => $org->id]);

    $this->actingAs($user);

    $response = $this->getJson('/api/' . $org->id . '/projects/' . $model->id);
    $response->assertStatus(200);

    $data = $response->json();

    // Should see these fields
    $this->assertArrayHasKey('id', $data);
    $this->assertArrayHasKey('title', $data);
    $this->assertArrayHasKey('description', $data);
    $this->assertArrayHasKey('status', $data);
    $this->assertArrayHasKey('starts_at', $data);
    // ... and 1 more permitted fields

    // Should NOT see these fields
    $this->assertArrayNotHasKey('budget', $data);
    $this->assertArrayNotHasKey('internal_notes', $data);
});

// ---------------------------------------------------------------
// Forbidden field tests (403 on restricted fields)
// ---------------------------------------------------------------

it('returns 403 when manager tries to set restricted fields on projects create', function () {
    $org = Organization::factory()->create();
    $user = createUserWithRole('manager', $org, ['projects.index', 'projects.show', 'projects.store', 'projects.update']);

    $this->actingAs($user);

    $response = $this->postJson('/api/' . $org->id . '/projects', [
        'title' => 'test-value',
        'budget' => 'forbidden-value', // restricted for manager
    ]);

    $response->assertStatus(403);
});

