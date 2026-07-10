import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GroupHeader from "@/components/group/GroupHeader";
import MembersList from "@/components/group/MembersList";
import ContributionSection from "@/components/group/ContributionSection";
import WithdrawalSection from "@/components/group/WithdrawalSection";
import GroupSettings from "@/components/group/GroupSettings";
import { toast } from "sonner";

export default function GroupDetail() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id: groupId } = useParams();
  const [settingsOpen, setSettingsOpen] = useState(false);

  // ── Queries ───────────────────────────────────────────────
  const { data: group, isLoading } = useQuery({
    queryKey: ["group-detail", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!groupId,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["group-members", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("memberships")
        .select("*")
        .eq("group_id", groupId)
        .eq("status", "active");
      if (error) throw error;
      return data;
    },
    enabled: !!groupId,
  });

  const { data: contributions = [] } = useQuery({
    queryKey: ["group-contributions", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contributions")
        .select("*")
        .eq("group_id", groupId);
      if (error) throw error;
      return data;
    },
    enabled: !!groupId,
  });

  const { data: withdrawals = [] } = useQuery({
    queryKey: ["group-withdrawals", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .eq("group_id", groupId);
      if (error) throw error;
      return data;
    },
    enabled: !!groupId,
  });

  // ── Supabase Realtime ─────────────────────────────────────
  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`group-${groupId}`)

      // Live group updates (pool balance, member count, status)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "groups", filter: `id=eq.${groupId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["group-detail", groupId] });
        }
      )

      // Live membership updates (new member joined, member removed)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "memberships", filter: `group_id=eq.${groupId}` },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["group-members", groupId] });
          queryClient.invalidateQueries({ queryKey: ["group-detail", groupId] });
          if (payload.eventType === "INSERT" && payload.new?.user_id !== user?.id) {
            toast.info(`A new member joined the group!`);
          }
        }
      )

      // Live contribution updates (someone marked as paid)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contributions", filter: `group_id=eq.${groupId}` },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["group-contributions", groupId] });
          queryClient.invalidateQueries({ queryKey: ["group-detail", groupId] });
          if (
            payload.eventType === "INSERT" &&
            payload.new?.user_id !== user?.id &&
            payload.new?.status === "paid"
          ) {
            toast.success(`${payload.new.user_name} marked their contribution as paid!`);
          }
        }
      )

      // Live withdrawal updates (new request, vote cast, resolved)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "withdrawal_requests", filter: `group_id=eq.${groupId}` },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["group-withdrawals", groupId] });
          queryClient.invalidateQueries({ queryKey: ["group-detail", groupId] });

          if (payload.eventType === "INSERT" && payload.new?.requested_by !== user?.id) {
            toast.info(`${payload.new.requester_name} submitted a withdrawal request!`);
          }
          if (payload.eventType === "UPDATE") {
            if (payload.new?.status === "approved") {
              toast.success("Withdrawal request approved! 🎉");
            } else if (payload.new?.status === "rejected") {
              toast.error("Withdrawal request was rejected.");
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, user?.id, queryClient]);

  // ── Render ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-24">
        <h2 className="font-heading font-bold text-xl">Group not found</h2>
        <Button variant="outline" className="mt-4 rounded-xl" onClick={() => navigate("/")}>
          Go to Dashboard
        </Button>
      </div>
    );
  }

  const isAdmin = group.admin_id === user?.id;
  const myMembership = members.find((m) => m.user_id === user?.id);
  const activeRequest = withdrawals.find((w) => w.status === "pending");

  const handleRemoveMember = async (member) => {
    if (!window.confirm(`Remove ${member.user_name} from the group?`)) return;
    try {
      await supabase
        .from("memberships")
        .update({ status: "removed" })
        .eq("id", member.id);

      await supabase
        .from("groups")
        .update({ member_count: Math.max(1, (group.member_count || 1) - 1) })
        .eq("id", group.id);

      await supabase.from("notifications").insert({
        user_id: member.user_id,
        message: `You were removed from "${group.name}"`,
        type: "member_joined",
        group_id: group.id,
        read: false,
      });

      queryClient.invalidateQueries({ queryKey: ["group-members"] });
      queryClient.invalidateQueries({ queryKey: ["group-detail"] });
      toast.success("Member removed");
    } catch (err) {
      toast.error(err.message || "Failed to remove member");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="rounded-xl gap-2 -ml-2">
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>

      <GroupHeader group={group} isAdmin={isAdmin} onOpenSettings={() => setSettingsOpen(true)} />

      <Tabs defaultValue="contributions" className="w-full">
        <TabsList className="w-full bg-muted rounded-xl h-11">
          <TabsTrigger value="contributions" className="flex-1 rounded-lg text-xs">
            Contributions
          </TabsTrigger>
          <TabsTrigger value="withdrawals" className="flex-1 rounded-lg text-xs">
            Withdrawals
          </TabsTrigger>
          <TabsTrigger value="members" className="flex-1 rounded-lg text-xs">
            Members
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contributions" className="mt-4">
          <ContributionSection
            group={group}
            contributions={contributions}
            userId={user?.id}
            membership={myMembership}
          />
        </TabsContent>

        <TabsContent value="withdrawals" className="mt-4">
          <WithdrawalSection
            group={group}
            activeRequest={activeRequest}
            userId={user?.id}
            members={members}
          />
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          <MembersList
            members={members}
            adminId={group.admin_id}
            isAdmin={isAdmin}
            onRemoveMember={handleRemoveMember}
          />
        </TabsContent>
      </Tabs>

      {isAdmin && settingsOpen && (
        <GroupSettings group={group} open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  );
}