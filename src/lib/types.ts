export type ActionStatus = "not_started" | "in_progress" | "blocked" | "complete";

export interface WorkspaceMember { id: string; name: string; initials: string; role: string; }
export interface Meeting { id: string; title: string; occurredAt: string; attendees: string[]; source: "notes" | "upload" | "integration"; }
export interface ActionItem {
  id: string; title: string; ownerId: string | null; dueDate: string | null; status: ActionStatus;
  confidence: number; sourceQuote: string; meetingId: string; blockerId?: string;
}
export interface Decision { id: string; statement: string; confidence: number; sourceQuote: string; meetingId: string; }
export interface Blocker { id: string; description: string; ownerId: string | null; actionItemId: string; }

export interface ExtractionAction {
  id: string;
  title: string;
  owner: string | null;
  dueDate: string | null;
  confidence: number;
  sourceQuote: string;
}

export interface ExtractionDecision {
  id: string;
  statement: string;
  confidence: number;
  sourceQuote: string;
}

export interface ExtractionBlocker {
  id: string;
  description: string;
  owner: string | null;
  confidence: number;
  sourceQuote: string;
}

export interface MeetingExtraction {
  id: string;
  meetingTitle: string;
  transcript: string;
  summary: string;
  actions: ExtractionAction[];
  decisions: ExtractionDecision[];
  blockers: ExtractionBlocker[];
  createdAt: string;
}
