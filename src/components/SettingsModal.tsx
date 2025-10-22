import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { DeleteProfileModal } from "./DeleteProfileModal";
import { toast } from "sonner";

interface TradeAccountProfile {
  id: string;
  name: string;
  createdAt: Date;
}

interface QuestionProfile {
  id: string;
  name: string;
  questions: string[];
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProfile: () => void;
  selectedProfile: string;
  onProfileChange: (profileId: string) => void;
  edgeShowerEnabled: boolean;
  onEdgeShowerChange: (enabled: boolean) => void;
  selectedAccountProfile: string;
  onAccountProfileChange: (profileId: string) => void;
}

export const SettingsModal = ({
  isOpen,
  onClose,
  onCreateProfile,
  selectedProfile,
  onProfileChange,
  edgeShowerEnabled,
  onEdgeShowerChange,
  selectedAccountProfile,
  onAccountProfileChange,
}: SettingsModalProps) => {
  const [profiles, setProfiles] = useState<QuestionProfile[]>([
    { id: "default", name: "Default", questions: [] }
  ]);
  const [accountProfiles, setAccountProfiles] = useState<TradeAccountProfile[]>([]);
  const [commission, setCommission] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<TradeAccountProfile | null>(null);

  useEffect(() => {
    const savedProfiles = localStorage.getItem("questionProfiles");
    if (savedProfiles) {
      const parsed = JSON.parse(savedProfiles);
      setProfiles([{ id: "default", name: "Default", questions: [] }, ...parsed]);
    }

    const savedAccountProfiles = localStorage.getItem("tradeAccountProfiles");
    if (savedAccountProfiles) {
      setAccountProfiles(JSON.parse(savedAccountProfiles));
    }

    const savedCommission = localStorage.getItem("userCommission");
    if (savedCommission) {
      setCommission(savedCommission);
    }
  }, [isOpen]);

  const handleCreateAccountProfile = () => {
    if (accountProfiles.length >= 3) {
      toast.error("Maximum 3 profiles allowed");
      return;
    }
    const newProfile: TradeAccountProfile = {
      id: `profile_${Date.now()}`,
      name: `Profile ${accountProfiles.length + 1}`,
      createdAt: new Date(),
    };
    const updated = [...accountProfiles, newProfile];
    setAccountProfiles(updated);
    localStorage.setItem("tradeAccountProfiles", JSON.stringify(updated));
    onAccountProfileChange(newProfile.id);
    toast.success("Profile created");
  };

  const handleDeleteProfile = (profile: TradeAccountProfile) => {
    setProfileToDelete(profile);
    setDeleteModalOpen(true);
  };

  const confirmDeleteProfile = () => {
    if (!profileToDelete) return;
    
    const updated = accountProfiles.filter((p) => p.id !== profileToDelete.id);
    setAccountProfiles(updated);
    localStorage.setItem("tradeAccountProfiles", JSON.stringify(updated));
    
    if (selectedAccountProfile === profileToDelete.id && updated.length > 0) {
      onAccountProfileChange(updated[0].id);
    }
    
    setDeleteModalOpen(false);
    setProfileToDelete(null);
    toast.success("Profile deleted");
  };

  const handleCommissionChange = (value: string) => {
    setCommission(value);
    localStorage.setItem("userCommission", value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] animate-scale-in bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Trade Account Profile</label>
            <div className="space-y-2">
              {accountProfiles.map((profile) => (
                <div key={profile.id} className="flex items-center gap-2 bg-background border border-border rounded-lg px-4 py-2">
                  <span className="flex-1 text-sm text-foreground">{profile.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteProfile(profile)}
                    className="hover:bg-destructive/20 hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                className="w-full border-border"
                onClick={handleCreateAccountProfile}
                disabled={accountProfiles.length >= 3}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Profile {accountProfiles.length >= 3 && "(Max 3)"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Commission</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                type="number"
                placeholder="Round-trip fee per trade"
                value={commission}
                onChange={(e) => handleCommissionChange(e.target.value)}
                className="bg-background border-border pl-7"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Question Profile</label>
            <Select value={selectedProfile} onValueChange={onProfileChange}>
              <SelectTrigger className="w-full bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.name}
                  </SelectItem>
                ))}
                <div className="border-t border-border mt-2 pt-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-primary hover:text-primary hover:bg-primary/10"
                    onClick={() => {
                      onClose();
                      onCreateProfile();
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Profile
                  </Button>
                </div>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Edge Shower</label>
            <div className="flex items-center justify-between bg-background border border-border rounded-lg px-4 py-3">
              <span className="text-sm text-muted-foreground">Display your best edge</span>
              <Switch 
                checked={edgeShowerEnabled} 
                onCheckedChange={onEdgeShowerChange}
              />
            </div>
          </div>
        </div>

        <DeleteProfileModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setProfileToDelete(null);
          }}
          onConfirm={confirmDeleteProfile}
          profileName={profileToDelete?.name || ""}
        />
      </DialogContent>
    </Dialog>
  );
};
