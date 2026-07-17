"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import type { ActionStatus, MeetingExtraction } from "@/lib/types";
import { useMomentum } from "@/lib/MomentumContext";

const SAMPLE_TRANSCRIPT = `Decision: Keep the launch scope focused on the core review workflow.
Action: Confirm onboarding email sequence — Owner: Maya Chen — Due: tomorrow
Action: Validate API rate-limit behavior — Owner: Aarav Patel — Due: today
Blocker: Staging credentials are still awaiting approval — Waiting on: Maya Chen`;

const TEAM_MEMBERS = ["Maya Chen", "Aarav Patel", "Nora Williams"];
const ACTION_STATUSES: { value: ActionStatus; label: string }[] = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "blocked", label: "Blocked" },
  { value: "complete", label: "Complete" },
];

export function MeetingIntelligence() {
  const [title, setTitle] = useState("Launch readiness");
  const [transcript, setTranscript] = useState(SAMPLE_TRANSCRIPT);
  const { activeExtraction, updateActiveExtraction } = useMomentum();
  const [error, setError] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);

  const extraction = activeExtraction;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsExtracting(true);
    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, transcript }),
      });
      const payload: MeetingExtraction | { error: string } = await response.json();
      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "Extraction failed.");
      }
      updateActiveExtraction(payload);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Extraction failed.");
    } finally {
      setIsExtracting(false);
    }
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("text/") && !file.name.endsWith(".md")) {
      setError("Upload a plain-text or Markdown transcript.");
      return;
    }
    if (file.size > 20_000) {
      setError("Transcripts are limited to 20,000 characters for this prototype.");
      return;
    }
    setTranscript(await file.text());
    setError("");
  }

  return (
    <section className="intelligence-section" id="meeting-intelligence" aria-labelledby="intelligence-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Meeting intelligence</p>
          <h2 id="intelligence-title">Turn notes into momentum.</h2>
        </div>
        <span className="status-chip">Traceable extraction</span>
      </div>
      <div className="intelligence-grid">
        <form className="ingestion-form" onSubmit={handleSubmit}>
          <label htmlFor="meeting-title">Meeting title</label>
          <input
            id="meeting-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
          />
          <div className="transcript-label">
            <label htmlFor="transcript">Transcript or notes</label>
            <label className="file-trigger" htmlFor="transcript-file">
              Upload .txt or .md
              <input
                id="transcript-file"
                type="file"
                accept="text/plain,text/markdown,.txt,.md"
                onChange={handleFile}
              />
            </label>
          </div>
          <textarea
            id="transcript"
            value={transcript}
            onChange={(event) => setTranscript(event.target.value)}
            maxLength={20_000}
            rows={8}
            aria-describedby="transcript-help"
          />
          <p className="field-help" id="transcript-help">
            Use Decision, Action, and Blocker labels for the most reliable prototype extraction.
          </p>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button" type="submit" disabled={isExtracting}>
            {isExtracting ? "Extracting…" : "Extract momentum"} <span aria-hidden="true">→</span>
          </button>
        </form>

        <article className="extraction-card" aria-live="polite">
          {!extraction ? (
            <div className="empty-extraction">
              <p className="eyebrow">Ready to review</p>
              <h3>Your extracted decisions, actions, and blockers will appear here.</h3>
              <p>Every item includes the exact supporting quote and a confidence score.</p>
            </div>
          ) : (
            <ExtractionReview key={extraction.id} result={extraction} />
          )}
        </article>
      </div>
    </section>
  );
}

function ExtractionReview({ result }: { result: MeetingExtraction }) {
  const {
    updateActionInExtraction,
    updateDecisionInExtraction,
    updateBlockerInExtraction,
  } = useMomentum();

  const review = result;

  function updateAction(id: string, updates: any) {
    updateActionInExtraction(id, updates);
  }

  function updateDecision(id: string, statement: string) {
    updateDecisionInExtraction(id, statement);
  }

  function updateBlocker(id: string, updates: any) {
    updateBlockerInExtraction(id, updates);
  }

  return (
    <>
      <div className="review-heading">
        <div>
          <p className="eyebrow">Review before momentum</p>
          <h3>{review.meetingTitle}</h3>
        </div>
        <span className="save-indicator">Saved locally</span>
      </div>
      <p className="review-summary">
        Correct the extraction, set ownership, and connect blockers before sharing the next steps.
      </p>
      <section className="extraction-group">
        <div className="group-title">
          <h4>Actions</h4>
          <span>{review.actions.length}</span>
        </div>
        <ul className="workflow-list">
          {review.actions.map((action) => (
            <li className="workflow-item" key={action.id}>
              <label className="complete-toggle">
                <input
                  type="checkbox"
                  checked={action.status === "complete"}
                  onChange={(event) =>
                    updateAction(action.id, { status: event.target.checked ? "complete" : "not_started" })
                  }
                />
                <span aria-hidden="true" />
              </label>
              <div className="workflow-fields">
                <input
                  aria-label="Action title"
                  value={action.title}
                  onChange={(event) => updateAction(action.id, { title: event.target.value })}
                />
                <div className="workflow-controls">
                  <select
                    aria-label="Action owner"
                    value={action.owner ?? ""}
                    onChange={(event) => updateAction(action.id, { owner: event.target.value || null })}
                  >
                    <option value="">Unassigned</option>
                    {TEAM_MEMBERS.map((member) => (
                      <option key={member} value={member}>
                        {member}
                      </option>
                    ))}
                  </select>
                  <input
                    aria-label="Action due date"
                    value={action.dueDate ?? ""}
                    placeholder="Due date"
                    onChange={(event) => updateAction(action.id, { dueDate: event.target.value || null })}
                  />
                  <select
                    aria-label="Action status"
                    value={action.status}
                    onChange={(event) => updateAction(action.id, { status: event.target.value as ActionStatus })}
                  >
                    {ACTION_STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
                <Evidence quote={action.sourceQuote} confidence={action.confidence} />
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="extraction-group">
        <div className="group-title">
          <h4>Decisions</h4>
          <span>{review.decisions.length}</span>
        </div>
        <ul className="workflow-list">
          {review.decisions.map((decision) => (
            <li className="workflow-item decision-workflow" key={decision.id}>
              <div className="workflow-fields">
                <input
                  aria-label="Decision statement"
                  value={decision.statement}
                  onChange={(event) => updateDecision(decision.id, event.target.value)}
                />
                <Evidence quote={decision.sourceQuote} confidence={decision.confidence} />
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="extraction-group">
        <div className="group-title">
          <h4>Blockers & dependencies</h4>
          <span>{review.blockers.length}</span>
        </div>
        <ul className="workflow-list">
          {review.blockers.map((blocker) => (
            <li className="workflow-item blocker-workflow" key={blocker.id}>
              <div className="workflow-fields">
                <input
                  aria-label="Blocker description"
                  value={blocker.description}
                  onChange={(event) => updateBlocker(blocker.id, { description: event.target.value })}
                />
                <div className="workflow-controls">
                  <select
                    aria-label="Blocker owner"
                    value={blocker.owner ?? ""}
                    onChange={(event) => updateBlocker(blocker.id, { owner: event.target.value || null })}
                  >
                    <option value="">No owner</option>
                    {TEAM_MEMBERS.map((member) => (
                      <option key={member} value={member}>
                        {member}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Impacted action"
                    value={blocker.actionId}
                    onChange={(event) => updateBlocker(blocker.id, { actionId: event.target.value })}
                  >
                    <option value="">Select impacted action</option>
                    {review.actions.map((action) => (
                      <option key={action.id} value={action.id}>
                        {action.title}
                      </option>
                    ))}
                  </select>
                </div>
                <Evidence quote={blocker.sourceQuote} confidence={blocker.confidence} />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function Evidence({ quote, confidence }: { quote: string; confidence: number }) {
  return (
    <div className="evidence">
      <span className="confidence">{Math.round(confidence * 100)}% confidence</span>
      <blockquote>{quote}</blockquote>
    </div>
  );
}
