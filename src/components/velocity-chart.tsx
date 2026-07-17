"use client";

import React, { useState } from "react";
import type { ActionItem } from "@/lib/types";

interface VelocityChartProps {
  actions: ActionItem[];
}

export function VelocityChart({ actions }: VelocityChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Generate last 7 days of labels ending at a mock current date of 2026-07-18
  const baseDate = new Date("2026-07-18T12:00:00Z");
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() - (6 - i));
    return d;
  });

  const dateLabels = days.map((d) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  );

  const dateStrings = days.map((d) => d.toISOString().split("T")[0]);

  // Base historical completion data to ensure the chart looks dynamic
  const baseCompletions = [1, 3, 2, 4, 1, 3, 2];

  // Count live completed actions matching each date string
  const liveCompletions = dateStrings.map((dateStr) => {
    return actions.filter(
      (a) => a.status === "complete" && a.dueDate === dateStr
    ).length;
  });

  // Combine historical trend with live user changes
  const dataPoints = baseCompletions.map((base, idx) => base + liveCompletions[idx]);

  // Chart layout dimensions
  const width = 340;
  const height = 140;
  const paddingLeft = 30;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 25;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...dataPoints, 5); // Ensure scale goes to at least 5

  const points = dataPoints.map((val, idx) => {
    const x = paddingLeft + (idx / (dataPoints.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - (val / maxVal) * chartHeight;
    return { x, y, value: val, label: dateLabels[idx] };
  });

  // Calculate smooth horizontal control point bezier curve path
  const getBezierPath = (pts: typeof points): string => {
    if (pts.length === 0) return "";
    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    return path;
  };

  const linePath = getBezierPath(points);
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`
    : "";

  return (
    <article className="panel-card" style={{ display: "flex", flexDirection: "column", padding: "24px", minWidth: "280px" }}>
      <div className="card-heading" style={{ marginBottom: "12px" }}>
        <div>
          <p className="eyebrow">Task Velocity</p>
          <h3 style={{ fontSize: "16px", margin: 0 }}>Completions (7-day trend)</h3>
        </div>
        <span className="save-indicator" style={{ background: "var(--surface-container)", color: "var(--on-surface-variant)" }}>
          Rolling Sync
        </span>
      </div>

      <div style={{ position: "relative", width: "100%", height: `${height}px` }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
          <defs>
            <linearGradient id="velocity-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--secondary)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--secondary)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {Array.from({ length: 4 }).map((_, idx) => {
            const y = paddingTop + (idx / 3) * chartHeight;
            const labelValue = Math.round(maxVal - (idx / 3) * maxVal);
            return (
              <g key={idx} opacity="0.3">
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="var(--outline-variant)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  fill="var(--on-surface-variant)"
                  fontSize="10"
                  textAnchor="end"
                  fontWeight="600"
                >
                  {labelValue}
                </text>
              </g>
            );
          })}

          {/* Shaded Area */}
          {areaPath && <path d={areaPath} fill="url(#velocity-gradient)" />}

          {/* Smooth Trend Line */}
          {linePath && (
            <path
              d={linePath}
              fill="transparent"
              stroke="var(--secondary)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Hover Reference Line */}
          {hoveredIndex !== null && (
            <line
              x1={points[hoveredIndex].x}
              y1={paddingTop}
              x2={points[hoveredIndex].x}
              y2={height - paddingBottom}
              stroke="var(--primary)"
              strokeWidth="1"
              strokeDasharray="2 2"
              opacity="0.7"
            />
          )}

          {/* Data Points */}
          {points.map((pt, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <g key={idx}>
                {/* Invisible hover target */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="14"
                  fill="transparent"
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
                {/* Visible dot */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : 4}
                  fill={isHovered ? "var(--primary)" : "var(--secondary)"}
                  stroke="#fff"
                  strokeWidth="2"
                  style={{ transition: "r 150ms ease" }}
                  pointerEvents="none"
                />
              </g>
            );
          })}

          {/* X Axis Labels */}
          {points.map((pt, idx) => {
            // Draw every alternate label on small charts if needed, or all since 7 is small
            return (
              <text
                key={idx}
                x={pt.x}
                y={height - 6}
                fill="var(--on-surface-variant)"
                fontSize="9"
                fontWeight="700"
                textAnchor="middle"
              >
                {pt.label.split(" ")[1]} {/* Just show day number like "12", "13" */}
              </text>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {hoveredIndex !== null && (
          <div
            style={{
              position: "absolute",
              left: `${points[hoveredIndex].x - 45}px`,
              top: `${points[hoveredIndex].y - 38}px`,
              width: "90px",
              padding: "4px 8px",
              background: "var(--inverse-surface)",
              color: "var(--inverse-on-surface)",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: 700,
              textAlign: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
              pointerEvents: "none",
              zIndex: 10,
              transform: "translateY(-4px)",
              transition: "left 150ms cubic-bezier(0.2, 0.8, 0.2, 1), top 150ms cubic-bezier(0.2, 0.8, 0.2, 1)",
            }}
          >
            <div>{points[hoveredIndex].label}</div>
            <div style={{ color: "var(--secondary-bright)" }}>
              {points[hoveredIndex].value} Completed
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
