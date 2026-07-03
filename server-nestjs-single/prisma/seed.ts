import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);
  // Global permissions live on User.permissions (no roles in single-tenant).
  const allPerms = JSON.stringify(['*']);

  // --------- Plain users (no orgs) ---------
  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: { permissions: allPerms },
    create: { email: 'alice@example.com', name: 'Alice', password, permissions: allPerms },
  });
  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: { permissions: allPerms },
    create: { email: 'bob@example.com', name: 'Bob', password, permissions: allPerms },
  });

  // --------- Projects owned per user ---------
  async function ensureProject(userId: number, title: string, status: string, budget: number) {
    const existing = await prisma.project.findFirst({ where: { title, userId } });
    if (existing) return existing;
    return prisma.project.create({ data: { userId, title, status, budget } });
  }

  const aliceProject = await ensureProject(alice.id, 'Alice Website Redesign', 'active', 50000);
  await ensureProject(alice.id, 'Alice Mobile App', 'draft', 120000);
  const bobProject = await ensureProject(bob.id, 'Bob API Migration', 'completed', 25000);

  // --------- Tasks (owned via parent project) ---------
  async function ensureTask(projectId: number, title: string, status: string, priority: string, assignedTo: number) {
    const existing = await prisma.task.findFirst({ where: { title, projectId } });
    if (existing) return existing;
    return prisma.task.create({ data: { projectId, title, status, priority, assignedTo } });
  }

  // ALICE-owned project: mix of alice/bob assignees and done/non-done statuses.
  //  - 2 alice non-done tasks + 1 alice DONE task -> alice assignedToMe=2; default 'active' hides the done one
  //  - 1 bob task inside alice's project          -> proves scope=assignedToMe(alice) EXCLUDES it,
  //                                                   yet show(scope=assignedToMe) still returns it (200)
  const aliceTask = await ensureTask(aliceProject.id, 'Design homepage', 'in_progress', 'high', alice.id);
  await ensureTask(aliceProject.id, 'Write copy', 'todo', 'medium', alice.id);
  await ensureTask(aliceProject.id, 'Launch site', 'done', 'high', alice.id);
  const bobTaskInAliceProject = await ensureTask(aliceProject.id, 'Bob helps QA', 'todo', 'low', bob.id);

  // BOB-owned project: 1 bob non-done + 1 bob DONE  -> bob assignedToMe=1
  await ensureTask(bobProject.id, 'Port endpoints', 'todo', 'medium', bob.id);
  await ensureTask(bobProject.id, 'Cut over DNS', 'done', 'high', bob.id);
  // eslint-disable-next-line no-console
  console.log('BOB_TASK_IN_ALICE_PROJECT_ID=' + bobTaskInAliceProject.id);

  // --------- Comments (author via userId; owned via task→project) ---------
  const existingComment = await prisma.comment.findFirst({ where: { taskId: aliceTask.id } });
  if (!existingComment) {
    await prisma.comment.create({
      data: { taskId: aliceTask.id, userId: alice.id, body: 'Started wireframes.' },
    });
  }

  // --------- Labels: SHARED GLOBAL catalog (no owner) ---------
  const labels = [
    { name: 'bug', color: '#dc3545' },
    { name: 'feature', color: '#28a745' },
    { name: 'urgent', color: '#ffc107' },
    { name: 'documentation', color: '#17a2b8' },
  ];
  for (const l of labels) {
    const existing = await prisma.label.findFirst({ where: { name: l.name } });
    if (!existing) await prisma.label.create({ data: l });
  }

  // eslint-disable-next-line no-console
  console.log('✓ Seed complete (single-tenant): alice & bob, shared Label catalog');
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
