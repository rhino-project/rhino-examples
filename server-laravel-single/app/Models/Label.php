<?php

namespace App\Models;

use Rhino\Models\RhinoModel;

/**
 * Label — SHARED GLOBAL catalog.
 *
 * Labels have no owner (no organization_id, no user_id) and are visible to every
 * authenticated user. There is intentionally NO LabelScope filtering, so the
 * catalog is shared. This demonstrates "the user owns everything except global
 * reference tables."
 */
class Label extends RhinoModel
{
    protected $fillable = [
        'name',
        'color',
    ];

    protected $validationRules = [
        'name' => 'required|string|max:255',
        'color' => 'nullable|string|max:255',
    ];

    public static $allowedFilters = ['name'];
    public static $allowedSorts = ['name'];
    public static $defaultSort = 'created_at';
    public static $allowedFields = ['id', 'name', 'color', 'created_at', 'updated_at'];
    public static $allowedIncludes = [];

    public static array $exceptActions = ['forceDelete'];

    public function tasks(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Task::class, 'task_labels');
    }
}
