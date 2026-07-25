// supabase/functions/resolve-expired-votes/index.ts
// Runs every hour via cron to auto-resolve expired withdrawal requests

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SERVICE_ROLE_KEY")!;

export default async function handler(_req: Request): Promise<Response> {
  try {
    // Use service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date().toISOString();

    // Find all pending withdrawal requests past their voting deadline
    const { data: expiredRequests, error: fetchError } = await supabase
      .from("withdrawal_requests")
      .select(`
        *,
        groups (
          id,
          name,
          pool_balance,
          voting_timeout_action,
          member_count
        )
      `)
      .eq("status", "pending")
      .lt("voting_deadline", now);

    if (fetchError) throw fetchError;

    if (!expiredRequests || expiredRequests.length === 0) {
      return Response.json({ message: "No expired requests found", resolved: 0 });
    }

    console.log(`Found ${expiredRequests.length} expired withdrawal requests`);

    let resolvedCount = 0;

    for (const request of expiredRequests) {
      const group = request.groups;
      const timeoutAction = group?.voting_timeout_action || "abstain";
      const votes = request.votes || [];
      const eligibleVoters = request.total_eligible_voters || 0;

      const approveCount = votes.filter((v: any) => v.vote === "approve").length;
      const rejectCount = votes.filter((v: any) => v.vote === "reject").length;

      let newStatus: string;

      if (timeoutAction === "auto_approve") {
        // Non-voters count as approve
        const effectiveApproves = approveCount + (eligibleVoters - votes.length);
        newStatus = rejectCount > 0 ? "rejected" : effectiveApproves >= eligibleVoters ? "approved" : "rejected";
      } else {
        // abstain — non-voters don't count, need unanimous from those who voted
        if (rejectCount > 0) {
          newStatus = "rejected";
        } else if (approveCount >= eligibleVoters) {
          newStatus = "approved";
        } else {
          // Not enough votes — reject by default on timeout
          newStatus = "rejected";
        }
      }

      // Update withdrawal request status
      const { error: updateError } = await supabase
        .from("withdrawal_requests")
        .update({
          status: newStatus,
          resolved_at: now,
        })
        .eq("id", request.id);

      if (updateError) {
        console.error(`Failed to update request ${request.id}:`, updateError);
        continue;
      }

      // If approved, deduct from pool balance
      if (newStatus === "approved" && group) {
        await supabase
          .from("groups")
          .update({
            pool_balance: Math.max(0, (group.pool_balance || 0) - request.amount),
          })
          .eq("id", group.id);
      }

      // Notify the requester
      const message = newStatus === "approved"
        ? `Your withdrawal of ₹${request.amount} was approved after voting timeout! 🎉`
        : `Your withdrawal of ₹${request.amount} was rejected after voting timeout.`;

      await supabase.from("notifications").insert({
        user_id: request.requested_by,
        message,
        type: "withdrawal_resolved",
        group_id: request.group_id,
        read: false,
      });

      // Get group members to notify them too
      const { data: members } = await supabase
        .from("memberships")
        .select("user_id")
        .eq("group_id", request.group_id)
        .eq("status", "active")
        .neq("user_id", request.requested_by);

      if (members && members.length > 0) {
        const memberNotifs = members.map((m: any) => ({
          user_id: m.user_id,
          message: `Withdrawal request of ₹${request.amount} in "${group?.name}" was ${newStatus} after voting timeout.`,
          type: "withdrawal_resolved",
          group_id: request.group_id,
          read: false,
        }));
        await supabase.from("notifications").insert(memberNotifs);
      }

      resolvedCount++;
      console.log(`Resolved request ${request.id} as ${newStatus}`);
    }

    return Response.json({
      message: `Successfully resolved ${resolvedCount} expired withdrawal requests`,
      resolved: resolvedCount,
    });

  } catch (error) {
    console.error("Error resolving expired votes:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}