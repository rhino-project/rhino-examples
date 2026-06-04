<?php

namespace App\Models;

use Rhino\Models\RhinoModel;
use Rhino\Traits\HasAuditTrail;

/**
 * Project — top-level user-owned model in the single-tenant variant.
 *
 * Ownership is by `user_id`. On create, user_id is auto-stamped from the
 * authenticated user. Read/write isolation is enforced by ProjectScope
 * (app/Models/Scopes/ProjectScope.php), which constrains every query to the
 * current user's rows.
 */
class Project extends RhinoModel
{
    use HasAuditTrail;

    protected static function booted(): void
    {
        static::creating(function (Project $project) {
            // Auto-stamp ownership from the authenticated user. Gated on
            // auth()->check() so console/seeder creates (which set user_id
            // explicitly and have no auth user) are left untouched.
            if (auth()->check() && !$project->user_id) {
                $project->user_id = auth()->id();
            }
        });
    }

    protected $fillable = [
        'user_id',
        'title',
        'description',
        'status',
        'budget',
        'internal_notes',
        'starts_at',
        'ends_at',
    ];

    protected $validationRules = [
        'title' => 'required|string|max:255',
        'description' => 'nullable|string',
        'status' => 'required|string|max:255',
        'budget' => 'nullable|numeric',
        'internal_notes' => 'nullable|string',
        'starts_at' => 'nullable|date',
        'ends_at' => 'nullable|date',
    ];

    public static $allowedFilters = ['title', 'status'];
    public static $allowedSorts = ['title', 'status', 'starts_at', 'ends_at'];
    public static $defaultSort = 'created_at';
    public static $allowedFields = [
        'id', 'user_id', 'title', 'description', 'status', 'budget',
        'internal_notes', 'starts_at', 'ends_at', 'created_at', 'updated_at',
    ];
    public static $allowedIncludes = ['tasks', 'user'];

    public function tasks(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
