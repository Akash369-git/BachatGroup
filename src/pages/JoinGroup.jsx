import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState("");
  const [searching, setSearching] = useState(false);
  const [joining, setJoining] = useState(false);
  const [group, setGroup] = useState(null);
  const [error, setError] = useState("");

  // Auto-fill code from invite link ?code=ABC123
  useEffect(() => {
    const codeFromUrl = searchParams.get("code");
    if (codeFromUrl) {
      setCode(codeFromUrl.toUpperCase());
    }
  }, [searchParams]);

  // Auto-search if code came from invite link
  useEffect(() => {
    const codeFromUrl = searchParams.get("code");
    if (codeFromUrl && codeFromUrl.length === 6) {
      handleSearch(codeFromUrl.toUpperCase());
    }
  }, []);

  const handleSearch = async (searchCode) => {
    const codeToSearch = searchCode || code;
    if (!codeToSearch.trim()) return;
    setSearching(true);
    setError("");
    setGroup(null);

    try {
      const { data, error: err } = await supabase
        .from("groups")
        .select("*")
        .eq("invite_code", codeToSearch.trim().toUpperCase())
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

      if (group.status === "closed") {
        toast.error("This group is closed");
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
          <p className="text-xs text-muted-foreground">Enter the invite code or use a shared link</p>
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
        <Button
          onClick={() => handleSearch()}
          disabled={searching || !code.trim()}
          className="rounded-xl h-12 px-6"
        >
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </div>

      {error && (
        <Card className="p-6 border-destructive/30 bg-destructive/5 text-center">
          <p className="text-sm text-destructive">{error}</p>
        </Card>
      )}

      {searching && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
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

          {group.status === "closed" && (
            <p className="text-sm text-destructive font-medium text-center">
              This group is closed and no longer accepting members.
            </p>
          )}

          {(group.member_count || 0) >= group.max_members && group.status !== "closed" && (
            <p className="text-sm text-destructive font-medium text-center">
              This group is full.
            </p>
          )}

          <Button
            onClick={handleJoin}
            disabled={joining || group.status === "closed" || (group.member_count || 0) >= group.max_members}
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