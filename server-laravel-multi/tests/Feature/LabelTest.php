<?php

use App\Models\Label;
use App\Models\Organization;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

require_once __DIR__ . '/../Helpers.php';

beforeEach(function () {
    Tests\seedRoles();
    $this->org = Organization::factory()->create();
});

// ---------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------

it('admin can create a label', function () {
    $user = Tests\createUserInOrg('admin', $this->org);

    $response = $this->actingAs($user)
        ->postJson('/api/' . $this->org->slug . '/labels', [
            'name' => 'bug',
            'color' => '#ff0000',
        ]);

    $response->assertStatus(201);
    expect($response->json('name'))->toBe('bug');
    expect($response->json('color'))->toBe('#ff0000');
});

it('admin can list labels', function () {
    $user = Tests\createUserInOrg('admin', $this->org);
    Label::factory()->create(['organization_id' => $this->org->id]);

    $response = $this->actingAs($user)
        ->getJson('/api/' . $this->org->slug . '/labels');

    $response->assertStatus(200);
    expect($response->json())->toHaveCount(1);
});

it('admin can update a label', function () {
    $user = Tests\createUserInOrg('admin', $this->org);
    $label = Label::factory()->create(['organization_id' => $this->org->id]);

    $response = $this->actingAs($user)
        ->putJson('/api/' . $this->org->slug . '/labels/' . $label->id, [
            'name' => 'updated-name',
        ]);

    $response->assertStatus(200);
    expect($response->json('name'))->toBe('updated-name');
});

it('admin can soft-delete a label', function () {
    $user = Tests\createUserInOrg('admin', $this->org);
    $label = Label::factory()->create(['organization_id' => $this->org->id]);

    $response = $this->actingAs($user)
        ->deleteJson('/api/' . $this->org->slug . '/labels/' . $label->id);

    $response->assertStatus(204);
    expect(Label::find($label->id))->toBeNull();
    expect(Label::withTrashed()->find($label->id))->not->toBeNull();
});

// ---------------------------------------------------------------
// Force-delete disabled
// ---------------------------------------------------------------

it('force-delete route does not exist for labels', function () {
    $user = Tests\createUserInOrg('admin', $this->org);
    $label = Label::factory()->create(['organization_id' => $this->org->id]);

    // Soft-delete first
    $label->delete();

    $response = $this->actingAs($user)
        ->deleteJson('/api/' . $this->org->slug . '/labels/' . $label->id . '/force-delete');

    // Should get 404 because the route is excluded
    $response->assertStatus(404);
});

// ---------------------------------------------------------------
// Member/viewer are read-only
// ---------------------------------------------------------------

it('member cannot create a label', function () {
    $user = Tests\createUserInOrg('member', $this->org, [
        'labels.index', 'labels.show',
    ]);

    $response = $this->actingAs($user)
        ->postJson('/api/' . $this->org->slug . '/labels', [
            'name' => 'should-fail',
        ]);

    $response->assertStatus(403);
});

it('viewer can list labels', function () {
    $user = Tests\createUserInOrg('viewer', $this->org, [
        'labels.index', 'labels.show',
    ]);
    Label::factory()->create(['organization_id' => $this->org->id]);

    $response = $this->actingAs($user)
        ->getJson('/api/' . $this->org->slug . '/labels');

    $response->assertStatus(200);
});

// ---------------------------------------------------------------
// Cross-org isolation
// ---------------------------------------------------------------

it('labels are isolated per organization', function () {
    $user = Tests\createUserInOrg('admin', $this->org);
    $otherOrg = Organization::factory()->create();

    Label::factory()->create(['organization_id' => $this->org->id, 'name' => 'mine']);
    Label::factory()->create(['organization_id' => $otherOrg->id, 'name' => 'theirs']);

    $response = $this->actingAs($user)
        ->getJson('/api/' . $this->org->slug . '/labels');

    $response->assertStatus(200);
    $labels = $response->json('data') ?? $response->json();
    expect($labels)->toHaveCount(1);
    expect($labels[0]['name'])->toBe('mine');
});
