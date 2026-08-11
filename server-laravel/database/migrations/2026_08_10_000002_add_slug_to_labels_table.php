<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Route Key feature: labels are addressed by `slug` in member endpoint URLs
// instead of the numeric primary key (see Label::$routeKey).
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('labels', function (Blueprint $table) {
            $table->string('slug', 120)->nullable()->unique()->after('id');
        });
    }

    public function down(): void
    {
        Schema::table('labels', function (Blueprint $table) {
            $table->dropUnique(['slug']);
            $table->dropColumn('slug');
        });
    }
};
