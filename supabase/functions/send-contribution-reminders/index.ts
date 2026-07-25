// supabase/functions/send-contribution-reminders/index.ts
// Runs daily at 9 AM to remind members about pending contributions

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SERVICE_ROLE_KEY")!;

function shouldSendReminderToday(group: any): boolean {
  const startDate = new Date(group.start_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const frequency = group.frequency;

  if (frequency === "daily") {
    // Send every day
    return true;
  }

  if (frequency === "weekly") {
    // Send on the same day of week as start_date
    return today.getDay() === startDate.getDay();
  }

  if (frequency === "monthly") {
    // Send on the same day of month as start_date
    return today.getDate() === startDate.getDate();
  }

  return false;
}

export default async function handler(_req: Request): Promise<Response> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all active groups
    const { data: groups, error: groupsError } = await supabase
      .from("groups")
      .select("*")
      .eq("status", "active");

    if (groupsError) throw groupsError;
    if (!groups || groups.length === 0) {
      return Response.json({ message: "No active groups found", reminders: 0 });
    }

    let reminderCount = 0;

    for (const group of groups) {
      // Check if today is a contribution day for this group
      if (!shouldSendReminderToday(group)) continue;

      const currentRound = group.current_round || 1;
      const amount = parseInt(group.group_type) || 10;

      // Get all active members
      const { data: members, error: membersError } = await supabase
        .from("memberships")
        .select("*")
        .eq("group_id", group.id)
        .eq("status", "active");

      if (membersError || !members || members.length === 0) continue;

      // Get contributions for current round
      const { data: contributions } = await supabase
        .from("contributions")
        .select("*")
        .eq("group_id", group.id)
        .eq("round", currentRound)
        .eq("status", "paid");

      const paidUserIds = contributions?.map((c: any) => c.user_id) || [];

      // Find members who haven't paid yet
      const unpaidMembers = members.filter(
        (m: any) => !paidUserIds.includes(m.user_id)
      );

      if (unpaidMembers.length === 0) continue;

      // Send reminder notification to each unpaid member
      const notifications = unpaidMembers.map((m: any) => ({
        user_id: m.user_id,
        message: `⏰ Reminder: Your ₹${amount} contribution for Round ${currentRound} in "${group.name}" is due today!`,
        type: "contribution_due",
        group_id: group.id,
        read: false,
      }));

      const { error: notifError } = await supabase
        .from("notifications")
        .insert(notifications);

      if (notifError) {
        console.error(`Failed to send reminders for group ${group.id}:`, notifError);
        continue;
      }

      reminderCount += unpaidMembers.length;
      console.log(
        `Sent ${unpaidMembers.length} reminders for group "${group.name}" (Round ${currentRound})`
      );
    }

    return Response.json({
      message: `Successfully sent ${reminderCount} contribution reminders`,
      reminders: reminderCount,
    });

  } catch (error) {
    console.error("Error sending reminders:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}