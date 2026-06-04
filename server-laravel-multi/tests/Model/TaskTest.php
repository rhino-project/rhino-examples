<?php

use App\Models\User;
use App\Models\Task;
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

it('allows owner permitted tasks endpoints', function () {
    $org = Organization::factory()->create();
    $user = createUserWithRole('owner', $org, ['tasks.*']);
    $model = Task::factory()->create();

    $this->actingAs($user);

    $this->getJson('/api/' . $org->id . '/tasks')->assertStatus(200);
    $this->getJson('/api/' . $org->id . '/tasks/' . $model->id)->assertStatus(200);
    // $this->postJson('/api/' . $org->id . '/tasks', [...])->assertStatus(201);
    // $this->putJson('/api/' . $org->id . '/tasks/' . $model->id, [...])->assertStatus(200);
    $this->deleteJson('/api/' . $org->id . '/tasks/' . $model->id)->assertStatus(200);
});

it('allows admin permitted tasks endpoints', function () {
    $org = Organization::factory()->create();
    $user = createUserWithRole('admin', $org, ['tasks.index', 'tasks.show', 'tasks.store', 'tasks.update', 'tasks.destroy', 'tasks.trashed', 'tasks.restore']);
    $model = Task::factory()->create();

    $this->actingAs($user);

    $this->getJson('/api/' . $org->id . '/tasks')->assertStatus(200);
    $this->getJson('/api/' . $org->id . '/tasks/' . $model->id)->assertStatus(200);
    // $this->postJson('/api/' . $org->id . '/tasks', [...])->assertStatus(201);
    // $this->putJson('/api/' . $org->id . '/tasks/' . $model->id, [...])->assertStatus(200);
    $this->deleteJson('/api/' . $org->id . '/tasks/' . $model->id)->assertStatus(200);
});

it('allows manager permitted tasks endpoints', function () {
    $org = Organization::factory()->create();
    $user = createUserWithRole('manager', $org, ['tasks.index', 'tasks.show', 'tasks.store', 'tasks.update']);
    $model = Task::factory()->create();

    $this->actingAs($user);

    $this->getJson('/api/' . $org->id . '/tasks')->assertStatus(200);
    $this->getJson('/api/' . $org->id . '/tasks/' . $model->id)->assertStatus(200);
    // $this->postJson('/api/' . $org->id . '/tasks', [...])->assertStatus(201);
    // $this->putJson('/api/' . $org->id . '/tasks/' . $model->id, [...])->assertStatus(200);
});

it('blocks manager restricted tasks endpoints', function () {
    $org = Organization::factory()->create();
    $user = createUserWithRole('manager', $org, ['tasks.index', 'tasks.show', 'tasks.store', 'tasks.update']);
    $model = Task::factory()->create();

    $this->actingAs($user);

    $this->deleteJson('/api/' . $org->id . '/tasks/' . $model->id)->assertStatus(403);
});

it('allows member permitted tasks endpoints', function () {
    $org = Organization::factory()->create();
    $user = createUserWithRole('member', $org, ['tasks.index', 'tasks.show', 'tasks.update']);
    $model = Task::factory()->create();

    $this->actingAs($user);

    $this->getJson('/api/' . $org->id . '/tasks')->assertStatus(200);
    $this->getJson('/api/' . $org->id . '/tasks/' . $model->id)->assertStatus(200);
    // $this->putJson('/api/' . $org->id . '/tasks/' . $model->id, [...])->assertStatus(200);
});

it('blocks member restricted tasks endpoints', function () {
    $org = Organization::factory()->create();
    $user = createUserWithRole('member', $org, ['tasks.index', 'tasks.show', 'tasks.update']);
    $model = Task::factory()->create();

    $this->actingAs($user);

    $this->postJson('/api/' . $org->id . '/tasks', [])->assertStatus(403);
    $this->deleteJson('/api/' . $org->id . '/tasks/' . $model->id)->assertStatus(403);
});

it('allows viewer permitted tasks endpoints', function () {
    $org = Organization::factory()->create();
    $user = createUserWithRole('viewer', $org, ['tasks.index', 'tasks.show']);
    $model = Task::factory()->create();

    $this->actingAs($user);

    $this->getJson('/api/' . $org->id . '/tasks')->assertStatus(200);
    $this->getJson('/api/' . $org->id . '/tasks/' . $model->id)->assertStatus(200);
});

it('blocks viewer restricted tasks endpoints', function () {
    $org = Organization::factory()->create();
    $user = createUserWithRole('viewer', $org, ['tasks.index', 'tasks.show']);
    $model = Task::factory()->create();

    $this->actingAs($user);

    $this->postJson('/api/' . $org->id . '/tasks', [])->assertStatus(403);
    $this->putJson('/api/' . $org->id . '/tasks/' . $model->id, [])->assertStatus(403);
    $this->deleteJson('/api/' . $org->id . '/tasks/' . $model->id)->assertStatus(403);
});

// ---------------------------------------------------------------
// Field visibility tests
// ---------------------------------------------------------------

it('shows only permitted fields for member on tasks', function () {
    $org = Organization::factory()->create();
    $user = createUserWithRole('member', $org, ['tasks.index', 'tasks.show', 'tasks.update']);
    $model = Task::factory()->create(['organization_id' => $org->id]);

    $this->actingAs($user);

    $response = $this->getJson('/api/' . $org->id . '/tasks/' . $model->id);
    $response->assertStatus(200);

    $data = $response->json();

    // Should see these fields
    $this->assertArrayHasKey('id', $data);
    $this->assertArrayHasKey('title', $data);
    $this->assertArrayHasKey('description', $data);
    $this->assertArrayHasKey('status', $data);
    $this->assertArrayHasKey('priority', $data);
    // ... and 3 more permitted fields

    // Should NOT see these fields
    $this->assertArrayNotHasKey('estimated_hours', $data);
});

it('shows only permitted fields for viewer on tasks', function () {
    $org = Organization::factory()->create();
    $user = createUserWithRole('viewer', $org, ['tasks.index', 'tasks.show']);
    $model = Task::factory()->create(['organization_id' => $org->id]);

    $this->actingAs($user);

    $response = $this->getJson('/api/' . $org->id . '/tasks/' . $model->id);
    $response->assertStatus(200);

    $data = $response->json();

    // Should see these fields
    $this->assertArrayHasKey('id', $data);
    $this->assertArrayHasKey('title', $data);
    $this->assertArrayHasKey('description', $data);
    $this->assertArrayHasKey('status', $data);
    $this->assertArrayHasKey('priority', $data);
    // ... and 3 more permitted fields

    // Should NOT see these fields
    $this->assertArrayNotHasKey('estimated_hours', $data);
});

