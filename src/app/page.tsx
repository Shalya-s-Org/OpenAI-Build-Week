import { MeetingIntelligence } from "@/components/meeting-intelligence";
import { MomentumDashboard } from "@/components/momentum-dashboard";
import { workspaceMembers } from "@/lib/demo-data";

export default function Home() {
  return <main className="app-shell"><header className="topbar"><a className="brand" href="#overview" aria-label="Meeting-to-Momentum home"><span className="brand-mark" aria-hidden="true">→</span><span>Meeting-to-Momentum</span></a><a className="primary-button" href="#meeting-intelligence">New meeting <span aria-hidden="true">→</span></a></header><section className="page-intro" id="overview" aria-labelledby="page-title"><div><p className="eyebrow">Workspace overview</p><h1 id="page-title">Clarity after the meeting.</h1><p className="intro-copy">Move decisions forward with an accountable, visible next step for every conversation.</p></div><div className="member-stack" aria-label="Meeting attendees">{workspaceMembers.map((member) => <span className="avatar" key={member.id} title={member.name}>{member.initials}</span>)}</div></section><MeetingIntelligence /><MomentumDashboard /></main>;
}
