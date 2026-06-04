<?php

namespace App\Models;

use Rhino\Models\RhinoModel;
use Rhino\Traits\HasAuditTrail;
use App\Models\Project;
use App\Models\User;


class Task extends RhinoModel
{
    use HasAuditTrail;

    protected $fillable = [
            'title',
            'description',
            'status',
            'priority',
            'estimated_hours',
            'due_date',
            'project_id',
            'assignee_id',
        ];

    // ---------------------------------------------------------------
    // Validation rules
    // ---------------------------------------------------------------

    // Format rules for all fields (applied on both store and update).
    protected $validationRules = [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|string|max:255',
            'priority' => 'required|string|max:255',
            'estimated_hours' => 'nullable|numeric',
            'due_date' => 'nullable|date',
            'project_id' => 'required|integer|exists:projects,id',
            'assignee_id' => 'nullable|integer|exists:users,id',
        ];

    // ---------------------------------------------------------------
    // Query Builder configuration (used by Rhino's GlobalController)
    // ---------------------------------------------------------------

    public static $allowedFilters = [
            'title',
            'status',
            'priority',
        ];
    public static $allowedSorts = [
            'title',
            'status',
            'priority',
            'due_date',
        ];
    public static $defaultSort = 'created_at';
    public static $allowedFields = [
            'id',
            'title',
            'description',
            'status',
            'priority',
            'estimated_hours',
            'due_date',
            'project_id',
            'assignee_id',
            'created_at',
            'updated_at',
        ];
    public static $allowedIncludes = [
            'project',
            'assignee',
        ];
    // public static $allowedSearch = [];

    // ---------------------------------------------------------------
    // Pagination (uncomment to enable default pagination)
    // ---------------------------------------------------------------
    // public static bool $paginationEnabled = false;
    // protected $perPage = 25;

    // ---------------------------------------------------------------
    // Middleware
    // ---------------------------------------------------------------
    public static array $middlewareActions = ['store' => ['throttle:60,1']];

    // ---------------------------------------------------------------
    // Exclude actions (uncomment to disable specific CRUD endpoints)
    // ---------------------------------------------------------------
    // public static array $exceptActions = [];

    // ---------------------------------------------------------------
    // Hidden columns (add columns to hide from API responses)
    // ---------------------------------------------------------------
    // protected static $additionalHiddenColumns = [];

    // ---------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------

    public function project(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function assignee(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function comments(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function labels(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Label::class, 'task_labels');
    }
}
