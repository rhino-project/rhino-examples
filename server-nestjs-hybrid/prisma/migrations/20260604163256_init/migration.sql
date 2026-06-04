-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_projects" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER,
    "userId" INTEGER,
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
    CONSTRAINT "projects_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_projects" ("budget", "createdAt", "deletedAt", "description", "endsAt", "id", "internalNotes", "organizationId", "startsAt", "status", "title", "updatedAt") SELECT "budget", "createdAt", "deletedAt", "description", "endsAt", "id", "internalNotes", "organizationId", "startsAt", "status", "title", "updatedAt" FROM "projects";
DROP TABLE "projects";
ALTER TABLE "new_projects" RENAME TO "projects";
CREATE TABLE "new_user_roles" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "organizationId" INTEGER,
    "roleId" INTEGER NOT NULL,
    "routeGroup" TEXT,
    "permissions" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_roles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_user_roles" ("createdAt", "id", "organizationId", "permissions", "roleId", "userId") SELECT "createdAt", "id", "organizationId", "permissions", "roleId", "userId" FROM "user_roles";
DROP TABLE "user_roles";
ALTER TABLE "new_user_roles" RENAME TO "user_roles";
CREATE UNIQUE INDEX "user_roles_userId_organizationId_roleId_routeGroup_key" ON "user_roles"("userId", "organizationId", "roleId", "routeGroup");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
