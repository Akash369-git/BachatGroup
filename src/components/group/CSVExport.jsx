import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function CSVExport({ group, contributions, members }) {
  const [generating, setGenerating] = useState(false);

  const handleExport = () => {
    setGenerating(true);
    try {
      const totalRounds = group.current_round || 1;
      const amount = parseInt(group.group_type) || 10;
      const now = new Date();

      const formatDateTime = (dateStr) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-IN", {
          day: "2-digit", month: "short", year: "numeric"
        }) + " " + d.toLocaleTimeString("en-IN", {
          hour: "2-digit", minute: "2-digit", hour12: true
        });
      };

      // ── Build CSV rows ────────────────────────────────────
      const rows = [];

      // Header info
      rows.push(["BachatGroup - Contribution History Report"]);
      rows.push(["Generated", formatDateTime(now.toISOString())]);
      rows.push([]);
      rows.push(["Group Name", group.name]);
      rows.push(["Admin", group.admin_name]);
      rows.push(["Contribution Amount", `Rs.${group.group_type}/round`]);
      rows.push(["Frequency", group.frequency.charAt(0).toUpperCase() + group.frequency.slice(1)]);
      rows.push(["Members", `${group.member_count}/${group.max_members}`]);
      rows.push(["Status", group.status.toUpperCase()]);
      rows.push(["Current Round", group.current_round || 1]);
      rows.push([]);

      // Summary stats
      const allPaid = contributions.filter((c) => c.status === "paid");
      const totalCollected = allPaid.reduce((sum, c) => sum + (c.amount || 0), 0);
      rows.push(["Summary"]);
      rows.push(["Total Rounds", totalRounds]);
      rows.push(["Total Members", members.length || group.member_count]);
      rows.push(["Total Collected", `Rs.${totalCollected}`]);
      rows.push(["Pool Balance", `Rs.${group.pool_balance || 0}`]);
      rows.push([]);

      // Round by round details
      for (let round = 1; round <= totalRounds; round++) {
        const roundContribs = contributions.filter((c) => c.round === round);
        const roundPaid = roundContribs.filter((c) => c.status === "paid");
        const roundTotal = roundPaid.reduce((sum, c) => sum + (c.amount || 0), 0);
        const isComplete = roundPaid.length >= (members.length || 1);

        rows.push([`Round ${round}`, isComplete ? "COMPLETED" : "IN PROGRESS", `${roundPaid.length}/${members.length} paid`]);
        rows.push(["Member", "Status", "Amount (Rs.)", "Date & Time Paid"]);

        members.forEach((m) => {
          const contrib = roundContribs.find((c) => c.user_id === m.user_id);
          rows.push([
            m.user_name,
            contrib?.status === "paid" ? "Paid" : "Pending",
            contrib?.status === "paid" ? contrib.amount : "-",
            contrib?.paid_at ? formatDateTime(contrib.paid_at) : "-",
          ]);
        });

        rows.push(["Round Total Collected", `Rs.${roundTotal}`]);
        rows.push([]);
      }

      // ── Convert to CSV string ─────────────────────────────
      const csvContent = rows
        .map((row) =>
          row.map((cell) => {
            const str = String(cell ?? "");
            // Wrap in quotes if contains comma, newline or quote
            return str.includes(",") || str.includes("\n") || str.includes('"')
              ? `"${str.replace(/"/g, '""')}"`
              : str;
          }).join(",")
        )
        .join("\n");

      // ── Download ──────────────────────────────────────────
      const blob = new Blob(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${group.name.replace(/\s+/g, "-")}-contributions-${now.toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("CSV downloaded successfully!");
    } catch (err) {
      console.error("CSV generation failed:", err);
      toast.error("Failed to generate CSV");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={generating}
      className="rounded-xl gap-2"
    >
      {generating ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileSpreadsheet className="w-4 h-4" />
      )}
      {generating ? "Generating..." : "Export CSV"}
    </Button>
  );
}