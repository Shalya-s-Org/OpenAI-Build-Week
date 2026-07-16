export type ActionStatus = "not_started" | "in_progress" | "blocked" | "complete";

export interface WorkspaceMember { id: string; name: string; initials: string; role: string; }
export interface Meeting { id: string; title: string; occurredAt: string; attendees: string[]; source: "notes" | "upload" | "integration"; }
export interface ActionItem {
  id: string; title: string; ownerId: string | null; dueDate: string | null; status: ActionStatus;
  confidence: number; sourceQuote: string; meetingId: string; blockerId?: string;
}
export interface Decision { id: string; statement: string; confidence: number; sourceQuote: string; meetingId: string; }
export interface Blocker { id: string; description: string; ownerId: string | null; actionItemId: string; }
