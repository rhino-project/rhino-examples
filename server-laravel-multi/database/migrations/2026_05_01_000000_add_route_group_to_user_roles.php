<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bring the user_roles table up to the group-aware auth schema (GROUP_AUTH_DESIGN §3).
 *
 * Additive + reversible: adds a nullable `route_group` column. A NULL value is a
 * wildcard (member of every group) — the back-compat default — so enabling
 * `rhino.auth.enforce_group_membership` later never locks out existing rows.
 *
 * This variant leaves enforcement OFF, so the column is unused at runtime; it is
 * present purely to match the canonical schema the library ships.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_roles', function (Blueprint $table) {
            $table->string('route_group')->nullable()->after('organization_id');
        });

        // Replace the legacy unique index (user_id, role_id, organization_id) with
        // one that also keys on route_group, matching the canonical schema. SQLite
        // treats NULLs as distinct, so use a COALESCE-based expression index to keep
        // uniqueness holding for NULL route_group rows.
        $driver = Schema::getConnection()->getDriverName();
        if ($driver === 'sqlite') {
            Schema::getConnection()->statement(
                'CREATE UNIQUE INDEX user_roles_unique_coalesced ON user_roles '
                . '(user_id, role_id, COALESCE(organization_id, 0), COALESCE(route_group, \'\'))'
            );
        } elseif ($driver === 'mysql') {
            Schema::getConnection()->statement(
                'CREATE UNIQUE INDEX user_roles_unique_coalesced ON user_roles '
                . '(user_id, role_id, (COALESCE(organization_id, 0)), (COALESCE(route_group, \'\')))'
            );
        }
    }

    public function down(): void
    {
        $driver = Schema::getConnection()->getDriverName();
        if (in_array($driver, ['sqlite', 'mysql'], true)) {
            Schema::getConnection()->statement('DROP INDEX IF EXISTS user_roles_unique_coalesced');
        }

        Schema::table('user_roles', function (Blueprint $table) {
            $table->dropColumn('route_group');
        });
    }
};
