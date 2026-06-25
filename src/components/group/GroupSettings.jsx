import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Archive } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function GroupSettings({ group, open, onClose }) {
  const [name, setName] = useState(group.name);
  const [timeoutAction, setTimeoutAction] = useState(group.voting_timeout_action || "abstain");
  const [saving, setSaving] = useState(false);
  const [closing, setClosing] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Group name cannot be empty");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("groups")
        .update({ name: name.trim(), voting_timeout_action: timeoutAction })
        .eq("id", group.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["group-detail"] });
      toast.success("Settings saved");
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async () => {
    if (!window.confirm("Are you sure you want to close this group? This action cannot be undone.")) return;
    setClosing(true);
    try {
      const { error } = await supabase
        .from("groups")
        .update({ status: "closed" })
        .eq("id", group.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["group-detail"] });
      toast.success("Group has been closed");
      onClose();
      navigate("/");
    } catch (err) {
      toast.error(err.message || "Failed to close group");
    } finally {
      setClosing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Group Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-semibold">Group Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl mt-1"
            />
          </div>
          <div>
            <Label className="text-sm font-semibold">Voting Timeout Action</Label>
            <p className="text-xs text-muted-foreground mb-1">
              What happens if members don't vote within 48 hours?
            </p>
            <Select value={timeoutAction} onValueChange={setTimeoutAction}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="abstain">Treat as Abstain</SelectItem>
                <SelectItem value="auto_approve">Auto Approve</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Settings"}
          </Button>

          <div className="pt-4 border-t">
            <Button
              variant="destructive"
              onClick={handleClose}
              disabled={closing || group.status === "closed"}
              className="w-full rounded-xl"
            >
              {closing ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>
                  <Archive className="w-4 h-4 mr-2" />
                  {group.status === "closed" ? "Group Already Closed" : "Close Group"}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}