import type { ExtractionAction, ExtractionBlocker, ExtractionDecision, MeetingExtraction } from "@/lib/types";

const MAX_TRANSCRIPT_LENGTH = 20_000;

export class ExtractionInputError extends Error {}

function cleanLine(line: string) {
  return line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim();
}

function stableId(prefix: string, index: number) {
  return `${prefix}-${index + 1}`;
}

function valueAfterLabel(line: string, label: string) {
  return cleanLine(line).replace(new RegExp(`^(?:${label})\\s*:?\\s*`, "i"), "").trim();
}

function parseAction(line: string, index: number): ExtractionAction | null {
  const value = valueAfterLabel(line, "action(?: item)?|next step|todo");
  if (value === cleanLine(line) || !value) return null;

  const ownerMatch = value.match(/(?:owner|assigned to)\s*[:=-]?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
  const dueMatch = value.match(/(?:due|by)\s*[:=-]?\s*((?:today|tomorrow|(?:mon|tues|wednes|thurs|fri|satur|sun)day)|\d{4}-\d{2}-\d{2})/i);
  const title = value
    .replace(/\s*[—–-]?\s*(?:owner|assigned to)\s*[:=-]?.*$/i, "")
    .replace(/\s*[—–-]?\s*(?:due|by)\s*[:=-]?.*$/i, "")
    .trim();

  return { id: stableId("action", index), title, owner: ownerMatch?.[1] ?? null, dueDate: dueMatch?.[1] ?? null, confidence: ownerMatch || dueMatch ? 0.94 : 0.88, sourceQuote: line.trim() };
}

function parseDecision(line: string, index: number): ExtractionDecision | null {
  const value = valueAfterLabel(line, "decision|decided|agreement");
  if (value === cleanLine(line) || !value) return null;
  return { id: stableId("decision", index), statement: value, confidence: 0.95, sourceQuote: line.trim() };
}

function parseBlocker(line: string, index: number): ExtractionBlocker | null {
  const value = valueAfterLabel(line, "blocker|risk|dependency");
  if (value === cleanLine(line) || !value) return null;
  const ownerMatch = value.match(/(?:owner|waiting on)\s*[:=-]?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
  const description = value.replace(/\s*[—–-]?\s*(?:owner|waiting on)\s*[:=-]?.*$/i, "").trim();
  return { id: stableId("blocker", index), description, owner: ownerMatch?.[1] ?? null, confidence: ownerMatch ? 0.93 : 0.88, sourceQuote: line.trim() };
}

export function extractMeeting(title: string, transcript: string): MeetingExtraction {
  const meetingTitle = title.trim() || "Untitled meeting";
  const normalizedTranscript = transcript.trim();
  if (!normalizedTranscript) throw new ExtractionInputError("Paste notes or upload a transcript before extracting momentum.");
  if (normalizedTranscript.length > MAX_TRANSCRIPT_LENGTH) throw new ExtractionInputError("Transcripts are limited to 20,000 characters for this prototype.");

  const lines = normalizedTranscript.split(/\r?\n/).map(cleanLine).filter(Boolean);
  const actions = lines.map(parseAction).filter((item): item is ExtractionAction => item !== null);
  const decisions = lines.map(parseDecision).filter((item): item is ExtractionDecision => item !== null);
  const blockers = lines.map(parseBlocker).filter((item): item is ExtractionBlocker => item !== null);
  const highlights = lines.filter((line) => /\b(action|decision|blocker|risk|dependency|next step|todo)\b/i.test(line));
  const summarySource = highlights.length ? highlights : lines;

  return {
    id: `extraction-${Date.now()}`,
    meetingTitle,
    transcript: normalizedTranscript,
    summary: summarySource.slice(0, 2).join(" ").slice(0, 280),
    actions,
    decisions,
    blockers,
    createdAt: new Date().toISOString(),
  };
}
