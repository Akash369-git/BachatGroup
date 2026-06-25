import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus, Loader2 } from "lucide-react";
import StatsRow from "@/components/dashboard/StatsRow";
import GroupCard from "@/components/dashboard/GroupCard";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: memberships = [], isLoading: loadingMemberships } = useQuery({
    queryKey: ["my-memberships", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("memberships")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active");
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const groupIds = memberships.map((m) => m.group_id);

  const { data: groups = [], isLoading: loadingGroups } = useQuery({
    queryKey: ["my-groups", groupIds],
    queryFn: async () => {
      if (groupIds.length === 0) return [];
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .in("id", groupIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: groupIds.length > 0,
  });

  const isLoading = loadingMemberships || loadingGroups;
  const getMembershipForGroup = (groupId) => memberships.find((m) => m.group_id === groupId);
  const displayName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "User";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-bold text-2xl">Namaste, {displayName} 👋</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your savings groups</p>
      </div>

      <StatsRow groups={groups} memberships={memberships} />

      <div className="flex gap-3">
        <Button asChild className="flex-1 rounded-xl h-12 font-semibold">
          <Link to="/groups/create">
            <Plus className="w-4 h-4 mr-2" />
            Create Group
          </Link>
        </Button>
        <Button asChild variant="outline" className="flex-1 rounded-xl h-12 font-semibold">
          <Link to="/groups/join">
            <UserPlus className="w-4 h-4 mr-2" />
            Join Group
          </Link>
        </Button>
      </div>

      <div>
        <h2 className="font-heading font-bold text-lg mb-3">My Groups</h2>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-dashed border-border">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">💰</span>
            </div>
            <h3 className="font-heading font-bold text-lg mb-1">No groups yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create a new savings group or join one with an invite code
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {groups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                membership={getMembershipForGroup(group.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}