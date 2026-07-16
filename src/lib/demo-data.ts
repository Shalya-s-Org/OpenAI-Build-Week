import type { ActionItem, Blocker, Decision, Meeting, WorkspaceMember } from "@/lib/types";

export const workspaceMembers: WorkspaceMember[] = [
  { id: "member-maya", name: "Maya Chen", initials: "MC", role: "Product" },
  { id: "member-aarav", name: "Aarav Patel", initials: "AP", role: "Engineering" },
  { id: "member-nora", name: "Nora Williams", initials: "NW", role: "Design" },
];
export const demoMeeting: Meeting = { id: "meeting-launch", title: "Launch readiness", occurredAt: "2026-07-16T09:30:00.000Z", attendees: workspaceMembers.map((member) => member.id), source: "notes" };
export const demoActions: ActionItem[] = [
  { id: "action-onboarding", title: "Confirm onboarding email sequence", ownerId: "member-maya", dueDate: "2026-07-17", status: "in_progress", confidence: 0.98, sourceQuote: "Maya will confirm the onboarding sequence before tomorrow's launch review.", meetingId: demoMeeting.id },
  { id: "action-api", title: "Validate API rate-limit behavior", ownerId: "member-aarav", dueDate: "2026-07-16", status: "blocked", confidence: 0.94, sourceQuote: "Aarav needs the staging credentials before validating rate limits.", meetingId: demoMeeting.id, blockerId: "blocker-credentials" },
  { id: "action-empty-state", title: "Finalize empty-state illustrations", ownerId: "member-nora", dueDate: "2026-07-18", status: "not_started", confidence: 0.92, sourceQuote: "Nora will finalize the empty states by Friday.", meetingId: demoMeeting.id },
];
export const demoDecisions: Decision[] = [{ id: "decision-launch", statement: "Keep the launch scope focused on the core review workflow.", confidence: 0.97, sourceQuote: "We agreed to keep integrations out of the first launch.", meetingId: demoMeeting.id }];
export const demoBlockers: Blocker[] = [{ id: "blocker-credentials", description: "Staging credentials are still awaiting approval.", ownerId: "member-maya", actionItemId: "action-api" }];
