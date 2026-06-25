import React from "react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Bell, BellOff, CheckCheck, UserPlus, Wallet, Vote, CircleCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

const typeIcons = {
  member_joined: UserPlus,
  contribution_due: Wallet,
  withdrawal_request: Vote,
  vote_cast: Vote,
  withdrawal_resolved: CircleCheck,
};

const typeColors = {
  member_joined: "bg-primary/10 text-primary",
  contribution_due: "bg-accent/20 text-accent-foreground",
  withdrawal_request: "bg-destructive/10 text-destructive",
  vote_cast: "bg-chart-3/15 text-chart-3",
  withdrawal_resolved: "bg-primary/10 text-primary",
};

export default function Notifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const markAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .in("id", unreadIds);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notifs"] });
    }
  };

  const markRead = async (notif) => {
    if (notif.read) return;
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notif.id);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notifs"] });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-xl">Notifications</h1>
        {notifications.some((n) => !n.read) && (
          <Button variant="ghost" size="sm" className="rounded-xl text-xs gap-1.5" onClick={markAllRead}>
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <BellOff className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const Icon = typeIcons[notif.type] || Bell;
            const colorClass = typeColors[notif.type] || "bg-muted text-muted-foreground";
            return (
              <Card
                key={notif.id}
                className={`p-4 transition-all cursor-pointer ${
                  !notif.read ? "border-primary/20 bg-primary/[0.02]" : ""
                }`}
                onClick={() => markRead(notif)}
              >
                <div className="flex gap-3">
                  <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notif.read ? "font-semibold" : "text-muted-foreground"}`}>
                      {notif.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(notif.created_at), "MMM d, h:mm a")}
                    </p>
                  </div>
                  {!notif.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />}
                </div>
                {notif.group_id && (
                  <Link
                    to={`/groups/${notif.group_id}`}
                    className="text-xs text-primary font-medium mt-2 inline-block hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View Group →
                  </Link>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}