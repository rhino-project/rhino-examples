/*
  Warnings:

  - The required column `slug` was added to the `labels` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `hashId` was added to the `tasks` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_labels" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "labels_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_labels" ("color", "createdAt", "deletedAt", "id", "name", "organizationId", "updatedAt") SELECT "color", "createdAt", "deletedAt", "id", "name", "organizationId", "updatedAt" FROM "labels";
DROP TABLE "labels";
ALTER TABLE "new_labels" RENAME TO "labels";
CREATE UNIQUE INDEX "labels_slug_key" ON "labels"("slug");
CREATE TABLE "new_tasks" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hashId" TEXT NOT NULL,
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
INSERT INTO "new_tasks" ("assignedTo", "completedAt", "createdAt", "deletedAt", "description", "dueDate", "estimatedHours", "id", "priority", "projectId", "status", "title", "updatedAt") SELECT "assignedTo", "completedAt", "createdAt", "deletedAt", "description", "dueDate", "estimatedHours", "id", "priority", "projectId", "status", "title", "updatedAt" FROM "tasks";
DROP TABLE "tasks";
ALTER TABLE "new_tasks" RENAME TO "tasks";
CREATE UNIQUE INDEX "tasks_hashId_key" ON "tasks"("hashId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
