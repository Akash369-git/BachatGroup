import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PDFExport({ group, contributions, members }) {
  const [generating, setGenerating] = useState(false);

  const handleExport = async () => {
    setGenerating(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF();
      const primaryColor = [26, 122, 74];
      const lightGreen = [240, 249, 244];

      // Format current date + time
      const now = new Date();
      const generatedAt = now.toLocaleDateString("en-IN", {
        day: "2-digit", month: "long", year: "numeric"
      }) + ", " + now.toLocaleTimeString("en-IN", {
        hour: "2-digit", minute: "2-digit", hour12: true
      });

      // ── Header ──────────────────────────────────────────
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, 210, 35, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("BachatGroup", 14, 15);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Contribution History Report", 14, 23);
      doc.text(`Generated: ${generatedAt}`, 14, 30);

      // ── Group Info ───────────────────────────────────────
      doc.setTextColor(0, 0, 0);
      doc.setFillColor(...lightGreen);
      doc.rect(0, 38, 210, 32, "F");

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...primaryColor);
      doc.text(group.name, 14, 48);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      doc.text(`Admin: ${group.admin_name}`, 14, 56);
      doc.text(`Contribution: Rs.${group.group_type}/round`, 14, 62);
      doc.text(`Frequency: ${group.frequency.charAt(0).toUpperCase() + group.frequency.slice(1)}`, 80, 56);
      doc.text(`Members: ${group.member_count}/${group.max_members}`, 80, 62);
      doc.text(`Status: ${group.status.toUpperCase()}`, 150, 56);
      doc.text(`Current Round: ${group.current_round || 1}`, 150, 62);

      // ── Summary Stats ────────────────────────────────────
      const totalRounds = group.current_round || 1;
      const amount = parseInt(group.group_type) || 10;
      const allPaidContribs = contributions.filter((c) => c.status === "paid");
      const totalCollected = allPaidContribs.reduce((sum, c) => sum + (c.amount || 0), 0);
      const totalMembers = members.length || group.member_count || 1;

      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(0.5);

      const stats = [
        { label: "Total Rounds", value: String(totalRounds) },
        { label: "Total Members", value: String(totalMembers) },
        { label: "Total Collected", value: `Rs.${totalCollected}` },
        { label: "Pool Balance", value: `Rs.${group.pool_balance || 0}` },
      ];

      stats.forEach((stat, i) => {
        const x = 14 + i * 47;
        doc.rect(x, 75, 43, 18);
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...primaryColor);
        doc.text(stat.value, x + 21.5, 85, { align: "center" });
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(stat.label, x + 21.5, 90, { align: "center" });
      });

      let yPos = 100;

      // ── Round by Round Tables ────────────────────────────
      for (let round = 1; round <= totalRounds; round++) {
        const roundContribs = contributions.filter((c) => c.round === round);
        const roundPaid = roundContribs.filter((c) => c.status === "paid");
        const roundTotal = roundPaid.reduce((sum, c) => sum + (c.amount || 0), 0);
        const isComplete = roundPaid.length >= totalMembers;

        // Round header bar
        doc.setFillColor(...primaryColor);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.rect(14, yPos, 182, 8, "F");
        doc.text(`Round ${round}`, 18, yPos + 5.5);
        doc.text(
          isComplete ? "COMPLETED" : "IN PROGRESS",
          130, yPos + 5.5, { align: "center" }
        );
        doc.text(
          `${roundPaid.length}/${totalMembers} paid`,
          193, yPos + 5.5, { align: "right" }
        );

        yPos += 10;

        // Build table rows with date + time
        const tableRows = members.map((m) => {
          const contrib = roundContribs.find((c) => c.user_id === m.user_id);
          let paidDateTime = "-";
          if (contrib?.paid_at) {
            const paidDate = new Date(contrib.paid_at);
            const datePart = paidDate.toLocaleDateString("en-IN", {
              day: "2-digit", month: "short", year: "numeric"
            });
            const timePart = paidDate.toLocaleTimeString("en-IN", {
              hour: "2-digit", minute: "2-digit", hour12: true
            });
            paidDateTime = `${datePart}, ${timePart}`;
          }
          return [
            m.user_name,
            contrib?.status === "paid" ? "Paid" : "Pending",
            contrib?.status === "paid" ? `Rs.${contrib.amount}` : "-",
            paidDateTime,
          ];
        });

        autoTable(doc, {
          startY: yPos,
          head: [["Member", "Status", "Amount", "Date & Time Paid"]],
          body: tableRows,
          margin: { left: 14, right: 14 },
          headStyles: {
            fillColor: lightGreen,
            textColor: primaryColor,
            fontStyle: "bold",
            fontSize: 9,
          },
          bodyStyles: { fontSize: 8, textColor: [50, 50, 50] },
          alternateRowStyles: { fillColor: [250, 255, 252] },
          columnStyles: {
            0: { cellWidth: 55 },
            1: { cellWidth: 30, halign: "center" },
            2: { cellWidth: 30, halign: "center" },
            3: { cellWidth: 67, halign: "center" },
          },
          didParseCell: (data) => {
            if (data.section === "body" && data.column.index === 1) {
              if (data.cell.raw === "Paid") {
                data.cell.styles.textColor = [26, 122, 74];
                data.cell.styles.fontStyle = "bold";
              } else {
                data.cell.styles.textColor = [200, 50, 50];
              }
            }
          },
        });

        yPos = doc.lastAutoTable.finalY + 2;
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...primaryColor);
        doc.text(
          `Round ${round} Total Collected: Rs.${roundTotal}`,
          196, yPos, { align: "right" }
        );

        yPos += 8;

        if (yPos > 260 && round < totalRounds) {
          doc.addPage();
          yPos = 15;
        }
      }

      // ── Footer ───────────────────────────────────────────
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.setFont("helvetica", "normal");
        doc.text(
          `BachatGroup - ${group.name} - Confidential`,
          14, doc.internal.pageSize.height - 8
        );
        doc.text(
          `Page ${i} of ${pageCount}`,
          196, doc.internal.pageSize.height - 8,
          { align: "right" }
        );
      }

      // ── Save ─────────────────────────────────────────────
      const fileName = `${group.name.replace(/\s+/g, "-")}-contributions-${now.toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);
      toast.success("PDF downloaded successfully!");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF");
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
        <FileDown className="w-4 h-4" />
      )}
      {generating ? "Generating..." : "Export PDF"}
    </Button>
  );
}