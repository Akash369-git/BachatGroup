import React from "react";

const typeConfig = {
  "10": { label: "₹10", bg: "bg-primary/10 text-primary" },
  "50": { label: "₹50", bg: "bg-accent/20 text-accent-foreground" },
  "100": { label: "₹100", bg: "bg-chart-3/15 text-chart-3" },
};

export default function GroupTypeTag({ type }) {
  const config = typeConfig[type] || typeConfig["10"];
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${config.bg}`}>
      {config.label}/round
    </span>
  );
}