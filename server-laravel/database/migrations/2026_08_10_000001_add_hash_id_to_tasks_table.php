<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Route Key feature: tasks are addressed by `hash_id` in member endpoint URLs
// instead of the numeric primary key (see Task::$routeKey).
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->string('hash_id', 32)->nullable()->unique()->after('id');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropUnique(['hash_id']);
            $table->dropColumn('hash_id');
        });
    }
};
