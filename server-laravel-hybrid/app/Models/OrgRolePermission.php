<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrgRolePermission extends Model
{
    protected $fillable = ['organization_id', 'role_id', 'permissions'];
    protected $casts = ['permissions' => 'array'];

    public function organization() { return $this->belongsTo(Organization::class); }
    public function role() { return $this->belongsTo(Role::class); }
}
