import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCircle, Shield, Trash2 } from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";

export default function MembersList({ members, adminId, isAdmin, onRemoveMember }) {
  return (
    <Card className="p-5">
      <h3 className="font-heading font-bold text-base mb-3">Members ({members.length})</h3>
      <div className="space-y-2">
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <UserCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium flex items-center gap-2">
                  {m.user_name}
                  {m.user_id === adminId && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-accent-foreground bg-accent/30 px-1.5 py-0.5 rounded-md font-semibold">
                      <Shield className="w-2.5 h-2.5" /> Admin
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">₹{m.total_contributed || 0} contributed</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={m.status} />
              {isAdmin && m.user_id !== adminId && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  onClick={() => onRemoveMember(m)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}