<?php

namespace App\Models;

use Rhino\Models\RhinoModel;

/**
 * PersonalProject — user-owned model for the `personal` route group.
 *
 * Owned by user_id (no organization). Read/write isolation is enforced by
 * PersonalProjectScope (auto-discovered global scope). user_id is auto-stamped
 * from the authenticated user on create.
 */
class PersonalProject extends RhinoModel
{
    protected $table = 'personal_projects';

    protected static function booted(): void
    {
        static::creating(function (PersonalProject $project) {
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
    ];

    protected $validationRules = [
        'title' => 'required|string|max:255',
        'description' => 'nullable|string',
        'status' => 'required|string|max:255',
    ];

    public static $allowedFilters = ['title', 'status'];
    public static $allowedSorts = ['title', 'status'];
    public static $defaultSort = 'created_at';
    public static $allowedFields = ['id', 'user_id', 'title', 'description', 'status', 'created_at', 'updated_at'];
    public static $allowedIncludes = ['user'];

    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
