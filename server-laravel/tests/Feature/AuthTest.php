<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

it('logs in with valid credentials and returns token', function () {
    $user = User::factory()->create([
        'email' => 'test@example.com',
        'password' => Hash::make('secret123'),
    ]);

    $response = $this->postJson('/api/auth/login', [
        'email' => 'test@example.com',
        'password' => 'secret123',
    ]);

    $response->assertStatus(200)
        ->assertJsonStructure(['token']);
});

it('rejects login with invalid credentials', function () {
    User::factory()->create([
        'email' => 'test@example.com',
        'password' => Hash::make('secret123'),
    ]);

    $response = $this->postJson('/api/auth/login', [
        'email' => 'test@example.com',
        'password' => 'wrong-password',
    ]);

    $response->assertStatus(401);
});

it('rejects login with non-existent email', function () {
    $response = $this->postJson('/api/auth/login', [
        'email' => 'nobody@example.com',
        'password' => 'secret123',
    ]);

    $response->assertStatus(401);
});

it('requires authentication to access protected endpoints', function () {
    $org = \App\Models\Organization::factory()->create();
    $response = $this->getJson('/api/' . $org->slug . '/projects');

    $response->assertStatus(401);
});

it('can logout', function () {
    $user = User::factory()->create();
    $token = $user->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
    ])->postJson('/api/auth/logout');

    $response->assertStatus(200);
});
