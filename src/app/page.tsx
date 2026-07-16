import { demoActions, demoBlockers, demoDecisions, demoMeeting, workspaceMembers } from "@/lib/demo-data";
import { MeetingIntelligence } from "@/components/meeting-intelligence";

const statusLabel = { not_started: "Not started", in_progress: "In progress", blocked: "Blocked", complete: "Complete" } as const;

export default function Home() {
  const ownerFor = (ownerId: string | null) => workspaceMembers.find((member) => member.id === ownerId);

  return <main className="app-shell">
    <header className="topbar">
      <a className="brand" href="#overview" aria-label="Meeting-to-Momentum home"><span className="brand-mark" aria-hidden="true">→</span><span>Meeting-to-Momentum</span></a>
      <a className="primary-button" href="#meeting-intelligence">New meeting <span aria-hidden="true">→</span></a>
    </header>

    <section className="page-intro" id="overview" aria-labelledby="page-title">
      <div><p className="eyebrow">Workspace overview</p><h1 id="page-title">Clarity after the meeting.</h1><p className="intro-copy">Move decisions forward with an accountable, visible next step for every conversation.</p></div>
      <div className="member-stack" aria-label="Meeting attendees">{workspaceMembers.map((member) => <span className="avatar" key={member.id} title={member.name}>{member.initials}</span>)}</div>
    </section>

    <MeetingIntelligence />

    <section className="metric-grid" aria-label="Momentum summary">
      <article className="metric-card"><p className="eyebrow">Open actions</p><strong>{demoActions.length}</strong><span>Across 1 active meeting</span></article>
      <article className="metric-card"><p className="eyebrow">Needs attention</p><strong>{demoActions.filter((action) => action.status === "blocked").length}</strong><span>Blocker to resolve today</span></article>
      <article className="metric-card"><p className="eyebrow">Decisions logged</p><strong>{demoDecisions.length}</strong><span>Clear, searchable record</span></article>
    </section>

    <section className="dashboard-grid" aria-label="Meeting momentum">
      <article className="momentum-card">
        <div className="card-heading"><div><p className="eyebrow">Latest meeting</p><h2>{demoMeeting.title}</h2></div><span className="status-chip">In progress</span></div>
        <p className="meeting-meta">Today · 3 attendees · Notes imported</p><div className="list-divider" />
        <ul className="action-list">{demoActions.map((action) => {
          const owner = ownerFor(action.ownerId);
          return <li className="action-row" key={action.id}>
            <span className={`checkbox checkbox-${action.status}`} aria-hidden="true" />
            <div className="action-copy"><strong>{action.title}</strong><span>{owner?.name ?? "Unassigned"} · {action.dueDate ?? "No due date"}</span></div>
            <span className={`action-status ${action.status}`}>{statusLabel[action.status]}</span>
            <button className="next-action" type="button" aria-label={`Open ${action.title}`}>→</button>
          </li>;
        })}</ul>
        <button className="ghost-button" type="button">Review meeting <span aria-hidden="true">→</span></button>
      </article>

      <aside className="side-stack">
        <article className="panel-card"><p className="eyebrow">Blocker</p><h2>{demoBlockers[0].description}</h2><p>Impacts: {demoActions.find((action) => action.id === demoBlockers[0].actionItemId)?.title}</p><button className="text-button" type="button">Prepare follow-up <span aria-hidden="true">→</span></button></article>
        <article className="panel-card decision-card"><p className="eyebrow">Decision logged</p><h2>{demoDecisions[0].statement}</h2><a href="#overview">View decision record <span aria-hidden="true">→</span></a></article>
      </aside>
    </section>
  </main>;
}
