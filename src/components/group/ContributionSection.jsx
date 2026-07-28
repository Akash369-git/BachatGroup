import React, { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, CircleDot, Trophy, ChevronDown, ChevronUp, History } from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import { supabase } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import confetti from "canvas-confetti";

export default function ContributionSection({ group, contributions, userId, membership, members = [] }) {
  const [marking, setMarking] = useState(false);
  const [justPaid, setJustPaid] = useState(false);
  const [advancingRound, setAdvancingRound] = useState(false);
  const [roundJustAdvanced, setRoundJustAdvanced] = useState(false);
  const [expandedRound, setExpandedRound] = useState(null);
  const payButtonRef = useRef(null);
  const queryClient = useQueryClient();
  const amount = parseInt(group.group_type) || 10;
  const currentRound = group.current_round || 1;

  const currentRoundContributions = contributions.filter((c) => c.round === currentRound);
  const myContribution = contributions.find((c) => c.user_id === userId && c.round === currentRound);
  const paidCount = currentRoundContributions.filter((c) => c.status === "paid").length;
  const totalMembers = members.length || group.member_count || 1;
  const allPaid = paidCount >= totalMembers && totalMembers > 0;
  const isAdmin = group.admin_id === userId;
  const isPaid = myContribution?.status === "paid";

  // Past rounds
  const pastRounds = [];
  for (let r = currentRound - 1; r >= 1; r--) {
    const roundContribs = contributions.filter((c) => c.round === r);
    const roundPaid = roundContribs.filter((c) => c.status === "paid").length;
    const roundTotal = roundContribs.reduce((sum, c) => sum + (c.amount || 0), 0);
    pastRounds.push({
      round: r,
      contributions: roundContribs,
      paidCount: roundPaid,
      totalCollected: roundTotal,
      target: amount * totalMembers,
      isComplete: roundPaid >= totalMembers,
    });
  }

  // ── Confetti helpers ──────────────────────────────────────
  const fireConfetti = () => {
    // Left side burst
    confetti({
      particleCount: 60,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ["#1a7a4a", "#4ade80", "#86efac", "#fbbf24", "#ffffff"],
    });
    // Right side burst
    confetti({
      particleCount: 60,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ["#1a7a4a", "#4ade80", "#86efac", "#fbbf24", "#ffffff"],
    });
  };

  const fireTrophyConfetti = () => {
    // Big celebration for round advancement
    const duration = 2000;
    const end = Date.now() + duration;
    const interval = setInterval(() => {
      if (Date.now() > end) {
        clearInterval(interval);
        return;
      }
      confetti({
        particleCount: 30,
        angle: Math.random() * 360,
        spread: 70,
        origin: { x: Math.random(), y: Math.random() * 0.5 },
        colors: ["#1a7a4a", "#4ade80", "#fbbf24", "#f97316", "#ffffff"],
        scalar: 1.2,
      });
    }, 200);
  };

  // ── Mark as paid ──────────────────────────────────────────
  const handleMarkPaid = async () => {
    setMarking(true);
    try {
      if (myContribution) {
        const { error } = await supabase
          .from("contributions")
          .update({ status: "paid", paid_at: new Date().toISOString() })
          .eq("id", myContribution.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("contributions").insert({
          group_id: group.id,
          user_id: userId,
          user_name: membership?.user_name || "Unknown",
          round: currentRound,
          amount,
          status: "paid",
          paid_at: new Date().toISOString(),
        });
        if (error) throw error;
      }

      if (membership) {
        const { error } = await supabase
          .from("memberships")
          .update({ total_contributed: (membership.total_contributed || 0) + amount })
          .eq("id", membership.id);
        if (error) throw error;
      }

      const { error: groupError } = await supabase
        .from("groups")
        .update({ pool_balance: (group.pool_balance || 0) + amount })
        .eq("id", group.id);
      if (groupError) throw groupError;

      // 🎉 Animate!
      setJustPaid(true);
      fireConfetti();

      toast.success(`₹${amount} contribution marked as paid! 🎉`, {
        duration: 4000,
        icon: "✅",
      });

      queryClient.invalidateQueries({ queryKey: ["group-contributions"] });
      queryClient.invalidateQueries({ queryKey: ["group-detail"] });
      queryClient.invalidateQueries({ queryKey: ["my-memberships"] });

      // Reset animation after 2 seconds
      setTimeout(() => setJustPaid(false), 2000);

    } catch (err) {
      toast.error(err.message || "Failed to mark as paid");
    } finally {
      setMarking(false);
    }
  };

  // ── Advance round ─────────────────────────────────────────
  const handleAdvanceRound = async () => {
    setAdvancingRound(true);
    try {
      const nextRound = currentRound + 1;
      const { error } = await supabase
        .from("groups")
        .update({ current_round: nextRound, pool_balance: 0 })
        .eq("id", group.id);
      if (error) throw error;

      const notifPromises = members.map((m) =>
        supabase.from("notifications").insert({
          user_id: m.user_id,
          message: `Round ${currentRound} complete! Round ${nextRound} has started in "${group.name}"`,
          type: "contribution_due",
          group_id: group.id,
          read: false,
        })
      );
      await Promise.all(notifPromises);

      // 🏆 Big celebration!
      setRoundJustAdvanced(true);
      fireTrophyConfetti();

      toast.success(`🏆 Round ${currentRound} complete! Round ${nextRound} has started!`, {
        duration: 5000,
      });

      queryClient.invalidateQueries({ queryKey: ["group-detail"] });
      queryClient.invalidateQueries({ queryKey: ["group-contributions"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notifs"] });

      setTimeout(() => setRoundJustAdvanced(false), 3000);

    } catch (err) {
      toast.error(err.message || "Failed to advance round");
    } finally {
      setAdvancingRound(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Current Round ── */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-base">Round {currentRound} Contribution</h3>
          <span className="text-lg font-bold text-primary">₹{amount}</span>
        </div>

        {/* My payment status */}
        <div className={`p-4 rounded-xl border-2 transition-all duration-500 ${
          justPaid
            ? "border-primary bg-primary/10 scale-[1.02]"
            : isPaid
            ? "border-primary/30 bg-primary/5"
            : "border-destructive/30 bg-destructive/5"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Animated checkmark */}
              {isPaid || justPaid ? (
                <div className={`transition-all duration-300 ${justPaid ? "scale-125" : "scale-100"}`}>
                  <CheckCircle2 className={`w-6 h-6 ${justPaid ? "text-primary animate-bounce" : "text-primary"}`} />
                </div>
              ) : (
                <CircleDot className="w-6 h-6 text-destructive" />
              )}
              <div>
                <p className="font-semibold text-sm">
                  {justPaid ? "Payment successful! 🎉" : isPaid ? "You have paid" : "Payment pending"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isPaid
                    ? `Paid on ${new Date(myContribution.paid_at).toLocaleDateString()}`
                    : "Mark as paid when done"}
                </p>
              </div>
            </div>

            {/* Pay button with animation */}
            {!isPaid && !justPaid && (
              <Button
                ref={payButtonRef}
                onClick={handleMarkPaid}
                disabled={marking}
                className={`rounded-xl transition-all duration-200 ${
                  marking ? "scale-95 opacity-80" : "hover:scale-105 active:scale-95"
                }`}
              >
                {marking ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Marking...
                  </span>
                ) : (
                  `Pay ₹${amount}`
                )}
              </Button>
            )}

            {/* Success state button */}
            {justPaid && (
              <div className="flex items-center gap-2 text-primary font-semibold text-sm animate-pulse">
                <CheckCircle2 className="w-5 h-5" />
                Paid!
              </div>
            )}
          </div>
        </div>

        {/* Member list */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">All members this round</p>
            <p className="text-xs font-semibold text-primary">{paidCount}/{totalMembers} paid</p>
          </div>
          <div className="space-y-1.5">
            {currentRoundContributions.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-1.5 text-sm">
                <span className="text-muted-foreground">{c.user_name}</span>
                <StatusBadge status={c.status} />
              </div>
            ))}
            {members
              .filter((m) => !currentRoundContributions.find((c) => c.user_id === m.user_id))
              .map((m) => (
                <div key={m.user_id} className="flex items-center justify-between py-1.5 text-sm">
                  <span className="text-muted-foreground">{m.user_name}</span>
                  <StatusBadge status="pending" />
                </div>
              ))}
          </div>
        </div>

        {/* Advance round (admin only) */}
        {allPaid && isAdmin && group.status === "active" && (
          <div className="pt-2 border-t border-border">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className={`w-5 h-5 text-primary ${roundJustAdvanced ? "animate-bounce" : ""}`} />
              <p className="text-sm font-semibold text-primary">
                All members paid! Ready for Round {currentRound + 1}
              </p>
            </div>
            <Button
              onClick={handleAdvanceRound}
              disabled={advancingRound}
              className={`w-full rounded-xl transition-all duration-200 ${
                advancingRound ? "scale-95 opacity-80" : "hover:scale-[1.02] active:scale-95"
              }`}
            >
              {advancingRound ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Starting Round {currentRound + 1}...
                </span>
              ) : (
                `Start Round ${currentRound + 1} →`
              )}
            </Button>
          </div>
        )}

        {allPaid && !isAdmin && (
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <Trophy className="w-5 h-5 text-primary" />
            <p className="text-sm font-semibold text-primary">
              All members paid! Waiting for admin to start Round {currentRound + 1}.
            </p>
          </div>
        )}
      </Card>

      {/* ── Round History ── */}
      {pastRounds.length > 0 && (
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-heading font-bold text-base">Round History</h3>
          </div>

          <div className="space-y-2">
            {pastRounds.map(({ round, contributions: roundContribs, paidCount: rPaid, totalCollected, isComplete }) => (
              <div key={round} className="border border-border rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                  onClick={() => setExpandedRound(expandedRound === round ? null : round)}
                >
                  <div className="flex items-center gap-3">
                    {isComplete ? (
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    ) : (
                      <CircleDot className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    )}
                    <div className="text-left">
                      <p className="text-sm font-semibold">Round {round}</p>
                      <p className="text-xs text-muted-foreground">
                        ₹{totalCollected} collected · {rPaid}/{totalMembers} paid
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      isComplete ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                      {isComplete ? "Completed" : "Partial"}
                    </span>
                    {expandedRound === round
                      ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    }
                  </div>
                </button>

                {expandedRound === round && (
                  <div className="px-3 pb-3 border-t border-border bg-muted/20">
                    <div className="pt-2 space-y-1.5">
                      {roundContribs.map((c) => (
                        <div key={c.id} className="flex items-center justify-between py-1 text-sm">
                          <span className="text-muted-foreground">{c.user_name}</span>
                          <div className="flex items-center gap-2">
                            {c.paid_at && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(c.paid_at).toLocaleDateString()}
                              </span>
                            )}
                            <StatusBadge status={c.status} />
                          </div>
                        </div>
                      ))}
                      {members
                        .filter((m) => !roundContribs.find((c) => c.user_id === m.user_id))
                        .map((m) => (
                          <div key={m.user_id} className="flex items-center justify-between py-1 text-sm">
                            <span className="text-muted-foreground">{m.user_name}</span>
                            <StatusBadge status="pending" />
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}