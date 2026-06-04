<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * personal_projects — the user-owned model served only by the `personal` route
 * group in the hybrid app. It coexists with the org-owned `projects` table used
 * by the agency/vendor groups. Ownership is by user_id (no organization).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('personal_projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('status')->default('draft');
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('personal_projects');
    }
};
