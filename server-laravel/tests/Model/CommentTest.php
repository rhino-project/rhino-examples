<?php

use App\Models\User;
use App\Models\Comment;
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

it('allows owner permitted comments endpoints', function () {
    $org = Organization::factory()->create();
    $user = createUserWithRole('owner', $org, ['comments.*']);
    $model = Comment::factory()->create();

    $this->actingAs($user);

    $this->getJson('/api/' . $org->id . '/comments')->assertStatus(200);
    $this->getJson('/api/' . $org->id . '/comments/' . $model->id)->assertStatus(200);
    // $this->postJson('/api/' . $org->id . '/comments', [...])->assertStatus(201);
    // $this->putJson('/api/' . $org->id . '/comments/' . $model->id, [...])->assertStatus(200);
    $this->deleteJson('/api/' . $org->id . '/comments/' . $model->id)->assertStatus(200);
});

it('allows admin permitted comments endpoints', function () {
    $org = Organization::factory()->create();
    $user = createUserWithRole('admin', $org, ['comments.index', 'comments.show', 'comments.store', 'comments.update', 'comments.destroy', 'comments.trashed', 'comments.restore']);
    $model = Comment::factory()->create();

    $this->actingAs($user);

    $this->getJson('/api/' . $org->id . '/comments')->assertStatus(200);
    $this->getJson('/api/' . $org->id . '/comments/' . $model->id)->assertStatus(200);
    // $this->postJson('/api/' . $org->id . '/comments', [...])->assertStatus(201);
    // $this->putJson('/api/' . $org->id . '/comments/' . $model->id, [...])->assertStatus(200);
    $this->deleteJson('/api/' . $org->id . '/comments/' . $model->id)->assertStatus(200);
});

it('allows manager permitted comments endpoints', function () {
    $org = Organization::factory()->create();
    $user = createUserWithRole('manager', $org, ['comments.index', 'comments.show', 'comments.store', 'comments.update', 'comments.destroy']);
    $model = Comment::factory()->create();

    $this->actingAs($user);

    $this->getJson('/api/' . $org->id . '/comments')->assertStatus(200);
    $this->getJson('/api/' . $org->id . '/comments/' . $model->id)->assertStatus(200);
    // $this->postJson('/api/' . $org->id . '/comments', [...])->assertStatus(201);
    // $this->putJson('/api/' . $org->id . '/comments/' . $model->id, [...])->assertStatus(200);
    $this->deleteJson('/api/' . $org->id . '/comments/' . $model->id)->assertStatus(200);
});

it('allows member permitted comments endpoints', function () {
    $org = Organization::factory()->create();
    $user = createUserWithRole('member', $org, ['comments.index', 'comments.show', 'comments.store', 'comments.update']);
    $model = Comment::factory()->create();

    $this->actingAs($user);

    $this->getJson('/api/' . $org->id . '/comments')->assertStatus(200);
    $this->getJson('/api/' . $org->id . '/comments/' . $model->id)->assertStatus(200);
    // $this->postJson('/api/' . $org->id . '/comments', [...])->assertStatus(201);
    // $this->putJson('/api/' . $org->id . '/comments/' . $model->id, [...])->assertStatus(200);
});

it('blocks member restricted comments endpoints', function () {
    $org = Organization::factory()->create();
    $user = createUserWithRole('member', $org, ['comments.index', 'comments.show', 'comments.store', 'comments.update']);
    $model = Comment::factory()->create();

    $this->actingAs($user);

    $this->deleteJson('/api/' . $org->id . '/comments/' . $model->id)->assertStatus(403);
});

it('allows viewer permitted comments endpoints', function () {
    $org = Organization::factory()->create();
    $user = createUserWithRole('viewer', $org, ['comments.index', 'comments.show']);
    $model = Comment::factory()->create();

    $this->actingAs($user);

    $this->getJson('/api/' . $org->id . '/comments')->assertStatus(200);
    $this->getJson('/api/' . $org->id . '/comments/' . $model->id)->assertStatus(200);
});

it('blocks viewer restricted comments endpoints', function () {
    $org = Organization::factory()->create();
    $user = createUserWithRole('viewer', $org, ['comments.index', 'comments.show']);
    $model = Comment::factory()->create();

    $this->actingAs($user);

    $this->postJson('/api/' . $org->id . '/comments', [])->assertStatus(403);
    $this->putJson('/api/' . $org->id . '/comments/' . $model->id, [])->assertStatus(403);
    $this->deleteJson('/api/' . $org->id . '/comments/' . $model->id)->assertStatus(403);
});

