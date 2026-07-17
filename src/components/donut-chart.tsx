"use client";

import React, { useState } from "react";
import type { ActionItem, ActionStatus } from "@/lib/types";

interface DonutChartProps {
  actions: ActionItem[];
}

interface Segment {
  status: ActionStatus;
  label: string;
  count: number;
  percentage: number;
  color: string;
  strokeDasharray: string;
  strokeDashoffset: number;
}

export function DonutChart({ actions }: DonutChartProps) {
  const [hoveredStatus, setHoveredStatus] = useState<ActionStatus | null>(null);

  const counts: Record<ActionStatus, number> = {
    complete: actions.filter((a) => a.status === "complete").length,
    in_progress: actions.filter((a) => a.status === "in_progress").length,
    blocked: actions.filter((a) => a.status === "blocked").length,
    not_started: actions.filter((a) => a.status === "not_started").length,
  };

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  const statusInfo: Record<ActionStatus, { label: string; color: string }> = {
    complete: { label: "Complete", color: "var(--secondary)" },
    in_progress: { label: "In progress", color: "var(--primary)" },
    blocked: { label: "Blocked", color: "var(--error)" },
    not_started: { label: "Not started", color: "var(--outline, #747688)" },
  };

  const radius = 50;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius; // ~314.16

  let cumulativePercentage = 0;

  const segments: Segment[] = (Object.keys(counts) as ActionStatus[]).map((status) => {
    const count = counts[status];
    const percentage = total > 0 ? count / total : 0;
    const info = statusInfo[status];

    // Calculate stroke properties
    const strokeDasharray = `${percentage * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativePercentage * circumference;

    cumulativePercentage += percentage;

    return {
      status,
      label: info.label,
      count,
      percentage,
      color: info.color,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const activeSegment = hoveredStatus ? segments.find((s) => s.status === hoveredStatus) : null;

  return (
    <article className="panel-card" style={{ display: "flex", flexDirection: "column", padding: "24px" }}>
      <p className="eyebrow" style={{ marginBottom: "16px" }}>Status Distribution</p>
      
      {total === 0 ? (
        <div style={{ display: "grid", height: "180px", placeItems: "center" }}>
          <p className="no-items">No action items to analyze.</p>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          {/* Donut SVG */}
          <div style={{ position: "relative", width: "140px", height: "140px" }}>
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 120 120"
              style={{ transform: "rotate(-90deg)", overflow: "visible" }}
            >
              {/* Underlay base circle */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="transparent"
                stroke="var(--surface-container)"
                strokeWidth={strokeWidth}
              />
              {/* Segments */}
              {segments.map((seg) => {
                if (seg.count === 0) return null;
                const isHovered = hoveredStatus === seg.status;
                return (
                  <circle
                    key={seg.status}
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="transparent"
                    stroke={seg.color}
                    strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                    strokeDasharray={seg.strokeDasharray}
                    strokeDashoffset={seg.strokeDashoffset}
                    style={{
                      transition: "stroke-width 200ms ease, opacity 200ms ease",
                      cursor: "pointer",
                      opacity: hoveredStatus && !isHovered ? 0.6 : 1,
                    }}
                    onMouseEnter={() => setHoveredStatus(seg.status)}
                    onMouseLeave={() => setHoveredStatus(null)}
                  />
                );
              })}
            </svg>
            
            {/* Center Text */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
                textAlign: "center",
              }}
            >
              {activeSegment ? (
                <>
                  <strong style={{ fontSize: "20px", color: activeSegment.color }}>
                    {activeSegment.count}
                  </strong>
                  <span style={{ fontSize: "11px", color: "var(--on-surface-variant)", fontWeight: 600 }}>
                    {Math.round(activeSegment.percentage * 100)}% {activeSegment.label}
                  </span>
                </>
              ) : (
                <>
                  <strong style={{ fontSize: "22px", color: "var(--on-surface)" }}>
                    {total}
                  </strong>
                  <span style={{ fontSize: "11px", color: "var(--on-surface-variant)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Total Tasks
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Interactive Legend */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", flexGrow: 1, minWidth: "120px" }}>
            {segments.map((seg) => (
              <div
                key={seg.status}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  transition: "background 150ms ease",
                  background: hoveredStatus === seg.status ? "var(--surface-container-low)" : "transparent",
                }}
                onMouseEnter={() => setHoveredStatus(seg.status)}
                onMouseLeave={() => setHoveredStatus(null)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: seg.color,
                      display: "inline-block",
                    }}
                  />
                  <span style={{ fontSize: "13px", color: "var(--on-surface-variant)", fontWeight: 500 }}>
                    {seg.label}
                  </span>
                </div>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--on-surface)" }}>
                  {seg.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
