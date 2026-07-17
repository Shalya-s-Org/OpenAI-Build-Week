import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding expanded database demo data...");

  // Seed Workspace Members
  const members = [
    { id: "member-maya", name: "Maya Chen", initials: "MC", role: "Product" },
    { id: "member-aarav", name: "Aarav Patel", initials: "AP", role: "Engineering" },
    { id: "member-nora", name: "Nora Williams", initials: "NW", role: "Design" },
    { id: "member-marcus", name: "Marcus Vance", initials: "MV", role: "Engineering" },
    { id: "member-elena", name: "Elena Rostova", initials: "ER", role: "Marketing" },
  ];

  for (const m of members) {
    await prisma.workspaceMember.upsert({
      where: { id: m.id },
      update: m,
      create: m,
    });
  }
  console.log("Seeded expanded workspace members.");

  // Seed Demo Meetings
  const meetings = [
    {
      id: "meeting-launch",
      title: "Launch readiness",
      occurredAt: "2026-07-16T09:30:00.000Z",
      transcript: `Decision: Keep the launch scope focused on the core review workflow.
Action: Confirm onboarding email sequence — Owner: Maya Chen — Due: tomorrow
Action: Validate API rate-limit behavior — Owner: Aarav Patel — Due: today
Blocker: Staging credentials are still awaiting approval — Waiting on: Maya Chen`,
      summary: "Final sync ahead of public launch, focusing on onboarding flows, API limits, and blocker resolutions.",
    },
    {
      id: "meeting-product",
      title: "Product sync",
      occurredAt: "2026-07-14T11:00:00.000Z",
      transcript: `Decision: Target landing page launch for next Tuesday.
Action: Draft copywriting for landing page — Owner: Elena Rostova — Due: 2026-07-14
Action: Design landing page mockup — Owner: Nora Williams — Due: 2026-07-15`,
      summary: "Discussed landing page design, copywriting scopes, and aligned on target launch milestones.",
    },
    {
      id: "meeting-sprint",
      title: "Sprint planning",
      occurredAt: "2026-07-12T10:00:00.000Z",
      transcript: `Decision: Use SQLite for local testing and PostgreSQL for staging.
Action: Setup staging environment — Owner: Aarav Patel — Due: 2026-07-13
Action: Review security guidelines — Owner: Aarav Patel — Due: 2026-07-17`,
      summary: "Sprint kickoff aligning staging environments, DB preferences, and security guidelines.",
    }
  ];

  for (const meet of meetings) {
    await prisma.meeting.upsert({
      where: { id: meet.id },
      update: meet,
      create: meet,
    });
  }
  console.log("Seeded expanded demo meetings.");

  // Seed Action Items
  const actions = [
    // Open Items
    {
      id: "action-onboarding",
      title: "Confirm onboarding email sequence",
      ownerId: "member-maya",
      dueDate: "2026-07-17",
      status: "in_progress",
      confidence: 0.98,
      sourceQuote: "Maya will confirm the onboarding sequence before tomorrow's launch review.",
      meetingId: "meeting-launch",
    },
    {
      id: "action-api",
      title: "Validate API rate-limit behavior",
      ownerId: "member-aarav",
      dueDate: "2026-07-16",
      status: "blocked",
      confidence: 0.94,
      sourceQuote: "Aarav needs the staging credentials before validating rate limits.",
      meetingId: "meeting-launch",
    },
    {
      id: "action-empty-state",
      title: "Finalize empty-state illustrations",
      ownerId: "member-nora",
      dueDate: "2026-07-18",
      status: "not_started",
      confidence: 0.92,
      sourceQuote: "Nora will finalize the empty states by Friday.",
      meetingId: "meeting-launch",
    },
    {
      id: "action-profile",
      title: "Conduct performance profiling",
      ownerId: "member-marcus",
      dueDate: "2026-07-19",
      status: "in_progress",
      confidence: 0.89,
      sourceQuote: "Marcus to profiles server responsiveness before scaling.",
      meetingId: "meeting-sprint",
    },
    {
      id: "action-deploy-landing",
      title: "Deploy landing page v1",
      ownerId: "member-aarav",
      dueDate: "2026-07-16",
      status: "blocked",
      confidence: 0.91,
      sourceQuote: "Aarav will push the landing page to production once DNS clears.",
      meetingId: "meeting-product",
    },
    // Completed Items (Historical completions to feed the line chart trend)
    {
      id: "action-setup-staging",
      title: "Setup staging environment",
      ownerId: "member-aarav",
      dueDate: "2026-07-13",
      status: "complete",
      confidence: 0.95,
      sourceQuote: "Aarav to set up staging environment by Monday.",
      meetingId: "meeting-sprint",
    },
    {
      id: "action-copywriting",
      title: "Draft copywriting for landing page",
      ownerId: "member-elena",
      dueDate: "2026-07-14",
      status: "complete",
      confidence: 0.94,
      sourceQuote: "Elena will finish the copywriting by Tuesday morning.",
      meetingId: "meeting-product",
    },
    {
      id: "action-landing-mockup",
      title: "Design landing page mockup",
      ownerId: "member-nora",
      dueDate: "2026-07-15",
      status: "complete",
      confidence: 0.97,
      sourceQuote: "Nora will complete layout designs by Wednesday.",
      meetingId: "meeting-product",
    },
    {
      id: "action-security-review",
      title: "Review security guidelines",
      ownerId: "member-aarav",
      dueDate: "2026-07-17",
      status: "complete",
      confidence: 0.92,
      sourceQuote: "Aarav will review standard guidelines.",
      meetingId: "meeting-sprint",
    },
    {
      id: "action-newsletter",
      title: "Prepare newsletter draft",
      ownerId: "member-elena",
      dueDate: "2026-07-17",
      status: "complete",
      confidence: 0.90,
      sourceQuote: "Elena to draft email newsletter.",
      meetingId: "meeting-product",
    }
  ];

  for (const act of actions) {
    await prisma.actionItem.upsert({
      where: { id: act.id },
      update: act,
      create: act,
    });
  }
  console.log("Seeded expanded action items.");

  // Seed Decisions
  const decisions = [
    {
      id: "decision-launch",
      statement: "Keep the launch scope focused on the core review workflow.",
      confidence: 0.97,
      sourceQuote: "We agreed to keep integrations out of the first launch.",
      meetingId: "meeting-launch",
    },
    {
      id: "decision-landing-date",
      statement: "Target landing page launch for next Tuesday.",
      confidence: 0.95,
      sourceQuote: "Elena and Nora agree to sync page deployment with marketing launch.",
      meetingId: "meeting-product",
    },
    {
      id: "decision-db-pref",
      statement: "Use SQLite for local testing and PostgreSQL for staging.",
      confidence: 0.96,
      sourceQuote: "Aarav recommends using SQLite local files for easy onboarding.",
      meetingId: "meeting-sprint",
    }
  ];

  for (const dec of decisions) {
    await prisma.decision.upsert({
      where: { id: dec.id },
      update: dec,
      create: dec,
    });
  }
  console.log("Seeded expanded decisions.");

  // Seed Blockers
  const blockers = [
    {
      id: "blocker-credentials",
      description: "Staging credentials are still awaiting approval.",
      ownerId: "member-maya",
      actionItemId: "action-api",
      meetingId: "meeting-launch",
    },
    {
      id: "blocker-dns",
      description: "DNS propagation delay.",
      ownerId: "member-marcus",
      actionItemId: "action-deploy-landing",
      meetingId: "meeting-product",
    }
  ];

  for (const blk of blockers) {
    await prisma.blocker.upsert({
      where: { id: blk.id },
      update: blk,
      create: blk,
    });
  }
  console.log("Seeded expanded blockers.");

  console.log("Expanded seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
