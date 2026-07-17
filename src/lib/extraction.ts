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

  return {
    id: stableId("action", index),
    title,
    owner: ownerMatch?.[1] ?? null,
    dueDate: dueMatch?.[1] ?? null,
    confidence: ownerMatch || dueMatch ? 0.94 : 0.88,
    sourceQuote: line.trim(),
  };
}

function parseDecision(line: string, index: number): ExtractionDecision | null {
  const value = valueAfterLabel(line, "decision|decided|agreement");
  if (value === cleanLine(line) || !value) return null;
  return {
    id: stableId("decision", index),
    statement: value,
    confidence: 0.95,
    sourceQuote: line.trim(),
  };
}

function parseBlocker(line: string, index: number): ExtractionBlocker | null {
  const value = valueAfterLabel(line, "blocker|risk|dependency");
  if (value === cleanLine(line) || !value) return null;
  const ownerMatch = value.match(/(?:owner|waiting on)\s*[:=-]?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
  const description = value.replace(/\s*[—–-]?\s*(?:owner|waiting on)\s*[:=-]?.*$/i, "").trim();
  return {
    id: stableId("blocker", index),
    description,
    owner: ownerMatch?.[1] ?? null,
    confidence: ownerMatch ? 0.93 : 0.88,
    sourceQuote: line.trim(),
  };
}

function extractMeetingLocal(title: string, transcript: string) {
  const lines = transcript.split(/\r?\n/).map(cleanLine).filter(Boolean);
  const actions = lines.map(parseAction).filter((item): item is ExtractionAction => item !== null);
  const decisions = lines.map(parseDecision).filter((item): item is ExtractionDecision => item !== null);
  const blockers = lines.map(parseBlocker).filter((item): item is ExtractionBlocker => item !== null);
  const highlights = lines.filter((line) => /\b(action|decision|blocker|risk|dependency|next step|todo)\b/i.test(line));
  const summarySource = highlights.length ? highlights : lines;

  return {
    summary: summarySource.slice(0, 2).join(" ").slice(0, 280),
    actions,
    decisions,
    blockers,
  };
}

async function extractWithOpenAI(apiKey: string, title: string, transcript: string) {
  const prompt = `You are an expert project manager. You extract structured meeting outcomes (decisions, actions, and blockers) from a meeting transcript.
Meeting Title: "${title}"
Transcript:
"""
${transcript}
"""

Please extract:
1. A brief summary (1-2 sentences).
2. Action items: description, owner name (or null), due date (e.g. YYYY-MM-DD or relative terms like "tomorrow", or null), confidence score (0.0 to 1.0), and the exact supporting source quote from the transcript.
3. Decisions: statement, confidence score (0.0 to 1.0), and the exact supporting source quote.
4. Blockers & dependencies: description, owner/waiting on (or null), confidence score (0.0 to 1.0), the exact supporting source quote, and the ID of the action item it blocks (actionId like "action-1", "action-2", etc.).

Return the response strictly as a JSON object matching this schema:
{
  "summary": string,
  "actions": [
    {
      "id": "action-1", // stable incrementing ids: action-1, action-2...
      "title": string,
      "owner": string | null,
      "dueDate": string | null,
      "confidence": number,
      "sourceQuote": string
    }
  ],
  "decisions": [
    {
      "id": "decision-1", // stable ids: decision-1, decision-2...
      "statement": string,
      "confidence": number,
      "sourceQuote": string
    }
  ],
  "blockers": [
    {
      "id": "blocker-1", // stable ids: blocker-1, blocker-2...
      "description": string,
      "owner": string | null,
      "confidence": number,
      "sourceQuote": string,
      "actionId": string | null // the ID of the action item from above that this blocks
    }
  ]
}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API call failed: ${err}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from OpenAI");

  return JSON.parse(content);
}

async function extractWithGemini(apiKey: string, title: string, transcript: string) {
  const prompt = `You are an expert project manager. You extract structured meeting outcomes (decisions, actions, and blockers) from a meeting transcript.
Meeting Title: "${title}"
Transcript:
"""
${transcript}
"""

Extract:
1. A brief summary (1-2 sentences).
2. Action items: description, owner name (or null), due date (e.g. YYYY-MM-DD or relative terms like "tomorrow", or null), confidence score (0.0 to 1.0), and the exact supporting source quote from the transcript.
3. Decisions: statement, confidence score (0.0 to 1.0), and the exact supporting source quote.
4. Blockers & dependencies: description, owner/waiting on (or null), confidence score (0.0 to 1.0), the exact supporting source quote, and the ID of the action item it blocks (actionId like "action-1", "action-2", etc.).

Return the response strictly as a JSON object matching this schema:
{
  "summary": string,
  "actions": [
    {
      "id": "action-1", // stable incrementing ids: action-1, action-2...
      "title": string,
      "owner": string | null,
      "dueDate": string | null,
      "confidence": number,
      "sourceQuote": string
    }
  ],
  "decisions": [
    {
      "id": "decision-1", // stable ids: decision-1, decision-2...
      "statement": string,
      "confidence": number,
      "sourceQuote": string
    }
  ],
  "blockers": [
    {
      "id": "blocker-1", // stable ids: blocker-1, blocker-2...
      "description": string,
      "owner": string | null,
      "confidence": number,
      "sourceQuote": string,
      "actionId": string | null // the ID of the action item from above that this blocks
    }
  ]
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API call failed: ${err}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response from Gemini");

  return JSON.parse(text);
}

export async function extractMeeting(title: string, transcript: string): Promise<MeetingExtraction> {
  const meetingTitle = title.trim() || "Untitled meeting";
  const normalizedTranscript = transcript.trim();
  if (!normalizedTranscript) {
    throw new ExtractionInputError("Paste notes or upload a transcript before extracting momentum.");
  }
  if (normalizedTranscript.length > MAX_TRANSCRIPT_LENGTH) {
    throw new ExtractionInputError("Transcripts are limited to 20,000 characters for this prototype.");
  }

  const openAiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  let extractionData: {
    summary: string;
    actions: ExtractionAction[];
    decisions: ExtractionDecision[];
    blockers: any[];
  };

  if (openAiKey) {
    try {
      extractionData = await extractWithOpenAI(openAiKey, meetingTitle, normalizedTranscript);
    } catch (err) {
      console.warn("OpenAI extraction failed, falling back to local regex:", err);
      extractionData = extractMeetingLocal(meetingTitle, normalizedTranscript);
    }
  } else if (geminiKey) {
    try {
      extractionData = await extractWithGemini(geminiKey, meetingTitle, normalizedTranscript);
    } catch (err) {
      console.warn("Gemini extraction failed, falling back to local regex:", err);
      extractionData = extractMeetingLocal(meetingTitle, normalizedTranscript);
    }
  } else {
    console.log("No API key configured. Running local regex extraction.");
    extractionData = extractMeetingLocal(meetingTitle, normalizedTranscript);
  }

  return {
    id: `extraction-${Date.now()}`,
    meetingTitle,
    transcript: normalizedTranscript,
    summary: extractionData.summary,
    actions: extractionData.actions,
    decisions: extractionData.decisions,
    blockers: extractionData.blockers.map((b: any) => ({
      id: b.id,
      description: b.description,
      owner: b.owner,
      confidence: b.confidence ?? 0.9,
      sourceQuote: b.sourceQuote ?? "",
      actionId: b.actionId || undefined,
    })),
    createdAt: new Date().toISOString(),
  };
}
