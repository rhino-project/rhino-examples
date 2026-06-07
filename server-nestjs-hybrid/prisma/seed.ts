import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);

  // --------- Roles ---------
  for (const slug of ['owner', 'admin', 'manager', 'member', 'viewer']) {
    await prisma.role.upsert({
      where: { slug },
      update: {},
      create: { slug, name: slug[0].toUpperCase() + slug.slice(1) },
    });
  }
  const roles = await prisma.role.findMany();
  const roleBySlug = Object.fromEntries(roles.map((r) => [r.slug, r]));

  // --------- Organizations: acme is an AGENCY, globex is a VENDOR ---------
  const acme = await prisma.organization.upsert({
    where: { slug: 'acme' },
    update: {},
    create: { name: 'Acme Agency', slug: 'acme' },
  });
  const globex = await prisma.organization.upsert({
    where: { slug: 'globex' },
    update: {},
    create: { name: 'Globex Vendor', slug: 'globex' },
  });

  // --------- Users ---------
  async function ensureUser(email: string, name: string, permissions?: string[]) {
    return prisma.user.upsert({
      where: { email },
      update: permissions ? { permissions: JSON.stringify(permissions) } : {},
      create: {
        email,
        name,
        password,
        ...(permissions ? { permissions: JSON.stringify(permissions) } : {}),
      },
    });
  }

  // Agency member (only a member of the AGENCY group / acme org).
  const agencyUser = await ensureUser('agency@acme.com', 'Agency Annie');
  // Vendor member (only a member of the VENDOR group / globex org).
  const vendorUser = await ensureUser('vendor@globex.com', 'Vendor Vince');
  // Personal user — org-less; permissions live on the personal membership row.
  const personalUser = await ensureUser('solo@app.com', 'Solo Sam');

  // --------- Group memberships (routeGroup scoped — enforcement is ON) ---------
  async function ensureMembership(
    userId: number,
    organizationId: number | null,
    roleSlug: string,
    routeGroup: string,
    permissions: string[],
  ) {
    const existing = await prisma.userRole.findFirst({ where: { userId, routeGroup } });
    const data = {
      userId,
      organizationId,
      roleId: roleBySlug[roleSlug].id,
      routeGroup,
      permissions: JSON.stringify(permissions),
    };
    if (existing) {
      await prisma.userRole.update({ where: { id: existing.id }, data });
    } else {
      await prisma.userRole.create({ data });
    }
  }

  const allPerms = ['*'];
  await ensureMembership(agencyUser.id, acme.id, 'admin', 'agency', allPerms);
  await ensureMembership(vendorUser.id, globex.id, 'admin', 'vendor', allPerms);
  // Personal membership: NULL org, routeGroup 'personal'.
  await ensureMembership(personalUser.id, null, 'owner', 'personal', allPerms);

  // --------- Domain data ---------
  // Agency org-owned project (acme).
  async function ensureOrgProject(organizationId: number, title: string, status: string) {
    const existing = await prisma.project.findFirst({ where: { title, organizationId } });
    if (existing) return existing;
    return prisma.project.create({ data: { organizationId, title, status } });
  }
  await ensureOrgProject(acme.id, 'Acme Agency Campaign', 'active');
  await ensureOrgProject(globex.id, 'Globex Vendor Catalog', 'active');

  // Personal user-owned project (no org).
  const existingPersonal = await prisma.project.findFirst({
    where: { title: 'Solo Side Project', userId: personalUser.id },
  });
  if (!existingPersonal) {
    await prisma.project.create({
      data: { userId: personalUser.id, title: 'Solo Side Project', status: 'draft' },
    });
  }

  // Org-scoped labels (one per org).
  async function ensureLabel(organizationId: number, name: string, color: string) {
    const existing = await prisma.label.findFirst({ where: { name, organizationId } });
    if (!existing) await prisma.label.create({ data: { organizationId, name, color } });
  }
  await ensureLabel(acme.id, 'agency-urgent', '#ffc107');
  await ensureLabel(globex.id, 'vendor-stock', '#17a2b8');

  // eslint-disable-next-line no-console
  console.log(
    '✓ Seed complete (hybrid): agency=acme/agency@acme.com, vendor=globex/vendor@globex.com, personal=solo@app.com',
  );
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
