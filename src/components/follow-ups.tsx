"use client";

import React, { useState, useEffect } from "react";
import { useMomentum } from "@/lib/MomentumContext";
import type { ActionItem } from "@/lib/types";

type Tone = "professional" | "friendly" | "urgent";

export function FollowUps() {
  const { actions, blockers, members } = useMomentum();
  const [selectedActionId, setSelectedActionId] = useState<string>("");
  const [tone, setTone] = useState<Tone>("friendly");
  const [draftText, setDraftText] = useState("");
  const [copiedActionIds, setCopiedActionIds] = useState<Record<string, boolean>>({});
  const [isEditing, setIsEditing] = useState(false);

  // Filter actions that are not complete and have an owner
  const actionableItems = actions.filter((action) => action.status !== "complete" && action.ownerId);

  // Automatically select the first action item if none is selected
  useEffect(() => {
    if (actionableItems.length > 0 && !selectedActionId) {
      setTimeout(() => {
        setSelectedActionId(actionableItems[0].id);
      }, 0);
    }
  }, [actionableItems, selectedActionId]);

  const selectedAction = actions.find((a) => a.id === selectedActionId);
  const owner = selectedAction ? members.find((m) => m.id === selectedAction.ownerId) : null;
  const blocker = selectedAction
    ? blockers.find((b) => b.actionItemId === selectedAction.id || selectedAction.blockerId === b.id)
    : null;

  // Generate draft when action, tone, or owner change, unless user edited it
  useEffect(() => {
    if (!selectedAction || !owner || isEditing) return;

    const dueText = selectedAction.dueDate ? `by ${selectedAction.dueDate}` : "soon";
    const blockerText = blocker
      ? `\nNote: This is currently blocked by: "${blocker.description}". Let us know how we can help resolve this.`
      : "";

    let text = "";
    if (tone === "friendly") {
      text = `Hi ${owner.name}! Just a friendly check-in on the task: "${selectedAction.title}" (due ${dueText}).${blockerText}\n\nLet me know if you need anything to help move this forward!`;
    } else if (tone === "urgent") {
      text = `Hi ${owner.name},\n\nThis is urgent: The task "${selectedAction.title}" is due ${dueText} and is currently marked as ${selectedAction.status}.${blockerText}\n\nPlease share an update as soon as possible. Thanks!`;
    } else {
      text = `Dear ${owner.name},\n\nThis is a reminder regarding the action item assigned to you: "${selectedAction.title}".\nDue date: ${selectedAction.dueDate || "Not specified"}\nStatus: ${selectedAction.status === "blocked" ? "Blocked" : "In progress"}.${blockerText}\n\nPlease update the task status in the workspace when possible.\n\nBest regards,\nWorkspace Sync`;
    }

    setTimeout(() => {
      setDraftText(text);
    }, 0);
  }, [selectedAction, tone, owner, blocker, isEditing]);

  const handleCopy = async () => {
    if (!selectedActionId) return;
    try {
      await navigator.clipboard.writeText(draftText);
      setCopiedActionIds((prev) => ({ ...prev, [selectedActionId]: true }));
      setTimeout(() => {
        setCopiedActionIds((prev) => ({ ...prev, [selectedActionId]: false }));
      }, 3000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraftText(e.target.value);
    setIsEditing(true);
  };

  const handleActionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedActionId(e.target.value);
    setIsEditing(false);
  };

  const handleToneChange = (newTone: Tone) => {
    setTone(newTone);
    setIsEditing(false);
  };

  return (
    <section className="intelligence-section follow-ups-section" id="meeting-follow-ups" aria-labelledby="followups-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Accountability workflow</p>
          <h2 id="followups-title">Generate follow-up drafts.</h2>
        </div>
        <span className="status-chip">Actionable reminders</span>
      </div>

      <div className="intelligence-grid">
        <div className="ingestion-form">
          <label htmlFor="follow-up-action">Select action item</label>
          <select
            id="follow-up-action"
            value={selectedActionId}
            onChange={handleActionChange}
            style={{
              width: "100%",
              minHeight: "40px",
              border: "1px solid var(--outline-variant)",
              borderRadius: "4px",
              background: "#fff",
              color: "var(--on-surface)",
              padding: "8px",
              margin: "4px 0 20px",
              font: "14px/20px Inter,Arial,sans-serif",
            }}
          >
            {actionableItems.length === 0 && <option value="">No open tasks with owners</option>}
            {actionableItems.map((action) => {
              const actionOwner = members.find((m) => m.id === action.ownerId);
              return (
                <option key={action.id} value={action.id}>
                  {action.title} ({actionOwner?.name || "Unassigned"})
                </option>
              );
            })}
          </select>

          <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, fontSize: "14px" }}>Tone template</label>
          <div className="view-toggle" style={{ display: "inline-flex", marginBottom: "20px" }}>
            <button
              type="button"
              className={tone === "friendly" ? "active" : ""}
              onClick={() => handleToneChange("friendly")}
            >
              Friendly
            </button>
            <button
              type="button"
              className={tone === "professional" ? "active" : ""}
              onClick={() => handleToneChange("professional")}
            >
              Professional
            </button>
            <button
              type="button"
              className={tone === "urgent" ? "active" : ""}
              onClick={() => handleToneChange("urgent")}
            >
              Urgent
            </button>
          </div>

          <button
            className="primary-button"
            type="button"
            onClick={handleCopy}
            disabled={!selectedActionId}
            style={{ width: "100%", marginTop: "12px" }}
          >
            {copiedActionIds[selectedActionId] ? "Copied to clipboard! ✓" : "Copy reminder draft →"}
          </button>
        </div>

        <article className="extraction-card" style={{ display: "flex", flexDirection: "column" }}>
          <div className="review-heading" style={{ marginBottom: "12px" }}>
            <div>
              <p className="eyebrow">Reminders draft preview</p>
              <h3>For {owner?.name || "Unassigned"}</h3>
            </div>
            {copiedActionIds[selectedActionId] && (
              <span className="save-indicator" style={{ background: "var(--secondary-bright)", color: "var(--secondary)" }}>
                Copied
              </span>
            )}
          </div>
          <p className="review-summary" style={{ marginTop: 0, marginBottom: "16px" }}>
            The draft is generated dynamically based on ownership, blockers, and selected tone. Feel free to edit below.
          </p>

          <textarea
            value={draftText}
            onChange={handleTextChange}
            placeholder="No draft preview available. Select an action item with an owner to generate a reminder."
            disabled={!selectedActionId}
            rows={8}
            style={{
              width: "100%",
              flexGrow: 1,
              padding: "12px",
              border: "1px solid var(--outline-variant)",
              borderRadius: "4px",
              background: "var(--surface-container-low)",
              color: "var(--on-surface)",
              fontFamily: "Inter,Arial,sans-serif",
              fontSize: "14px",
              lineHeight: "20px",
              resize: "none",
              outline: "none",
            }}
          />
        </article>
      </div>
    </section>
  );
}
