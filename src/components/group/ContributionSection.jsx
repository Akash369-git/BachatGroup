import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, CircleDot } from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import { supabase } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function ContributionSection({ group, contributions, userId, membership }) {
  const [marking, setMarking] = useState(false);
  const queryClient = useQueryClient();
  const amount = parseInt(group.group_type) || 10;

  const myContribution = contributions.find(
    (c) => c.user_id === userId && c.round === (group.current_round || 1)
  );

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
          round: group.current_round || 1,
          amount,
          status: "paid",
          paid_at: new Date().toISOString(),
        });
        if (error) throw error;
      }

      // Update membership total
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

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-bold text-base">Round {group.current_round || 1} Contribution</h3>
        <span className="text-lg font-bold text-primary">₹{amount}</span>
      </div>

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

      <div>
        <p className="text-xs text-muted-foreground mb-2">All members this round</p>
        <div className="space-y-1.5">
          {contributions
            .filter((c) => c.round === (group.current_round || 1))
            .map((c) => (
              <div key={c.id} className="flex items-center justify-between py-1.5 text-sm">
                <span className="text-muted-foreground">{c.user_name}</span>
                <StatusBadge status={c.status} />
              </div>
            ))}
        </div>
      </div>
    </Card>
  );
}