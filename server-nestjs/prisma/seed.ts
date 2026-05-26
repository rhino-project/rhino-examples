import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // --------- Roles (shared across orgs) ---------
  const roleSlugs = ['owner', 'admin', 'manager', 'member', 'viewer'];
  for (const slug of roleSlugs) {
    await prisma.role.upsert({
      where: { slug },
      update: {},
      create: { slug, name: slug[0].toUpperCase() + slug.slice(1) },
    });
  }
  const roles = await prisma.role.findMany();
  const roleBySlug = Object.fromEntries(roles.map((r) => [r.slug, r]));

  // --------- Organizations ---------
  const acme = await prisma.organization.upsert({
    where: { slug: 'acme' },
    update: {},
    create: { name: 'Acme Corp', slug: 'acme' },
  });
  const globex = await prisma.organization.upsert({
    where: { slug: 'globex' },
    update: {},
    create: { name: 'Globex Inc', slug: 'globex' },
  });

  // --------- Users + UserRoles ---------
  const password = await bcrypt.hash('password123', 10);
  const members = [
    { name: 'Alice Admin',   email: 'alice@acme.com',   org: acme,   role: 'admin',
      permissions: ['*'] },
    { name: 'Bob Manager',   email: 'bob@acme.com',     org: acme,   role: 'manager',
      permissions: ['projects.index','projects.show','projects.store','projects.update','tasks.*','comments.*','labels.index','labels.show'] },
    { name: 'Carol Member',  email: 'carol@acme.com',   org: acme,   role: 'member',
      permissions: ['projects.index','projects.show','tasks.index','tasks.show','tasks.store','tasks.update','comments.*'] },
    { name: 'Dave Viewer',   email: 'dave@acme.com',    org: acme,   role: 'viewer',
      permissions: ['projects.index','projects.show','tasks.index','tasks.show','comments.index','comments.show'] },
    { name: 'Eve Admin',     email: 'eve@globex.com',   org: globex, role: 'admin',
      permissions: ['*'] },
  ];

  for (const m of members) {
    const user = await prisma.user.upsert({
      where: { email: m.email },
      update: {},
      create: { email: m.email, name: m.name, password },
    });
    await prisma.userRole.upsert({
      where: { userId_organizationId: { userId: user.id, organizationId: m.org.id } },
      update: { permissions: JSON.stringify(m.permissions) },
      create: {
        userId: user.id,
        organizationId: m.org.id,
        roleId: roleBySlug[m.role].id,
        permissions: JSON.stringify(m.permissions),
      },
    });
  }

  // --------- Projects (Acme) ---------
  const projects = [
    { title: 'Website Redesign', status: 'active',    budget: 50000.00 },
    { title: 'Mobile App',       status: 'draft',     budget: 120000.00 },
    { title: 'API Migration',    status: 'completed', budget: 25000.00 },
  ];
  const created: Record<string, { id: number }> = {};
  for (const p of projects) {
    const rec = await prisma.project.upsert({
      where: { id: projects.indexOf(p) + 1 },
      update: {},
      create: { ...p, organizationId: acme.id },
    });
    created[p.title] = rec;
  }

  // --------- Tasks (Website Redesign) ---------
  const users = await prisma.user.findMany();
  const userByEmail = Object.fromEntries(users.map((u) => [u.email, u]));
  const websiteProject = created['Website Redesign'];

  const tasks = [
    { title: 'Design homepage', status: 'in_progress', priority: 'high',     assignee: 'carol@acme.com', estimatedHours: 16.0, dueDate: new Date('2026-05-01') },
    { title: 'Implement auth',  status: 'todo',        priority: 'critical', assignee: 'carol@acme.com', estimatedHours: 24.0, dueDate: new Date('2026-05-15') },
    { title: 'Write API docs',  status: 'todo',        priority: 'medium',   assignee: 'bob@acme.com',   estimatedHours:  8.0, dueDate: new Date('2026-05-20') },
    { title: 'Setup CI/CD',     status: 'done',        priority: 'low',      assignee: 'alice@acme.com', estimatedHours:  4.0, dueDate: new Date('2026-04-15') },
  ];
  for (const t of tasks) {
    const existing = await prisma.task.findFirst({ where: { title: t.title, projectId: websiteProject.id } });
    if (!existing) {
      await prisma.task.create({
        data: {
          projectId: websiteProject.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          estimatedHours: t.estimatedHours,
          dueDate: t.dueDate,
          assignedTo: userByEmail[t.assignee]?.id ?? null,
        },
      });
    }
  }

  // --------- Comments (demonstrates UUID primary key — AC-7) ---------
  const firstTask = await prisma.task.findFirst({ where: { title: 'Design homepage' } });
  if (firstTask) {
    const existingComment = await prisma.comment.findFirst({ where: { taskId: firstTask.id } });
    if (!existingComment) {
      await prisma.comment.create({
        data: {
          taskId: firstTask.id,
          userId: userByEmail['carol@acme.com'].id,
          body: 'Started wireframes — sharing a Figma link in the morning.',
        },
      });
      await prisma.comment.create({
        data: {
          taskId: firstTask.id,
          userId: userByEmail['alice@acme.com'].id,
          body: 'Nice, looking forward to it.',
        },
      });
    }
  }

  // --------- Labels (Acme) ---------
  const labels = [
    { name: 'bug',           color: '#dc3545' },
    { name: 'feature',       color: '#28a745' },
    { name: 'urgent',        color: '#ffc107' },
    { name: 'documentation', color: '#17a2b8' },
  ];
  for (const l of labels) {
    const existing = await prisma.label.findFirst({ where: { name: l.name, organizationId: acme.id } });
    if (!existing) {
      await prisma.label.create({ data: { ...l, organizationId: acme.id } });
    }
  }

  // eslint-disable-next-line no-console
  console.log('✓ Seed complete');
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
