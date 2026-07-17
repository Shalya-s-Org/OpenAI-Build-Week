import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Seed Workspace Members
  const members = [
    { id: "member-maya", name: "Maya Chen", initials: "MC", role: "Product" },
    { id: "member-aarav", name: "Aarav Patel", initials: "AP", role: "Engineering" },
    { id: "member-nora", name: "Nora Williams", initials: "NW", role: "Design" },
  ];

  for (const m of members) {
    await prisma.workspaceMember.upsert({
      where: { id: m.id },
      update: m,
      create: m,
    });
  }
  console.log("Seeded workspace members.");

  // Seed Demo Meeting
  const meeting = {
    id: "meeting-launch",
    title: "Launch readiness",
    occurredAt: "2026-07-16T09:30:00.000Z",
    transcript: `Decision: Keep the launch scope focused on the core review workflow.
Action: Confirm onboarding email sequence — Owner: Maya Chen — Due: tomorrow
Action: Validate API rate-limit behavior — Owner: Aarav Patel — Due: today
Blocker: Staging credentials are still awaiting approval — Waiting on: Maya Chen`,
    summary: "Keep the launch scope focused on the core review workflow.",
  };

  await prisma.meeting.upsert({
    where: { id: meeting.id },
    update: meeting,
    create: meeting,
  });
  console.log("Seeded demo meeting.");

  // Seed Action Items
  const actions = [
    {
      id: "action-onboarding",
      title: "Confirm onboarding email sequence",
      ownerId: "member-maya",
      dueDate: "2026-07-17",
      status: "in_progress",
      confidence: 0.98,
      sourceQuote: "Maya will confirm the onboarding sequence before tomorrow's launch review.",
      meetingId: meeting.id,
    },
    {
      id: "action-api",
      title: "Validate API rate-limit behavior",
      ownerId: "member-aarav",
      dueDate: "2026-07-16",
      status: "blocked",
      confidence: 0.94,
      sourceQuote: "Aarav needs the staging credentials before validating rate limits.",
      meetingId: meeting.id,
    },
    {
      id: "action-empty-state",
      title: "Finalize empty-state illustrations",
      ownerId: "member-nora",
      dueDate: "2026-07-18",
      status: "not_started",
      confidence: 0.92,
      sourceQuote: "Nora will finalize the empty states by Friday.",
      meetingId: meeting.id,
    },
  ];

  for (const act of actions) {
    await prisma.actionItem.upsert({
      where: { id: act.id },
      update: act,
      create: act,
    });
  }
  console.log("Seeded action items.");

  // Seed Decision
  const decision = {
    id: "decision-launch",
    statement: "Keep the launch scope focused on the core review workflow.",
    confidence: 0.97,
    sourceQuote: "We agreed to keep integrations out of the first launch.",
    meetingId: meeting.id,
  };

  await prisma.decision.upsert({
    where: { id: decision.id },
    update: decision,
    create: decision,
  });
  console.log("Seeded decision.");

  // Seed Blocker
  const blocker = {
    id: "blocker-credentials",
    description: "Staging credentials are still awaiting approval.",
    ownerId: "member-maya",
    actionItemId: "action-api",
    meetingId: meeting.id,
  };

  await prisma.blocker.upsert({
    where: { id: blocker.id },
    update: blocker,
    create: blocker,
  });
  console.log("Seeded blocker.");

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
