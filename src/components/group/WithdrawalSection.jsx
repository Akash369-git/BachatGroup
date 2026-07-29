import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowDownToLine, Loader2, ThumbsUp, ThumbsDown, Clock, CheckCircle2, XCircle } from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import { supabase } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import confetti from "canvas-confetti";

export default function WithdrawalSection({ group, activeRequest, userId, members }) {
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [voting, setVoting] = useState(false);
  const [lastVote, setLastVote] = useState(null); // "approve" | "reject" | null
  const [shaking, setShaking] = useState(false);
  const queryClient = useQueryClient();
  const eligibleVoters = (members?.length || 1) - 1;

  // ── Animations ────────────────────────────────────────────
  const fireApproveConfetti = () => {
    confetti({ particleCount: 80, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors: ["#1a7a4a", "#4ade80", "#86efac"] });
    confetti({ particleCount: 80, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors: ["#1a7a4a", "#4ade80", "#86efac"] });
  };

  const fireFullApprovalConfetti = () => {
    const end = Date.now() + 2500;
    const interval = setInterval(() => {
      if (Date.now() > end) { clearInterval(interval); return; }
      confetti({ particleCount: 40, angle: Math.random() * 360, spread: 70, origin: { x: Math.random(), y: Math.random() * 0.5 }, colors: ["#1a7a4a", "#4ade80", "#fbbf24", "#f97316"] });
    }, 200);
  };

  const triggerShake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 600);
  };

  // ── Submit request ────────────────────────────────────────
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
        group_id: group.id, requested_by: userId, requester_name: requesterName,
        amount: amt, reason, status: "pending", votes: [],
        total_eligible_voters: eligibleVoters, voting_deadline: deadline.toISOString(),
      });
      if (error) throw error;
      const otherMembers = members.filter((m) => m.user_id !== userId && m.status === "active");
      await Promise.all(otherMembers.map((m) =>
        supabase.from("notifications").insert({
          user_id: m.user_id, message: `Withdrawal request of ₹${amt} in "${group.name}" needs your vote`,
          type: "withdrawal_request", group_id: group.id, read: false,
        })
      ));
      queryClient.invalidateQueries({ queryKey: ["group-withdrawals"] });
      setShowForm(false); setAmount(""); setReason("");
      toast.success("Withdrawal request submitted! Members will be notified. 📢");
    } catch (err) {
      toast.error(err.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Vote ──────────────────────────────────────────────────
  const handleVote = async (vote) => {
    if (!activeRequest) return;
    setVoting(true);
    try {
      const currentVotes = activeRequest.votes || [];
      const voterName = members.find((m) => m.user_id === userId)?.user_name || "Unknown";
      const updatedVotes = [...currentVotes, { user_id: userId, user_name: voterName, vote, voted_at: new Date().toISOString() }];
      const approveCount = updatedVotes.filter((v) => v.vote === "approve").length;
      const rejectCount = updatedVotes.filter((v) => v.vote === "reject").length;
      let newStatus = "pending";
      if (rejectCount > 0) newStatus = "rejected";
      else if (approveCount >= eligibleVoters) newStatus = "approved";
      const updateData = { votes: updatedVotes, status: newStatus };
      if (newStatus !== "pending") updateData.resolved_at = new Date().toISOString();
      const { error } = await supabase.from("withdrawal_requests").update(updateData).eq("id", activeRequest.id);
      if (error) throw error;

      // Animations based on vote & outcome
      setLastVote(vote);
      if (vote === "approve") {
        if (newStatus === "approved") {
          fireFullApprovalConfetti();
          toast.success(`🎉 Withdrawal APPROVED! ₹${activeRequest.amount} will be released.`, { duration: 5000 });
        } else {
          fireApproveConfetti();
          toast.success("✓ You approved the withdrawal request!");
        }
      } else {
        triggerShake();
        toast.error("✗ You rejected the withdrawal request.");
        if (newStatus === "rejected") {
          toast.error(`Withdrawal of ₹${activeRequest.amount} has been REJECTED.`, { duration: 5000 });
        }
      }

      if (newStatus === "approved") {
        await supabase.from("groups").update({ pool_balance: Math.max(0, (group.pool_balance || 0) - activeRequest.amount) }).eq("id", group.id);
        await supabase.from("notifications").insert({ user_id: activeRequest.requested_by, message: `Your withdrawal of ₹${activeRequest.amount} was approved! 🎉`, type: "withdrawal_resolved", group_id: group.id, read: false });
      } else if (newStatus === "rejected") {
        await supabase.from("notifications").insert({ user_id: activeRequest.requested_by, message: `Your withdrawal of ₹${activeRequest.amount} was rejected.`, type: "withdrawal_resolved", group_id: group.id, read: false });
      }
      await supabase.from("notifications").insert({ user_id: activeRequest.requested_by, message: `${voterName} voted on your withdrawal request`, type: "vote_cast", group_id: group.id, read: false });
      queryClient.invalidateQueries({ queryKey: ["group-withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["group-detail"] });
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
    <Card className={`p-5 space-y-4 transition-all duration-300 ${shaking ? "animate-[shake_0.5s_ease-in-out]" : ""}`}>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>

      <div className="flex items-center justify-between">
        <h3 className="font-heading font-bold text-base">Withdrawal Requests</h3>
        {!activeRequest && (
          <Button variant="outline" size="sm" className="rounded-xl transition-all hover:scale-105 active:scale-95" onClick={() => setShowForm(!showForm)}>
            <ArrowDownToLine className="w-4 h-4 mr-1" />Request
          </Button>
        )}
      </div>

      {/* New Request Form */}
      {showForm && !activeRequest && (
        <div className="space-y-3 p-4 bg-muted/50 rounded-xl animate-in slide-in-from-top-2 duration-200">
          <div>
            <Label className="text-xs font-semibold">Amount (₹)</Label>
            <Input type="number" placeholder={`Max ₹${group.pool_balance || 0}`} value={amount} onChange={(e) => setAmount(e.target.value)} className="rounded-lg mt-1" />
          </div>
          <div>
            <Label className="text-xs font-semibold">Reason (optional)</Label>
            <Textarea placeholder="Why do you need this withdrawal?" value={reason} onChange={(e) => setReason(e.target.value)} className="rounded-lg mt-1" rows={2} />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSubmitRequest} disabled={submitting} className="rounded-xl flex-1 transition-all active:scale-95">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Submitting...</> : "Submit Request"}
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)} className="rounded-xl">Cancel</Button>
          </div>
        </div>
      )}

      {/* Active Request */}
      {activeRequest && (
        <div className="space-y-4">
          <div className={`p-4 rounded-xl border-2 transition-all duration-500 ${
            activeRequest.status === "approved" ? "border-primary/50 bg-primary/5" :
            activeRequest.status === "rejected" ? "border-destructive/50 bg-destructive/5" :
            "border-accent/40 bg-accent/5"
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {activeRequest.status === "pending" && <Clock className="w-5 h-5 text-accent-foreground animate-pulse" />}
                {activeRequest.status === "approved" && <CheckCircle2 className="w-5 h-5 text-primary" />}
                {activeRequest.status === "rejected" && <XCircle className="w-5 h-5 text-destructive" />}
                <span className="font-bold text-lg">₹{activeRequest.amount}</span>
              </div>
              <StatusBadge status={activeRequest.status} />
            </div>
            <p className="text-sm text-muted-foreground">Requested by <span className="font-medium text-foreground">{activeRequest.requester_name}</span></p>
            {activeRequest.reason && <p className="text-sm text-muted-foreground mt-1 italic">"{activeRequest.reason}"</p>}
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Approval Progress</span>
                <span className="font-semibold">{approveCount}/{eligibleVoters} approved</span>
              </div>
              <Progress value={voteProgress} className="h-2.5 transition-all duration-700" />
              {rejectCount > 0 && <p className="text-xs text-destructive font-medium">{rejectCount} rejection(s)</p>}
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

          {/* Vote buttons */}
          {activeRequest.status === "pending" && !hasVoted && !isRequester && (
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleVote("approve")}
                disabled={voting}
                className="h-14 rounded-xl bg-primary hover:bg-primary/90 text-lg font-bold transition-all hover:scale-105 active:scale-95 disabled:scale-100"
              >
                {voting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ThumbsUp className="w-5 h-5 mr-2" />Approve</>}
              </Button>
              <Button
                onClick={() => handleVote("reject")}
                disabled={voting}
                variant="destructive"
                className="h-14 rounded-xl text-lg font-bold transition-all hover:scale-105 active:scale-95 disabled:scale-100"
              >
                {voting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ThumbsDown className="w-5 h-5 mr-2" />Reject</>}
              </Button>
            </div>
          )}

          {/* Post-vote states */}
          {hasVoted && activeRequest.status === "pending" && (
            <div className={`text-center py-3 rounded-xl ${lastVote === "approve" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
              <p className="text-sm font-semibold">
                {lastVote === "approve" ? "✓ You approved — waiting for others..." : "✗ You rejected this request"}
              </p>
            </div>
          )}
          {isRequester && activeRequest.status === "pending" && (
            <p className="text-center text-sm text-muted-foreground py-2">⏳ Waiting for members to vote...</p>
          )}
          {activeRequest.status === "approved" && (
            <div className="text-center py-3 rounded-xl bg-primary/10">
              <p className="text-sm font-semibold text-primary">🎉 Withdrawal approved! Pool balance updated.</p>
            </div>
          )}
          {activeRequest.status === "rejected" && (
            <div className="text-center py-3 rounded-xl bg-destructive/10">
              <p className="text-sm font-semibold text-destructive">✗ Withdrawal was rejected.</p>
            </div>
          )}
        </div>
      )}

      {!activeRequest && !showForm && (
        <p className="text-sm text-muted-foreground text-center py-4">No active withdrawal requests</p>
      )}
    </Card>
  );
}