import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, Settings, Copy, Check, Users, Calendar } from "lucide-react";
import GroupTypeTag from "@/components/shared/GroupTypeTag";
import StatusBadge from "@/components/shared/StatusBadge";
import { toast } from "sonner";

export default function GroupHeader({ group, isAdmin, onOpenSettings }) {
  const [copied, setCopied] = useState(false);
  const contribution = parseInt(group.group_type) || 10;
  const poolTarget = contribution * (group.member_count || 1);
  const progress = poolTarget > 0 ? Math.min(((group.pool_balance || 0) / poolTarget) * 100, 100) : 0;

  const copyInviteCode = () => {
    navigator.clipboard.writeText(group.invite_code);
    setCopied(true);
    toast.success("Invite code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading font-bold text-xl">{group.name}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Admin: {group.admin_name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <GroupTypeTag type={group.group_type} />
          <StatusBadge status={group.status} />
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Users className="w-4 h-4" />
          {group.member_count}/{group.max_members} members
        </span>
        <span className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4" />
          {group.frequency === "weekly" ? "Weekly" : "Monthly"} · Round {group.current_round || 1}
        </span>
      </div>

      {/* Pool Progress */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Pool this round</span>
          <span className="font-bold">₹{group.pool_balance || 0} / ₹{poolTarget}</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button variant="outline" size="sm" className="rounded-xl gap-2 flex-1" onClick={copyInviteCode}>
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied!" : group.invite_code}
        </Button>
        <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={copyInviteCode}>
          <Share2 className="w-4 h-4" />
          Share
        </Button>
        {isAdmin && (
          <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={onOpenSettings}>
            <Settings className="w-4 h-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}