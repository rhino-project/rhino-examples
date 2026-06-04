/*
  Warnings:

  - You are about to drop the `organization_invitations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `organizations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `roles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_roles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `organizationId` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `labels` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `projects` table. All the data in the column will be lost.
  - Added the required column `userId` to the `projects` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "organization_invitations_token_key";

-- DropIndex
DROP INDEX "organizations_slug_key";

-- DropIndex
DROP INDEX "roles_slug_key";

-- DropIndex
DROP INDEX "user_roles_userId_organizationId_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "organization_invitations";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "organizations";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "roles";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "user_roles";
PRAGMA foreign_keys=on;

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
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_audit_logs" ("action", "auditableId", "auditableType", "createdAt", "id", "ipAddress", "newValues", "oldValues", "userAgent", "userId") SELECT "action", "auditableId", "auditableType", "createdAt", "id", "ipAddress", "newValues", "oldValues", "userAgent", "userId" FROM "audit_logs";
DROP TABLE "audit_logs";
ALTER TABLE "new_audit_logs" RENAME TO "audit_logs";
CREATE INDEX "audit_logs_auditableType_auditableId_idx" ON "audit_logs"("auditableType", "auditableId");
CREATE TABLE "new_labels" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);
INSERT INTO "new_labels" ("color", "createdAt", "deletedAt", "id", "name", "updatedAt") SELECT "color", "createdAt", "deletedAt", "id", "name", "updatedAt" FROM "labels";
DROP TABLE "labels";
ALTER TABLE "new_labels" RENAME TO "labels";
CREATE TABLE "new_projects" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
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
    CONSTRAINT "projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_projects" ("budget", "createdAt", "deletedAt", "description", "endsAt", "id", "internalNotes", "startsAt", "status", "title", "updatedAt") SELECT "budget", "createdAt", "deletedAt", "description", "endsAt", "id", "internalNotes", "startsAt", "status", "title", "updatedAt" FROM "projects";
DROP TABLE "projects";
ALTER TABLE "new_projects" RENAME TO "projects";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
