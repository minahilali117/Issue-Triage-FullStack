require('dotenv/config');
const bcrypt = require('bcrypt');
const { PrismaClient, Role } = require('@prisma/client');

const prisma = new PrismaClient();

const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const CATEGORIES = ['Backend', 'Frontend', 'DevOps', 'QA', 'Platform'];
const NAMES = ['Minahil', 'Aisha', 'Omar', 'Zara', 'Ibrahim'];

const pick = (items) => items[Math.floor(Math.random() * items.length)];

const makeIssues = (users, count) =>
  Array.from({ length: count }, (_, index) => {
    const assignee = Math.random() > 0.2 ? pick(users).id : null;
    return {
      title: `Issue ${index + 1}: ${pick([
        'API timeout in reports',
        'Stale cache on dashboard',
        'Permission mismatch in exports',
        'Webhook retries spiking',
        'Search results laggy',
      ])}`,
      description: `Investigate and resolve: ${pick([
        'intermittent failures in staging',
        'customer-facing latency spikes',
        'unexpected 500 responses',
        'deployment rollback needed',
        'missing telemetry data',
      ])}.`,
      status: pick(STATUSES),
      priority: pick(PRIORITIES),
      category: pick(CATEGORIES),
      assigneeId: assignee,
      createdById: users[0].id,
    };
  });

async function main() {
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) return;

  // create sample users
  const created = await Promise.all(
    NAMES.map(async (n, i) =>
      prisma.user.create({
        data: {
          email: `${n.toLowerCase()}@example.com`,
          name: n,
          passwordHash: await bcrypt.hash(`password-${n.toLowerCase()}`, 10),
          role: i === 0 ? Role.ADMIN : Role.DEVELOPER,
        },
      }),
    ),
  );

  // create issues linked to users
  const issues = makeIssues(created, 20);
  await prisma.issue.createMany({ data: issues });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
