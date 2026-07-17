import { MeetingIntelligence } from "@/components/meeting-intelligence";
import { MomentumDashboard } from "@/components/momentum-dashboard";
import { FollowUps } from "@/components/follow-ups";
import { workspaceMembers } from "@/lib/demo-data";
import { MomentumProvider } from "@/lib/MomentumContext";

export default function Home() {
  return (
    <MomentumProvider>
      <main className="app-shell">
        <header className="topbar">
          <a className="brand" href="#overview" aria-label="Meeting-to-Momentum home">
            <span className="brand-mark" aria-hidden="true">→</span>
            <span>Meeting-to-Momentum</span>
          </a>
          <a className="primary-button" href="#meeting-intelligence">New meeting <span aria-hidden="true">→</span></a>
        </header>
        <section className="page-intro" id="overview" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">Workspace overview</p>
            <h1 id="page-title">Clarity after the meeting.</h1>
            <p className="intro-copy">Move decisions forward with an accountable, visible next step for every conversation.</p>
          </div>
          <div className="member-stack" aria-label="Meeting attendees">
            {workspaceMembers.map((member) => (
              <span className="avatar" key={member.id} title={member.name}>{member.initials}</span>
            ))}
          </div>
        </section>
        <MeetingIntelligence />
        <FollowUps />
        <MomentumDashboard />
      </main>
    </MomentumProvider>
  );
}

