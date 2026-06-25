import React from "react";
import { Wallet, Users, TrendingUp } from "lucide-react";

export default function StatsRow({ groups, memberships }) {
  const totalGroups = groups.length;
  const totalContributed = memberships.reduce((sum, m) => sum + (m.total_contributed || 0), 0);
  const activeGroups = groups.filter(g => g.status === "active").length;

  const stats = [
    { label: "My Groups", value: totalGroups, icon: Users, color: "bg-primary/10 text-primary" },
    { label: "Total Saved", value: `₹${totalContributed}`, icon: Wallet, color: "bg-accent/20 text-accent-foreground" },
    { label: "Active Groups", value: activeGroups, icon: TrendingUp, color: "bg-chart-3/15 text-chart-3" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="bg-card rounded-2xl p-4 border border-border">
          <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center mb-2`}>
            <s.icon className="w-4.5 h-4.5" />
          </div>
          <p className="font-heading font-bold text-lg">{s.value}</p>
          <p className="text-[11px] text-muted-foreground">{s.label}</p>
        </div>
      ))}
    </div>
  );
}