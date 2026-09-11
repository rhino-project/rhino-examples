<?php

namespace App\Models;

use Rhino\Models\RhinoModel;
use Rhino\Traits\HasAuditTrail;
use App\Models\Project;
use App\Models\User;


class Task extends RhinoModel
{
    use HasAuditTrail;

    // ---------------------------------------------------------------
    // Route Key (see "Route Key" in the Rhino docs)
    // ---------------------------------------------------------------
    // Member endpoints (show/update/destroy/restore/force-delete) match the
    // {id} URL segment against `hash_id` instead of the primary key.
    public static string $routeKey = 'hash_id';

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

    // ---------------------------------------------------------------
    // Named scopes selectable with ?scope=
    // ---------------------------------------------------------------
    //
    //   ?scope=assignedToMe                              no arguments
    //   ?scope[dueBefore]=2026-12-31                     one declared parameter
    //   ?scope[dueBetween][from]=a&scope[dueBetween][to]=b    named parameters
    //   ?scope[byStatus][status]=todo                    'priority' is optional
    //
    public static $allowedScopes = [
            'assignedToMe',
            'dueBefore' => 'date',
            'dueBetween' => ['from', 'to'],
            'byStatus' => ['params' => ['status', 'priority'], 'optional' => ['priority']],
        ];
    public static $defaultScope = 'active';
    public static $allowedFields = [
            'id',
            'hash_id',
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
    // Computed attributes (see "Computed Attributes" in the Rhino docs)
    // ---------------------------------------------------------------

    // OPT-IN per-row values: nothing is evaluated unless the client asks for it
    // by name via ?computed_attributes=comment_count,is_overdue
    public function rhinoRecordComputedAttributes(): array
    {
        return [
            'comment_count' => fn ($record, $user) => $record->comments()->count(),
            'is_overdue' => fn ($record, $user) => $record->due_date !== null
                && $record->status !== 'done'
                && $record->due_date < now(),
        ];
    }

    // COLLECTION-level aggregates: evaluated ONCE per request over the scoped,
    // filtered query. Served by GET /api/{org}/tasks/computed?attributes=...
    public static function rhinoCollectionComputedAttributes(): array
    {
        return [
            'total_count' => fn ($query, $user) => $query->count(),
            'open_tasks_count' => fn ($query, $user) => $query->where('status', '!=', 'done')->count(),
            'done_tasks_count' => fn ($query, $user) => $query->where('status', 'done')->count(),
            'high_priority_count' => fn ($query, $user) => $query->where('priority', 'high')->count(),
            'estimated_hours_total' => fn ($query, $user) => (float) $query->sum('estimated_hours'),
        ];
    }

    // ---------------------------------------------------------------
    // Named scope bodies. Each receives the current user first, then the
    // parameters declared in $allowedScopes, in that order.
    // ---------------------------------------------------------------

    public function scopeActive(\Illuminate\Database\Eloquent\Builder $query, ?\Illuminate\Contracts\Auth\Authenticatable $user): \Illuminate\Database\Eloquent\Builder
    {
        return $query->where('status', '!=', 'done');
    }

    public function scopeAssignedToMe(\Illuminate\Database\Eloquent\Builder $query, ?\Illuminate\Contracts\Auth\Authenticatable $user): \Illuminate\Database\Eloquent\Builder
    {
        if (! $user) {
            return $query->whereRaw('1 = 0'); // fail closed
        }

        return $query->where('assignee_id', $user->id);
    }

    public function scopeDueBefore(\Illuminate\Database\Eloquent\Builder $query, ?\Illuminate\Contracts\Auth\Authenticatable $user, $date): \Illuminate\Database\Eloquent\Builder
    {
        return $query->whereNotNull('due_date')->whereDate('due_date', '<', $date);
    }

    public function scopeDueBetween(\Illuminate\Database\Eloquent\Builder $query, ?\Illuminate\Contracts\Auth\Authenticatable $user, $from, $to): \Illuminate\Database\Eloquent\Builder
    {
        return $query->whereBetween('due_date', [$from, $to]);
    }

    public function scopeByStatus(\Illuminate\Database\Eloquent\Builder $query, ?\Illuminate\Contracts\Auth\Authenticatable $user, $status, $priority = null): \Illuminate\Database\Eloquent\Builder
    {
        $query->where('status', $status);

        if ($priority !== null) {
            $query->where('priority', $priority);
        }

        return $query;
    }

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
