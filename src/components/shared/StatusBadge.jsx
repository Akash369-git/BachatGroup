import React from "react";
import { Badge } from "@/components/ui/badge";

const statusStyles = {
  paid: "bg-primary/15 text-primary border-primary/30",
  pending: "bg-destructive/15 text-destructive border-destructive/30",
  late: "bg-accent/30 text-accent-foreground border-accent/50",
  active: "bg-primary/15 text-primary border-primary/30",
  closed: "bg-muted text-muted-foreground border-border",
  approved: "bg-primary/15 text-primary border-primary/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
  removed: "bg-muted text-muted-foreground border-border",
};

const statusLabels = {
  paid: "Paid",
  pending: "Pending",
  late: "Late",
  active: "Active",
  closed: "Closed",
  approved: "Approved",
  rejected: "Rejected",
  removed: "Removed",
};

const statusDots = {
  paid: "bg-primary",
  pending: "bg-destructive",
  late: "bg-accent",
  active: "bg-primary",
  closed: "bg-muted-foreground",
  approved: "bg-primary",
  rejected: "bg-destructive",
  removed: "bg-muted-foreground",
};

export default function StatusBadge({ status }) {
  return (
    <Badge variant="outline" className={`${statusStyles[status] || statusStyles.pending} font-medium text-xs gap-1.5`}>
      <span className={`w-1.5 h-1.5 rounded-full ${statusDots[status] || statusDots.pending}`} />
      {statusLabels[status] || status}
    </Badge>
  );
}