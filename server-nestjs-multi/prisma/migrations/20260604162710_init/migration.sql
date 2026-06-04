-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
