<?php

namespace App\Models;

use Rhino\Models\RhinoModel;
// use Rhino\Traits\HasAuditTrail;
// use Rhino\Traits\HasUuid;
use Rhino\Traits\BelongsToOrganization;


class Label extends RhinoModel
{
    // use HasAuditTrail;
    // use HasUuid;
    use BelongsToOrganization;

    // ---------------------------------------------------------------
    // Route Key (see "Route Key" in the Rhino docs)
    // ---------------------------------------------------------------
    // Member endpoints (show/update/destroy/restore/force-delete) match the
    // {id} URL segment against `slug` instead of the primary key.
    public static string $routeKey = 'slug';

    protected $fillable = [
            'organization_id',
            'name',
            'color',
        ];

    // ---------------------------------------------------------------
    // Validation rules
    // ---------------------------------------------------------------

    // Format rules for all fields (applied on both store and update).
    protected $validationRules = [
            'name' => 'required|string|max:255',
            'color' => 'nullable|string|max:255',
        ];

    // ---------------------------------------------------------------
    // Query Builder configuration (used by Rhino's GlobalController)
    // ---------------------------------------------------------------

    public static $allowedFilters = [
            'name',
        ];
    public static $allowedSorts = [
            'name',
        ];
    public static $defaultSort = 'created_at';
    public static $allowedFields = [
            'id',
            'slug',
            'name',
            'color',
            'created_at',
            'updated_at',
        ];
    public static $allowedIncludes = [];
    // public static $allowedSearch = [];

    // ---------------------------------------------------------------
    // Pagination (uncomment to enable default pagination)
    // ---------------------------------------------------------------
    // public static bool $paginationEnabled = false;
    // protected $perPage = 25;

    // ---------------------------------------------------------------
    // Middleware (uncomment to add per-model middleware)
    // ---------------------------------------------------------------
    // public static array $middleware = [];
    // public static array $middlewareActions = [];

    // ---------------------------------------------------------------
    // Exclude actions
    // ---------------------------------------------------------------
    public static array $exceptActions = ['forceDelete'];

    // ---------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------

    public function tasks(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Task::class, 'task_labels');
    }
}
