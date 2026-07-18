import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, CircleDot, Trophy } from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import { supabase } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function ContributionSection({ group, contributions, userId, membership, members = [] }) {
  const [marking, setMarking] = useState(false);
  const queryClient = useQueryClient();
  const amount = parseInt(group.group_type) || 10;
  const currentRound = group.current_round || 1;

  const myContribution = contributions.find(
    (c) => c.user_id === userId && c.round === currentRound
  );

  // Get all contributions for current round
  const currentRoundContributions = contributions.filter(
    (c) => c.round === currentRound
  );

  // Count paid members this round
  const paidCount = currentRoundContributions.filter(
    (c) => c.status === "paid"
  ).length;

  const totalMembers = members.length || group.member_count || 1;

  // Check if all members have paid this round
  const allPaid = paidCount >= totalMembers && totalMembers > 0;

  // ── Advance to next round ─────────────────────────────────
  const handleAdvanceRound = async () => {
    try {
      const nextRound = currentRound + 1;

      // Notify all members about round advancement
      const notifPromises = members.map((m) =>
        supabase.from("notifications").insert({
          user_id: m.user_id,
          message: `Round ${currentRound} complete! Round ${nextRound} has started in "${group.name}"`,
          type: "contribution_due",
          group_id: group.id,
          read: false,
        })
      );

      // Advance round and reset pool balance
      const { error } = await supabase
        .from("groups")
        .update({
          current_round: nextRound,
          pool_balance: 0,
        })
        .eq("id", group.id);

      if (error) throw error;

      await Promise.all(notifPromises);

      queryClient.invalidateQueries({ queryKey: ["group-detail"] });
      queryClient.invalidateQueries({ queryKey: ["group-contributions"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notifs"] });

      toast.success(`🎉 Round ${currentRound} complete! Round ${nextRound} started!`);
    } catch (err) {
      toast.error(err.message || "Failed to advance round");
    }
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

      // Update membership total contributed
      if (membership) {
        const { error } = await supabase
          .from("memberships")
          .update({ total_contributed: (membership.total_contributed || 0) + amount })
          .eq("id", membership.id);
        if (error) throw error;
      }

      // Update group pool balance
      const { error: groupError } = await supabase
        .from("groups")
        .update({ pool_balance: (group.pool_balance || 0) + amount })
        .eq("id", group.id);
      if (groupError) throw groupError;

      queryClient.invalidateQueries({ queryKey: ["group-contributions"] });
      queryClient.invalidateQueries({ queryKey: ["group-detail"] });
      queryClient.invalidateQueries({ queryKey: ["my-memberships"] });
      toast.success("Contribution marked as paid!");
    } catch (err) {
      toast.error(err.message || "Failed to mark as paid");
    } finally {
      setMarking(false);
    }
  };

  const isPaid = myContribution?.status === "paid";
  const isAdmin = group.admin_id === userId;

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-bold text-base">
          Round {currentRound} Contribution
        </h3>
        <span className="text-lg font-bold text-primary">₹{amount}</span>
      </div>

      {/* My payment status */}
      <div className={`p-4 rounded-xl border-2 ${isPaid ? "border-primary/30 bg-primary/5" : "border-destructive/30 bg-destructive/5"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isPaid ? (
              <CheckCircle2 className="w-6 h-6 text-primary" />
            ) : (
              <CircleDot className="w-6 h-6 text-destructive" />
            )}
            <div>
              <p className="font-semibold text-sm">{isPaid ? "You have paid" : "Payment pending"}</p>
              <p className="text-xs text-muted-foreground">
                {isPaid
                  ? `Paid on ${new Date(myContribution.paid_at).toLocaleDateString()}`
                  : "Mark as paid when done"}
              </p>
            </div>
          </div>
          {!isPaid && (
            <Button onClick={handleMarkPaid} disabled={marking} className="rounded-xl">
              {marking ? <Loader2 className="w-4 h-4 animate-spin" /> : `Pay ₹${amount}`}
            </Button>
          )}
        </div>
      </div>

      {/* Round progress */}
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
          {/* Show members who haven't contributed yet */}
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

      {/* All paid — show advance round button (admin only) */}
      {allPaid && isAdmin && group.status === "active" && (
        <div className="pt-2 border-t border-border">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-5 h-5 text-primary" />
            <p className="text-sm font-semibold text-primary">
              All members paid! Ready for Round {currentRound + 1}
            </p>
          </div>
          <Button
            onClick={handleAdvanceRound}
            className="w-full rounded-xl"
          >
            Start Round {currentRound + 1} →
          </Button>
        </div>
      )}

      {/* All paid — non-admin message */}
      {allPaid && !isAdmin && (
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <Trophy className="w-5 h-5 text-primary" />
          <p className="text-sm font-semibold text-primary">
            All members paid! Waiting for admin to start Round {currentRound + 1}.
          </p>
        </div>
      )}
    </Card>
  );
}