import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Plus, UserPlus } from "lucide-react";
import StatsRow from "@/components/dashboard/StatsRow";
import GroupCard from "@/components/dashboard/GroupCard";

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4 space-y-2">
            <Skeleton className="h-8 w-8 rounded-xl mx-auto" />
            <Skeleton className="h-6 w-12 mx-auto" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </Card>
        ))}
      </div>

      {/* Buttons skeleton */}
      <div className="flex gap-3">
        <Skeleton className="h-12 flex-1 rounded-xl" />
        <Skeleton className="h-12 flex-1 rounded-xl" />
      </div>

      {/* Groups skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-28" />
        {[1, 2].map((i) => (
          <Card key={i} className="p-4 space-y-3">
            <div className="flex justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-3 w-24" />
          </Card>
        ))}
      </div>
    </div>
  );
}

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

  if (isLoading) return <DashboardSkeleton />;

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
        {groups.length === 0 ? (
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