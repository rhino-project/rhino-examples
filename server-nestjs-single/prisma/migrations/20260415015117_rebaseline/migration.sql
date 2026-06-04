/*
  Warnings:

  - You are about to drop the column `auditable_id` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `auditable_type` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `ip_address` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `new_values` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `old_values` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `user_agent` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `ends_at` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `internal_notes` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `starts_at` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `completed_at` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `due_date` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `estimated_hours` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `email_verified_at` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `has_temporary_password` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `remember_token` on the `users` table. All the data in the column will be lost.
  - Added the required column `auditableId` to the `audit_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `auditableType` to the `audit_logs` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_audit_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "auditableType" TEXT NOT NULL,
    "auditableId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldValues" TEXT,
    "newValues" TEXT,
    "userId" INTEGER,
    "organizationId" INTEGER,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "audit_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_audit_logs" ("action", "createdAt", "id", "organizationId", "userId") SELECT "action", "createdAt", "id", "organizationId", "userId" FROM "audit_logs";
DROP TABLE "audit_logs";
ALTER TABLE "new_audit_logs" RENAME TO "audit_logs";
CREATE INDEX "audit_logs_auditableType_auditableId_idx" ON "audit_logs"("auditableType", "auditableId");
CREATE TABLE "new_projects" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "budget" REAL,
    "internalNotes" TEXT,
    "startsAt" DATETIME,
    "endsAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "projects_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_projects" ("budget", "createdAt", "deletedAt", "description", "id", "organizationId", "status", "title", "updatedAt") SELECT "budget", "createdAt", "deletedAt", "description", "id", "organizationId", "status", "title", "updatedAt" FROM "projects";
DROP TABLE "projects";
ALTER TABLE "new_projects" RENAME TO "projects";
CREATE TABLE "new_tasks" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "assignedTo" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "estimatedHours" REAL,
    "dueDate" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tasks_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_tasks" ("assignedTo", "createdAt", "deletedAt", "description", "id", "priority", "projectId", "status", "title", "updatedAt") SELECT "assignedTo", "createdAt", "deletedAt", "description", "id", "priority", "projectId", "status", "title", "updatedAt" FROM "tasks";
DROP TABLE "tasks";
ALTER TABLE "new_tasks" RENAME TO "tasks";
CREATE TABLE "new_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rememberToken" TEXT,
    "hasTemporaryPassword" BOOLEAN,
    "emailVerifiedAt" DATETIME,
    "permissions" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("createdAt", "email", "id", "name", "password", "permissions", "updatedAt") SELECT "createdAt", "email", "id", "name", "password", "permissions", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
