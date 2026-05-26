<?php

namespace App\Models;

use Rhino\Contracts\HasRoleBasedValidation;
use Rhino\Traits\HasPermissions;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements HasRoleBasedValidation
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, HasApiTokens, HasPermissions;

    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Get the organizations that the user belongs to.
     */
    public function organizations()
    {
        return $this->belongsToMany(Organization::class, 'user_roles')
            ->withPivot('role_id')
            ->withTimestamps();
    }

    /**
     * Get the roles for a specific organization.
     */
    public function rolesInOrganization(Organization $organization)
    {
        return $this->belongsToMany(Role::class, 'user_roles')
            ->wherePivot('organization_id', $organization->id)
            ->withTimestamps();
    }
}
