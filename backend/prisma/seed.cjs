require('dotenv/config');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const CATEGORIES = ['Backend', 'Frontend', 'DevOps', 'QA', 'Platform'];
const ASSIGNEES = ['Minahil', 'Aisha', 'Omar', 'Zara', 'Ibrahim', null];

const pick = (items) => items[Math.floor(Math.random() * items.length)];

const makeIssues = (count) =>
  Array.from({ length: count }, (_, index) => ({
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
    assignee: pick(ASSIGNEES),
  }));

async function main() {
  await prisma.issue.deleteMany();
  await prisma.issue.createMany({ data: makeIssues(20) });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
