<?php

use App\Models\Organization;
use App\Models\PersonalProject;
use App\Models\Role;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * Hybrid smoke tests (enforce_group_membership = ON).
 *
 * Exercises the three coexisting groups: agency / vendor (org-scoped, domain
 * routed) and personal (user-owned, apex host). Verifies membership isolation
 * (agency member is denied on the vendor group) and that the personal group is
 * user-owned.
 *
 * Domain-routed requests are addressed deterministically with an explicit Host
 * (the same approach as the curl smoke checks).
 */
beforeEach(function () {
    foreach (['owner', 'admin', 'manager', 'member', 'viewer'] as $slug) {
        Role::firstOrCreate(['slug' => $slug], ['name' => ucfirst($slug), 'description' => $slug]);
    }
    $this->acme = Organization::create(['name' => 'Acme', 'slug' => 'acme', 'is_active' => true]);
    $this->globex = Organization::create(['name' => 'Globex', 'slug' => 'globex', 'is_active' => true]);
    $adminRole = Role::where('slug', 'admin')->first();
    $ownerRole = Role::where('slug', 'owner')->first();

    $this->agencyUser = User::factory()->create();
    UserRole::create([
        'user_id' => $this->agencyUser->id, 'role_id' => $adminRole->id,
        'organization_id' => $this->acme->id, 'route_group' => 'agency', 'permissions' => ['*'],
    ]);

    $this->vendorUser = User::factory()->create();
    UserRole::create([
        'user_id' => $this->vendorUser->id, 'role_id' => $adminRole->id,
        'organization_id' => $this->globex->id, 'route_group' => 'vendor', 'permissions' => ['*'],
    ]);

    $this->personalUser = User::factory()->create();
    UserRole::create([
        'user_id' => $this->personalUser->id, 'role_id' => $ownerRole->id,
        'organization_id' => null, 'route_group' => 'personal', 'permissions' => ['personal-projects.*'],
    ]);
});

// Laravel's test client resolves Route::domain() from the request URL host, not
// from a Host header, so domain-routed groups are addressed with absolute URLs.

it('lets an agency member read agency projects on the agency host', function () {
    $this->actingAs($this->agencyUser, 'sanctum')
        ->getJson('http://acme.agency.lvh.me/api/projects')
        ->assertStatus(200);
});

it('blocks an agency member from the personal group (membership 403)', function () {
    $this->actingAs($this->agencyUser, 'sanctum')
        ->getJson('http://app.lvh.me/api/personal-projects')
        ->assertStatus(403);
});

it('serves user-owned personal projects to the personal user', function () {
    PersonalProject::create(['user_id' => $this->personalUser->id, 'title' => 'Mine', 'status' => 'active']);
    PersonalProject::create(['user_id' => $this->agencyUser->id, 'title' => 'Not mine', 'status' => 'active']);

    $response = $this->actingAs($this->personalUser, 'sanctum')
        ->getJson('http://app.lvh.me/api/personal-projects');

    $response->assertStatus(200);
    expect($response->json('data'))->toHaveCount(1);
    expect($response->json('data.0.title'))->toBe('Mine');
});

it('rejects an agency login on the vendor host (group-aware auth membership)', function () {
    $this->agencyUser->forceFill(['password' => bcrypt('secret123')])->save();

    $this->postJson('http://globex.vendor.lvh.me/api/auth/login', [
        'email' => $this->agencyUser->email,
        'password' => 'secret123',
    ])->assertStatus(403);
});
