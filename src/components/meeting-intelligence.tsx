"use client";

import { ChangeEvent, FormEvent, useState, useSyncExternalStore } from "react";
import type { MeetingExtraction } from "@/lib/types";

const STORAGE_KEY = "meeting-to-momentum:last-extraction";
const SAMPLE_TRANSCRIPT = `Decision: Keep the launch scope focused on the core review workflow.
Action: Confirm onboarding email sequence — Owner: Maya Chen — Due: tomorrow
Action: Validate API rate-limit behavior — Owner: Aarav Patel — Due: today
Blocker: Staging credentials are still awaiting approval — Waiting on: Maya Chen`;
let cachedSavedValue: string | null | undefined;
let cachedSavedExtraction: MeetingExtraction | null = null;

function subscribeToSavedExtraction(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function readSavedExtraction() {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === cachedSavedValue) return cachedSavedExtraction;
  cachedSavedValue = saved;
  if (!saved) return (cachedSavedExtraction = null);
  try { return (cachedSavedExtraction = JSON.parse(saved) as MeetingExtraction); } catch { return (cachedSavedExtraction = null); }
}

export function MeetingIntelligence() {
  const [title, setTitle] = useState("Launch readiness");
  const [transcript, setTranscript] = useState(SAMPLE_TRANSCRIPT);
  const [result, setResult] = useState<MeetingExtraction | null>(null);
  const [error, setError] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const savedResult = useSyncExternalStore(subscribeToSavedExtraction, readSavedExtraction, () => null);
  const extraction = result ?? savedResult;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsExtracting(true);
    try {
      const response = await fetch("/api/extract", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, transcript }) });
      const payload: MeetingExtraction | { error: string } = await response.json();
      if (!response.ok || "error" in payload) throw new Error("error" in payload ? payload.error : "Extraction failed.");
      setResult(payload);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Extraction failed.");
    } finally { setIsExtracting(false); }
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("text/") && !file.name.endsWith(".md")) { setError("Upload a plain-text or Markdown transcript."); return; }
    if (file.size > 20_000) { setError("Transcripts are limited to 20,000 characters for this prototype."); return; }
    setTranscript(await file.text());
    setError("");
  }

  return <section className="intelligence-section" id="meeting-intelligence" aria-labelledby="intelligence-title">
    <div className="section-heading"><div><p className="eyebrow">Meeting intelligence</p><h2 id="intelligence-title">Turn notes into momentum.</h2></div><span className="status-chip">Traceable extraction</span></div>
    <div className="intelligence-grid">
      <form className="ingestion-form" onSubmit={handleSubmit}>
        <label htmlFor="meeting-title">Meeting title</label>
        <input id="meeting-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} />
        <div className="transcript-label"><label htmlFor="transcript">Transcript or notes</label><label className="file-trigger" htmlFor="transcript-file">Upload .txt or .md<input id="transcript-file" type="file" accept="text/plain,text/markdown,.txt,.md" onChange={handleFile} /></label></div>
        <textarea id="transcript" value={transcript} onChange={(event) => setTranscript(event.target.value)} maxLength={20_000} rows={8} aria-describedby="transcript-help" />
        <p className="field-help" id="transcript-help">Use Decision, Action, and Blocker labels for the most reliable prototype extraction.</p>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button" type="submit" disabled={isExtracting}>{isExtracting ? "Extracting…" : "Extract momentum"} <span aria-hidden="true">→</span></button>
      </form>

      <article className="extraction-card" aria-live="polite">
        {!extraction ? <div className="empty-extraction"><p className="eyebrow">Ready to review</p><h3>Your extracted decisions, actions, and blockers will appear here.</h3><p>Every item includes the exact supporting quote and a confidence score.</p></div> : <ExtractionReview result={extraction} />}
      </article>
    </div>
  </section>;
}

function ExtractionReview({ result }: { result: MeetingExtraction }) {
  return <>
    <div className="review-heading"><div><p className="eyebrow">Extraction complete</p><h3>{result.meetingTitle}</h3></div><span className="save-indicator">Saved locally</span></div>
    <p className="review-summary">{result.summary}</p>
    <ExtractionGroup title="Actions" items={result.actions.map((item) => ({ id: item.id, value: item.title, metadata: [item.owner, item.dueDate].filter(Boolean).join(" · "), confidence: item.confidence, quote: item.sourceQuote }))} />
    <ExtractionGroup title="Decisions" items={result.decisions.map((item) => ({ id: item.id, value: item.statement, metadata: "", confidence: item.confidence, quote: item.sourceQuote }))} />
    <ExtractionGroup title="Blockers" items={result.blockers.map((item) => ({ id: item.id, value: item.description, metadata: item.owner ? `Waiting on ${item.owner}` : "", confidence: item.confidence, quote: item.sourceQuote }))} />
  </>;
}

type ReviewItem = { id: string; value: string; metadata: string; confidence: number; quote: string };
function ExtractionGroup({ title, items }: { title: string; items: ReviewItem[] }) {
  return <section className="extraction-group"><div className="group-title"><h4>{title}</h4><span>{items.length}</span></div>{items.length === 0 ? <p className="no-items">None identified</p> : <ul>{items.map((item) => <li key={item.id}><div><strong>{item.value}</strong>{item.metadata && <span>{item.metadata}</span>}</div><span className="confidence">{Math.round(item.confidence * 100)}%</span><blockquote>{item.quote}</blockquote></li>)}</ul>}</section>;
}
