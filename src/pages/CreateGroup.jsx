import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

const groupTypes = [
  { value: "10", label: "₹10", desc: "Up to 20 members", max: 20, color: "border-primary bg-primary/5" },
  { value: "50", label: "₹50", desc: "Up to 30 members", max: 30, color: "border-accent bg-accent/10" },
  { value: "100", label: "₹100", desc: "Up to 50 members", max: 50, color: "border-chart-3 bg-chart-3/5" },
];

function generateInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function CreateGroup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    group_type: "10",
    frequency: "monthly",
    max_members: "",
    start_date: "",
  });

  const selectedType = groupTypes.find((t) => t.value === form.group_type);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.start_date) {
      toast.error("Please fill in all required fields");
      return;
    }
    const maxMembers = parseInt(form.max_members) || selectedType.max;
    if (maxMembers > selectedType.max) {
      toast.error(`Maximum ${selectedType.max} members for ₹${form.group_type} group`);
      return;
    }

    setLoading(true);
    try {
      const inviteCode = generateInviteCode();
      const displayName = user.user_metadata?.full_name || user.email?.split("@")[0];

      // Create group
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .insert({
          name: form.name,
          group_type: form.group_type,
          frequency: form.frequency,
          admin_id: user.id,
          admin_name: displayName,
          invite_code: inviteCode,
          max_members: maxMembers,
          member_count: 1,
          start_date: form.start_date,
          current_round: 1,
          pool_balance: 0,
          status: "active",
          voting_timeout_action: "abstain",
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as first member
      const { error: memberError } = await supabase
        .from("memberships")
        .insert({
          group_id: group.id,
          user_id: user.id,
          user_name: displayName,
          user_email: user.email,
          total_contributed: 0,
          status: "active",
        });

      if (memberError) throw memberError;

      toast.success("Group created! Share the invite code with others.");
      navigate(`/groups/${group.id}`);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-heading font-bold text-xl">Create Bachat Group</h1>
          <p className="text-xs text-muted-foreground">Start a new savings group</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Group Name */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Group Name</Label>
          <Input
            placeholder="e.g., Office Bachat Group"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-xl h-12"
          />
        </div>

        {/* Group Type */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Contribution Amount</Label>
          <RadioGroup
            value={form.group_type}
            onValueChange={(v) => setForm({ ...form, group_type: v, max_members: "" })}
            className="grid grid-cols-3 gap-3"
          >
            {groupTypes.map((type) => (
              <Label
                key={type.value}
                className={`flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  form.group_type === type.value ? type.color : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <RadioGroupItem value={type.value} className="sr-only" />
                <span className="font-heading font-bold text-xl">{type.label}</span>
                <span className="text-[10px] text-muted-foreground mt-1">{type.desc}</span>
              </Label>
            ))}
          </RadioGroup>
        </div>

        {/* Frequency */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Contribution Frequency</Label>
          <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}>
            <SelectTrigger className="rounded-xl h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Max Members */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Maximum Members</Label>
          <Input
            type="number"
            placeholder={`Up to ${selectedType?.max || 20}`}
            value={form.max_members}
            onChange={(e) => setForm({ ...form, max_members: e.target.value })}
            max={selectedType?.max}
            min={2}
            className="rounded-xl h-12"
          />
        </div>

        {/* Start Date */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Start Date</Label>
          <Input
            type="date"
            value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            className="rounded-xl h-12"
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl font-semibold text-base">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Create Group
            </>
          )}
        </Button>
      </form>
    </div>
  );
}