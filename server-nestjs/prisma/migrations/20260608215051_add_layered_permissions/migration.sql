-- AlterTable
ALTER TABLE "user_roles" ADD COLUMN "deniedPermissions" TEXT;
ALTER TABLE "user_roles" ADD COLUMN "grantedPermissions" TEXT;

-- CreateTable
CREATE TABLE "org_role_permissions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,
    "permissions" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "org_role_permissions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "org_role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "org_role_permissions_organizationId_roleId_key" ON "org_role_permissions"("organizationId", "roleId");
