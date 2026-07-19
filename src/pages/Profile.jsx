import React from "react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  UserCircle,
  Mail,
  Wallet,
  Users,
  ArrowDownToLine,
  Loader2,
  LogOut,
} from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import GroupTypeTag from "@/components/shared/GroupTypeTag";
import { Link } from "react-router-dom";

export default function Profile() {
  const { user, logout } = useAuth();

  const { data: memberships = [], isLoading: loadingM } = useQuery({
    queryKey: ["profile-memberships", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("memberships")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const activeMemberships = memberships.filter((m) => m.status === "active");
  const groupIds = activeMemberships.map((m) => m.group_id);

  const { data: groups = [], isLoading: loadingG } = useQuery({
    queryKey: ["profile-groups", groupIds],
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

  const { data: withdrawals = [] } = useQuery({
    queryKey: ["profile-withdrawals", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .eq("requested_by", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const totalContributed = memberships.reduce((s, m) => s + (m.total_contributed || 0), 0);
  const isLoading = loadingM || loadingG;
  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Card */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <UserCircle className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-xl">{displayName}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              {user?.email}
            </p>
          </div>
        </div>

        <Separator className="my-5" />

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Users className="w-3.5 h-3.5" />
            </div>
            <p className="font-heading font-bold text-lg">{activeMemberships.length}</p>
            <p className="text-[11px] text-muted-foreground">Groups</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Wallet className="w-3.5 h-3.5" />
            </div>
            <p className="font-heading font-bold text-lg">₹{totalContributed}</p>
            <p className="text-[11px] text-muted-foreground">Total Saved</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <ArrowDownToLine className="w-3.5 h-3.5" />
            </div>
            <p className="font-heading font-bold text-lg">{withdrawals.length}</p>
            <p className="text-[11px] text-muted-foreground">Withdrawals</p>
          </div>
        </div>
      </Card>

      {/* My Groups */}
      <div>
        <h2 className="font-heading font-bold text-base mb-3">My Groups</h2>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : groups.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">No groups yet</Card>
        ) : (
          <div className="space-y-2">
            {groups.map((g) => (
              <Link key={g.id} to={`/groups/${g.id}`}>
                <Card className="p-4 flex items-center justify-between hover:border-primary/20 transition-colors">
                  <div>
                    <p className="font-semibold text-sm">{g.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{g.frequency}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <GroupTypeTag type={g.group_type} />
                    <StatusBadge status={g.status} />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Withdrawal History */}
      {withdrawals.length > 0 && (
        <div>
          <h2 className="font-heading font-bold text-base mb-3">Withdrawal History</h2>
          <div className="space-y-2">
            {withdrawals.map((w) => (
              <Card key={w.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">₹{w.amount}</p>
                  <p className="text-xs text-muted-foreground">{w.reason || "No reason given"}</p>
                </div>
                <StatusBadge status={w.status} />
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Logout */}
      <Button
        variant="outline"
        className="w-full rounded-xl text-destructive hover:bg-destructive/10 border-destructive/20"
        onClick={() => logout()}
      >
        <LogOut className="w-4 h-4 mr-2" />
        Logout
      </Button>
    </div>
  );
}