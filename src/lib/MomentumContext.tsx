"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ActionItem, Blocker, Decision, MeetingExtraction, WorkspaceMember } from "./types";

interface MomentumContextType {
  activeExtraction: MeetingExtraction | null;
  actions: ActionItem[];
  decisions: Decision[];
  blockers: Blocker[];
  members: WorkspaceMember[];
  updateActiveExtraction: (extraction: MeetingExtraction | null) => void;
  updateActionInExtraction: (actionId: string, updates: any) => void;
  updateDecisionInExtraction: (decisionId: string, statement: string) => void;
  updateBlockerInExtraction: (blockerId: string, updates: any) => void;
}

const MomentumContext = createContext<MomentumContextType | undefined>(undefined);

const STORAGE_KEY = "meeting-to-momentum:last-extraction";

export function MomentumProvider({ children }: { children: React.ReactNode }) {
  const [activeExtraction, setActiveExtraction] = useState<MeetingExtraction | null>(null);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [blockers, setBlockers] = useState<Blocker[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);

  // Function to load all workspace data from SQLite database via API
  const refreshData = useCallback(async () => {
    try {
      const res = await fetch("/api/workspace-data");
      if (!res.ok) throw new Error("Failed to fetch workspace data");
      
      const payload: {
        actions: ActionItem[];
        decisions: Decision[];
        blockers: Blocker[];
        members: WorkspaceMember[];
      } = await res.json();

      setActions(payload.actions);
      setDecisions(payload.decisions);
      setBlockers(payload.blockers);
      setMembers(payload.members);
    } catch (e) {
      console.error("Error refreshing workspace data from DB:", e);
    }
  }, []);

  // On mount: load active extraction from local storage and load workspace data from DB
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as MeetingExtraction;
          setTimeout(() => {
            setActiveExtraction(parsed);
          }, 0);
        } catch (e) {
          console.error("Failed to parse saved extraction", e);
        }
      }
    }

    setTimeout(() => {
      refreshData();
    }, 0);
  }, [refreshData]);

  const updateActiveExtraction = (extraction: MeetingExtraction | null) => {
    setActiveExtraction(extraction);
    if (typeof window !== "undefined") {
      if (extraction) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(extraction));
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    // Refresh DB data since a new extraction saves meeting, actions, etc. to DB
    refreshData();
  };

  const updateActionInExtraction = async (actionId: string, updates: any) => {
    if (!activeExtraction) return;

    // 1. Optimistically update local activeExtraction state
    const updatedActions = activeExtraction.actions.map((act) => {
      if (act.id === actionId) {
        let ownerName = act.owner;
        if (updates.owner !== undefined) {
          ownerName = updates.owner;
        } else if (updates.ownerId !== undefined) {
          const member = members.find((m) => m.id === updates.ownerId);
          ownerName = member ? member.name : null;
        }

        return {
          ...act,
          title: updates.title !== undefined ? updates.title : act.title,
          owner: ownerName,
          dueDate: updates.dueDate !== undefined ? updates.dueDate : act.dueDate,
          status: updates.status !== undefined ? updates.status : act.status,
        };
      }
      return act;
    });

    const nextExtraction = {
      ...activeExtraction,
      actions: updatedActions,
    };

    setActiveExtraction(nextExtraction);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextExtraction));
    }

    // 2. Perform database mutation
    try {
      const res = await fetch("/api/workspace-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "action",
          id: actionId,
          updates,
        }),
      });
      if (!res.ok) throw new Error("Mutation failed");
    } catch (err) {
      console.error("Error mutating action item on server:", err);
    }

    // 3. Sync state with DB
    refreshData();
  };

  const updateDecisionInExtraction = async (decisionId: string, statement: string) => {
    if (!activeExtraction) return;

    // 1. Optimistically update local state
    const updatedDecisions = activeExtraction.decisions.map((dec) => {
      if (dec.id === decisionId) {
        return { ...dec, statement };
      }
      return dec;
    });

    const nextExtraction = {
      ...activeExtraction,
      decisions: updatedDecisions,
    };

    setActiveExtraction(nextExtraction);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextExtraction));
    }

    // 2. Perform database mutation
    try {
      const res = await fetch("/api/workspace-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "decision",
          id: decisionId,
          updates: { statement },
        }),
      });
      if (!res.ok) throw new Error("Mutation failed");
    } catch (err) {
      console.error("Error mutating decision on server:", err);
    }

    // 3. Sync state with DB
    refreshData();
  };

  const updateBlockerInExtraction = async (blockerId: string, updates: any) => {
    if (!activeExtraction) return;

    // 1. Optimistically update local state
    const updatedBlockers = activeExtraction.blockers.map((blk) => {
      if (blk.id === blockerId) {
        let ownerName = blk.owner;
        if (updates.owner !== undefined) {
          ownerName = updates.owner;
        } else if (updates.ownerId !== undefined) {
          const member = members.find((m) => m.id === updates.ownerId);
          ownerName = member ? member.name : null;
        }

        return {
          ...blk,
          description: updates.description !== undefined ? updates.description : blk.description,
          owner: ownerName,
          actionId: updates.actionId !== undefined ? updates.actionId : (updates.actionItemId !== undefined ? updates.actionItemId : blk.actionId),
        };
      }
      return blk;
    });

    const nextExtraction = {
      ...activeExtraction,
      blockers: updatedBlockers,
    };

    setActiveExtraction(nextExtraction);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextExtraction));
    }

    // 2. Perform database mutation
    try {
      const res = await fetch("/api/workspace-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "blocker",
          id: blockerId,
          updates,
        }),
      });
      if (!res.ok) throw new Error("Mutation failed");
    } catch (err) {
      console.error("Error mutating blocker on server:", err);
    }

    // 3. Sync state with DB
    refreshData();
  };

  return (
    <MomentumContext.Provider
      value={{
        activeExtraction,
        actions,
        decisions,
        blockers,
        members,
        updateActiveExtraction,
        updateActionInExtraction,
        updateDecisionInExtraction,
        updateBlockerInExtraction,
      }}
    >
      {children}
    </MomentumContext.Provider>
  );
}

export function useMomentum() {
  const context = useContext(MomentumContext);
  if (context === undefined) {
    throw new Error("useMomentum must be used within a MomentumProvider");
  }
  return context;
}
