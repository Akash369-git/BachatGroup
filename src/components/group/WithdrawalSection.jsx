import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowDownToLine,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import { supabase } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

export default function WithdrawalSection({ group, activeRequest, userId, members }) {
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [voting, setVoting] = useState(false);
  const queryClient = useQueryClient();

  const eligibleVoters = (members?.length || 1) - 1;

  const handleSubmitRequest = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0 || amt > (group.pool_balance || 0)) {
      toast.error("Invalid amount. Must be within pool balance.");
      return;
    }

    setSubmitting(true);
    try {
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + 48);
      const requesterName = members.find((m) => m.user_id === userId)?.user_name || "Unknown";

      const { error } = await supabase.from("withdrawal_requests").insert({
        group_id: group.id,
        requested_by: userId,
        requester_name: requesterName,
        amount: amt,
        reason: reason,
        status: "pending",
        votes: [],
        total_eligible_voters: eligibleVoters,
        voting_deadline: deadline.toISOString(),
      });
      if (error) throw error;

      // Notify all other active members
      const otherMembers = members.filter((m) => m.user_id !== userId && m.status === "active");
      await Promise.all(
        otherMembers.map((m) =>
          supabase.from("notifications").insert({
            user_id: m.user_id,
            message: `Withdrawal request of ₹${amt} in "${group.name}" needs your vote`,
            type: "withdrawal_request",
            group_id: group.id,
            read: false,
          })
        )
      );

      queryClient.invalidateQueries({ queryKey: ["group-withdrawals"] });
      setShowForm(false);
      setAmount("");
      setReason("");
      toast.success("Withdrawal request submitted for voting!");
    } catch (err) {
      toast.error(err.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (vote) => {
    if (!activeRequest) return;
    setVoting(true);

    try {
      const currentVotes = activeRequest.votes || [];
      const voterName = members.find((m) => m.user_id === userId)?.user_name || "Unknown";
      const updatedVotes = [
        ...currentVotes,
        {
          user_id: userId,
          user_name: voterName,
          vote,
          voted_at: new Date().toISOString(),
        },
      ];

      const approveCount = updatedVotes.filter((v) => v.vote === "approve").length;
      const rejectCount = updatedVotes.filter((v) => v.vote === "reject").length;

      let newStatus = "pending";
      if (rejectCount > 0) newStatus = "rejected";
      else if (approveCount >= eligibleVoters) newStatus = "approved";

      const updateData = { votes: updatedVotes, status: newStatus };
      if (newStatus !== "pending") updateData.resolved_at = new Date().toISOString();

      const { error } = await supabase
        .from("withdrawal_requests")
        .update(updateData)
        .eq("id", activeRequest.id);
      if (error) throw error;

      // If approved, deduct from pool
      if (newStatus === "approved") {
        await supabase
          .from("groups")
          .update({ pool_balance: Math.max(0, (group.pool_balance || 0) - activeRequest.amount) })
          .eq("id", group.id);

        await supabase.from("notifications").insert({
          user_id: activeRequest.requested_by,
          message: `Your withdrawal of ₹${activeRequest.amount} was approved!`,
          type: "withdrawal_resolved",
          group_id: group.id,
          read: false,
        });
      } else if (newStatus === "rejected") {
        await supabase.from("notifications").insert({
          user_id: activeRequest.requested_by,
          message: `Your withdrawal of ₹${activeRequest.amount} was rejected.`,
          type: "withdrawal_resolved",
          group_id: group.id,
          read: false,
        });
      }

      // Notify requester about the vote
      await supabase.from("notifications").insert({
        user_id: activeRequest.requested_by,
        message: `${voterName} voted on your withdrawal request`,
        type: "vote_cast",
        group_id: group.id,
        read: false,
      });

      queryClient.invalidateQueries({ queryKey: ["group-withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["group-detail"] });
      toast.success(`Vote cast: ${vote === "approve" ? "Approved ✓" : "Rejected ✗"}`);
    } catch (err) {
      toast.error(err.message || "Failed to cast vote");
    } finally {
      setVoting(false);
    }
  };

  const hasVoted = activeRequest?.votes?.some((v) => v.user_id === userId);
  const isRequester = activeRequest?.requested_by === userId;
  const approveCount = activeRequest?.votes?.filter((v) => v.vote === "approve").length || 0;
  const rejectCount = activeRequest?.votes?.filter((v) => v.vote === "reject").length || 0;
  const voteProgress = eligibleVoters > 0 ? (approveCount / eligibleVoters) * 100 : 0;

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-bold text-base">Withdrawal Requests</h3>
        {!activeRequest && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => setShowForm(!showForm)}
          >
            <ArrowDownToLine className="w-4 h-4 mr-1" />
            Request
          </Button>
        )}
      </div>

      {/* New Request Form */}
      {showForm && !activeRequest && (
        <div className="space-y-3 p-4 bg-muted/50 rounded-xl">
          <div>
            <Label className="text-xs font-semibold">Amount (₹)</Label>
            <Input
              type="number"
              placeholder={`Max ₹${group.pool_balance || 0}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="rounded-lg mt-1"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold">Reason (optional)</Label>
            <Textarea
              placeholder="Why do you need this withdrawal?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="rounded-lg mt-1"
              rows={2}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSubmitRequest} disabled={submitting} className="rounded-xl flex-1">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Request"}
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)} className="rounded-xl">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Active Request */}
      {activeRequest && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border-2 border-accent/40 bg-accent/5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {activeRequest.status === "pending" && <Clock className="w-5 h-5 text-accent-foreground" />}
                {activeRequest.status === "approved" && <CheckCircle2 className="w-5 h-5 text-primary" />}
                {activeRequest.status === "rejected" && <XCircle className="w-5 h-5 text-destructive" />}
                <span className="font-bold text-lg">₹{activeRequest.amount}</span>
              </div>
              <StatusBadge status={activeRequest.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              Requested by <span className="font-medium text-foreground">{activeRequest.requester_name}</span>
            </p>
            {activeRequest.reason && (
              <p className="text-sm text-muted-foreground mt-1 italic">"{activeRequest.reason}"</p>
            )}

            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Approval Progress</span>
                <span className="font-semibold">{approveCount}/{eligibleVoters} approved</span>
              </div>
              <Progress value={voteProgress} className="h-2.5" />
              {rejectCount > 0 && (
                <p className="text-xs text-destructive font-medium">{rejectCount} rejection(s)</p>
              )}
            </div>

            <div className="mt-3 space-y-1">
              {activeRequest.votes?.map((v, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1">
                  <span className="text-muted-foreground">{v.user_name}</span>
                  <span className={v.vote === "approve" ? "text-primary font-semibold" : "text-destructive font-semibold"}>
                    {v.vote === "approve" ? "✓ Approved" : "✗ Rejected"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {activeRequest.status === "pending" && !hasVoted && !isRequester && (
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleVote("approve")}
                disabled={voting}
                className="h-14 rounded-xl bg-primary hover:bg-primary/90 text-lg font-bold"
              >
                {voting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <><ThumbsUp className="w-5 h-5 mr-2" />Approve</>
                )}
              </Button>
              <Button
                onClick={() => handleVote("reject")}
                disabled={voting}
                variant="destructive"
                className="h-14 rounded-xl text-lg font-bold"
              >
                {voting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <><ThumbsDown className="w-5 h-5 mr-2" />Reject</>
                )}
              </Button>
            </div>
          )}

          {hasVoted && activeRequest.status === "pending" && (
            <p className="text-center text-sm text-muted-foreground py-2">
              ✓ You have already voted. Waiting for others...
            </p>
          )}
          {isRequester && activeRequest.status === "pending" && (
            <p className="text-center text-sm text-muted-foreground py-2">
              ⏳ Waiting for members to vote on your request...
            </p>
          )}
        </div>
      )}

      {!activeRequest && !showForm && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No active withdrawal requests
        </p>
      )}
    </Card>
  );
}