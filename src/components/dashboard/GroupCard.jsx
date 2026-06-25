import React from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Users, Calendar, ArrowRight } from "lucide-react";
import GroupTypeTag from "@/components/shared/GroupTypeTag";
import StatusBadge from "@/components/shared/StatusBadge";
import { format } from "date-fns";

export default function GroupCard({ group, membership }) {
  const contribution = parseInt(group.group_type) || 10;
  const poolTarget = contribution * (group.member_count || 1);

  return (
    <Link to={`/groups/${group.id}`}>
      <Card className="p-5 hover:shadow-lg hover:border-primary/20 transition-all duration-300 group cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-bold text-base truncate">{group.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 capitalize">{group.frequency} contributions</p>
          </div>
          <GroupTypeTag type={group.group_type} />
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {group.member_count}/{group.max_members}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Round {group.current_round || 1}
          </span>
          <StatusBadge status={group.status} />
        </div>

        {/* Pool Progress */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Pool this round</span>
            <span className="font-semibold">₹{group.pool_balance || 0} / ₹{poolTarget}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(((group.pool_balance || 0) / poolTarget) * 100, 100)}%` }}
            />
          </div>
        </div>

        {membership && (
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              My total: <span className="font-semibold text-foreground">₹{membership.total_contributed || 0}</span>
            </span>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
        )}
      </Card>
    </Link>
  );
}