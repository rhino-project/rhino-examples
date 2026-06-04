<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * Single-tenant TaskFlow user.
 *
 * There is NO Organization / Role / UserRole in this variant. A user simply owns
 * their own rows (Projects, and Tasks/Comments via their parent Project). The
 * `Label` catalog is a shared global resource with no owner.
 *
 * Note: this variant intentionally does NOT use Rhino's HasPermissions trait
 * (which assumes Organization/UserRole). Authorization is ownership-based, applied
 * by the per-model query scopes in app/Models/Scopes and a permissive policy.
 */
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Projects owned by this user.
     */
    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }

    /**
     * Stub kept ONLY to satisfy the library, which calls
     * `$user->organizations()->first()` in AuthController::login() to derive an
     * `organization_slug` for the login response. In a single-tenant app there
     * are no organizations, so we return a relation scoped to nothing.
     *
     * See LIBRARY GAPS in the build report: the lib should null-guard this call
     * (e.g. method_exists($user, 'organizations') ? ... : null).
     */
    public function organizations(): HasMany
    {
        // whereRaw('1 = 0') guarantees ->first() returns null without needing an
        // organizations table to exist.
        return $this->hasMany(Project::class)->whereRaw('1 = 0');
    }
}
