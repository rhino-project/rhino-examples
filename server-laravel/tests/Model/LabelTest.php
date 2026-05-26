<?php

use App\Models\User;
use App\Models\Label;
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

it('allows owner permitted labels endpoints', function () {
    $org = Organization::factory()->create();
    $user = createUserWithRole('owner', $org, ['labels.*']);
    $model = Label::factory()->create();

    $this->actingAs($user);

    $this->getJson('/api/' . $org->id . '/labels')->assertStatus(200);
    $this->getJson('/api/' . $org->id . '/labels/' . $model->id)->assertStatus(200);
    // $this->postJson('/api/' . $org->id . '/labels', [...])->assertStatus(201);
    // $this->putJson('/api/' . $org->id . '/labels/' . $model->id, [...])->assertStatus(200);
    $this->deleteJson('/api/' . $org->id . '/labels/' . $model->id)->assertStatus(200);
});

it('allows admin permitted labels endpoints', function () {
    $org = Organization::factory()->create();
    $user = createUserWithRole('admin', $org, ['labels.index', 'labels.show', 'labels.store', 'labels.update', 'labels.destroy', 'labels.trashed', 'labels.restore']);
    $model = Label::factory()->create();

    $this->actingAs($user);

    $this->getJson('/api/' . $org->id . '/labels')->assertStatus(200);
    $this->getJson('/api/' . $org->id . '/labels/' . $model->id)->assertStatus(200);
    // $this->postJson('/api/' . $org->id . '/labels', [...])->assertStatus(201);
    // $this->putJson('/api/' . $org->id . '/labels/' . $model->id, [...])->assertStatus(200);
    $this->deleteJson('/api/' . $org->id . '/labels/' . $model->id)->assertStatus(200);
});

it('allows manager permitted labels endpoints', function () {
    $org = Organization::factory()->create();
    $user = createUserWithRole('manager', $org, ['labels.index', 'labels.show', 'labels.store', 'labels.update']);
    $model = Label::factory()->create();

    $this->actingAs($user);

    $this->getJson('/api/' . $org->id . '/labels')->assertStatus(200);
    $this->getJson('/api/' . $org->id . '/labels/' . $model->id)->assertStatus(200);
    // $this->postJson('/api/' . $org->id . '/labels', [...])->assertStatus(201);
    // $this->putJson('/api/' . $org->id . '/labels/' . $model->id, [...])->assertStatus(200);
});

it('blocks manager restricted labels endpoints', function () {
    $org = Organization::factory()->create();
    $user = createUserWithRole('manager', $org, ['labels.index', 'labels.show', 'labels.store', 'labels.update']);
    $model = Label::factory()->create();

    $this->actingAs($user);

    $this->deleteJson('/api/' . $org->id . '/labels/' . $model->id)->assertStatus(403);
});

it('allows member permitted labels endpoints', function () {
    $org = Organization::factory()->create();
    $user = createUserWithRole('member', $org, ['labels.index', 'labels.show']);
    $model = Label::factory()->create();

    $this->actingAs($user);

    $this->getJson('/api/' . $org->id . '/labels')->assertStatus(200);
    $this->getJson('/api/' . $org->id . '/labels/' . $model->id)->assertStatus(200);
});

it('blocks member restricted labels endpoints', function () {
    $org = Organization::factory()->create();
    $user = createUserWithRole('member', $org, ['labels.index', 'labels.show']);
    $model = Label::factory()->create();

    $this->actingAs($user);

    $this->postJson('/api/' . $org->id . '/labels', [])->assertStatus(403);
    $this->putJson('/api/' . $org->id . '/labels/' . $model->id, [])->assertStatus(403);
    $this->deleteJson('/api/' . $org->id . '/labels/' . $model->id)->assertStatus(403);
});

it('allows viewer permitted labels endpoints', function () {
    $org = Organization::factory()->create();
    $user = createUserWithRole('viewer', $org, ['labels.index', 'labels.show']);
    $model = Label::factory()->create();

    $this->actingAs($user);

    $this->getJson('/api/' . $org->id . '/labels')->assertStatus(200);
    $this->getJson('/api/' . $org->id . '/labels/' . $model->id)->assertStatus(200);
});

it('blocks viewer restricted labels endpoints', function () {
    $org = Organization::factory()->create();
    $user = createUserWithRole('viewer', $org, ['labels.index', 'labels.show']);
    $model = Label::factory()->create();

    $this->actingAs($user);

    $this->postJson('/api/' . $org->id . '/labels', [])->assertStatus(403);
    $this->putJson('/api/' . $org->id . '/labels/' . $model->id, [])->assertStatus(403);
    $this->deleteJson('/api/' . $org->id . '/labels/' . $model->id)->assertStatus(403);
});

