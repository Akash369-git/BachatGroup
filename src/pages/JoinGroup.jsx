import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Search, Loader2, Users, Calendar, CheckCircle2 } from "lucide-react";
import GroupTypeTag from "@/components/shared/GroupTypeTag";
import { toast } from "sonner";

export default function JoinGroup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [searching, setSearching] = useState(false);
  const [joining, setJoining] = useState(false);
  const [group, setGroup] = useState(null);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!code.trim()) return;
    setSearching(true);
    setError("");
    setGroup(null);

    try {
      const { data, error: err } = await supabase
        .from("groups")
        .select("*")
        .eq("invite_code", code.trim().toUpperCase())
        .single();

      if (err || !data) {
        setError("No group found with this invite code");
      } else {
        setGroup(data);
      }
    } catch {
      setError("No group found with this invite code");
    } finally {
      setSearching(false);
    }
  };

  const handleJoin = async () => {
    if (!group) return;
    setJoining(true);

    try {
      const displayName = user.user_metadata?.full_name || user.email?.split("@")[0];

      // Check if already a member
      const { data: existing } = await supabase
        .from("memberships")
        .select("*")
        .eq("group_id", group.id)
        .eq("user_id", user.id)
        .single();

      if (existing?.status === "active") {
        toast.info("You are already a member of this group");
        navigate(`/groups/${group.id}`);
        return;
      }

      if ((group.member_count || 0) >= group.max_members) {
        toast.error("This group is full");
        return;
      }

      // Create membership
      const { error: memberError } = await supabase.from("memberships").insert({
        group_id: group.id,
        user_id: user.id,
        user_name: displayName,
        user_email: user.email,
        total_contributed: 0,
        status: "active",
      });
      if (memberError) throw memberError;

      // Update member count
      const { error: groupError } = await supabase
        .from("groups")
        .update({ member_count: (group.member_count || 1) + 1 })
        .eq("id", group.id);
      if (groupError) throw groupError;

      // Notify admin
      await supabase.from("notifications").insert({
        user_id: group.admin_id,
        message: `${displayName} joined your group "${group.name}"`,
        type: "member_joined",
        group_id: group.id,
        read: false,
      });

      toast.success("Successfully joined the group!");
      navigate(`/groups/${group.id}`);
    } catch (err) {
      toast.error(err.message || "Failed to join group");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-heading font-bold text-xl">Join a Group</h1>
          <p className="text-xs text-muted-foreground">Enter the invite code shared with you</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Enter invite code (e.g., ABC123)"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="rounded-xl h-12 font-mono text-lg tracking-widest uppercase"
          maxLength={6}
        />
        <Button onClick={handleSearch} disabled={searching || !code.trim()} className="rounded-xl h-12 px-6">
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </div>

      {error && (
        <Card className="p-6 border-destructive/30 bg-destructive/5 text-center">
          <p className="text-sm text-destructive">{error}</p>
        </Card>
      )}

      {group && (
        <Card className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-heading font-bold text-lg">{group.name}</h3>
              <p className="text-xs text-muted-foreground">Created by {group.admin_name}</p>
            </div>
            <GroupTypeTag type={group.group_type} />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4" />
              {group.member_count}/{group.max_members} members
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              {group.frequency === "weekly" ? "Weekly" : "Monthly"}
            </div>
          </div>

          <Button
            onClick={handleJoin}
            disabled={joining || group.status === "closed"}
            className="w-full h-12 rounded-xl font-semibold"
          >
            {joining ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Join This Group
              </>
            )}
          </Button>
        </Card>
      )}
    </div>
  );
}