"use client";

import { useMemo, useState } from "react";
import type { ActionStatus } from "@/lib/types";
import { useMomentum } from "@/lib/MomentumContext";

const statuses: { value: "all" | ActionStatus; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "blocked", label: "Blocked" },
  { value: "complete", label: "Complete" },
];

const labelFor: Record<ActionStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  blocked: "Blocked",
  complete: "Complete",
};

export function MomentumDashboard() {
  const { actions, decisions, blockers, members } = useMomentum();
  const [view, setView] = useState<"workspace" | "mine">("workspace");
  const [owner, setOwner] = useState("all");
  const [status, setStatus] = useState<"all" | ActionStatus>("all");
  const [due, setDue] = useState<"all" | "overdue" | "this_week">("all");

  const filtered = useMemo(() => {
    return actions.filter((action) => {
      const ownerMatches = view === "mine" ? action.ownerId === "member-maya" : owner === "all" || action.ownerId === owner;
      const statusMatches = status === "all" || action.status === status;
      const dueMatches =
        due === "all" ||
        (due === "overdue" && action.dueDate === "2026-07-16") ||
        (due === "this_week" && action.dueDate !== null);
      return ownerMatches && statusMatches && dueMatches;
    });
  }, [due, owner, status, view, actions]);

  const ownerFor = (id: string | null) => members.find((member) => member.id === id);
  const overdue = actions.filter((action) => action.dueDate === "2026-07-16" && action.status !== "complete").length;

  return (
    <section className="dashboard-section" aria-labelledby="momentum-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Momentum dashboard</p>
          <h2 id="momentum-title">The work that moves next.</h2>
        </div>
        <div className="view-toggle" role="group" aria-label="Dashboard view">
          <button
            type="button"
            className={view === "workspace" ? "active" : ""}
            onClick={() => setView("workspace")}
          >
            Workspace
          </button>
          <button
            type="button"
            className={view === "mine" ? "active" : ""}
            onClick={() => setView("mine")}
          >
            Mine
          </button>
        </div>
      </div>
      <div className="metric-grid">
        <article className="metric-card">
          <p className="eyebrow">Open actions</p>
          <strong>{actions.filter((action) => action.status !== "complete").length}</strong>
          <span>Across the active workspace</span>
        </article>
        <article className="metric-card">
          <p className="eyebrow">Overdue</p>
          <strong>{overdue}</strong>
          <span>Needs attention today</span>
        </article>
        <article className="metric-card">
          <p className="eyebrow">Decisions logged</p>
          <strong>{decisions.length}</strong>
          <span>Clear, searchable record</span>
        </article>
      </div>
      <div className="dashboard-filters">
        <label>
          Owner
          <select
            aria-label="Filter by owner"
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
            disabled={view === "mine"}
          >
            <option value="all">All owners</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select
            aria-label="Filter by status"
            value={status}
            onChange={(event) => setStatus(event.target.value as "all" | ActionStatus)}
          >
            {statuses.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Due
          <select
            aria-label="Filter by due date"
            value={due}
            onChange={(event) => setDue(event.target.value as "all" | "overdue" | "this_week")}
          >
            <option value="all">Any date</option>
            <option value="overdue">Overdue</option>
            <option value="this_week">This week</option>
          </select>
        </label>
      </div>
      <div className="dashboard-grid">
        <article className="momentum-card">
          <div className="card-heading">
            <div>
              <p className="eyebrow">{view === "mine" ? "My next actions" : "Active work"}</p>
              <h2>
                {filtered.length} matching item{filtered.length === 1 ? "" : "s"}
              </h2>
            </div>
            <span className="status-chip">Live view</span>
          </div>
          <ul className="action-list">
            {filtered.map((action) => (
              <li className="action-row" key={action.id}>
                <span className={`checkbox checkbox-${action.status}`} aria-hidden="true" />
                <div className="action-copy">
                  <strong>{action.title}</strong>
                  <span>
                    {ownerFor(action.ownerId)?.name ?? "Unassigned"} · {action.dueDate ?? "No due date"}
                  </span>
                </div>
                <span className={`action-status ${action.status}`}>{labelFor[action.status]}</span>
              </li>
            ))}
          </ul>
          {filtered.length === 0 && <p className="no-items">No actions match these filters.</p>}
        </article>
        <aside className="side-stack">
          <article className="panel-card">
            <p className="eyebrow">Overdue signal</p>
            <h2>
              {actions.find((action) => action.dueDate === "2026-07-16" && action.status !== "complete")?.title ||
                actions.find((action) => action.dueDate === "2026-07-16")?.title ||
                "No overdue actions"}
            </h2>
            <p>Due today and currently blocked.</p>
            <button
              className="text-button"
              type="button"
              onClick={() => {
                setDue("overdue");
                setStatus("blocked");
              }}
            >
              Focus blocked work →
            </button>
          </article>
          <article className="panel-card decision-card">
            <p className="eyebrow">Dependency</p>
            <h2>{blockers[0]?.description || "No active blockers"}</h2>
            <p>Impacts an active delivery task.</p>
          </article>
        </aside>
      </div>
    </section>
  );
}
