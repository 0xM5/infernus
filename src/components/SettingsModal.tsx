import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Plus, X, Pencil, Check } from "lucide-react";
import { DeleteProfileModal } from "./DeleteProfileModal";
import { toast } from "sonner";
import { useToast } from "@/hooks/use-toast";

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
  const { toast: toastHook } = useToast();
  const [profiles, setProfiles] = useState<QuestionProfile[]>([
    { id: "default", name: "Default", questions: [] }
  ]);
  const [accountProfiles, setAccountProfiles] = useState<TradeAccountProfile[]>([]);
  const [commission, setCommission] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<TradeAccountProfile | null>(null);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const savedProfiles = localStorage.getItem("questionProfiles");
    if (savedProfiles) {
      const parsed = JSON.parse(savedProfiles);
      setProfiles([{ id: "default", name: "Default", questions: [] }, ...parsed]);
    }

    let savedAccountProfiles = localStorage.getItem("tradeAccountProfiles");
    let profiles: TradeAccountProfile[] = [];
    
    if (savedAccountProfiles) {
      profiles = JSON.parse(savedAccountProfiles);
    }
    
    // If no profiles exist, create a default one
    if (profiles.length === 0) {
      const defaultProfile: TradeAccountProfile = {
        id: `profile_${Date.now()}`,
        name: "Profile 1",
        createdAt: new Date(),
      };
      profiles = [defaultProfile];
      localStorage.setItem("tradeAccountProfiles", JSON.stringify(profiles));
      onAccountProfileChange(defaultProfile.id);
    }
    
    setAccountProfiles(profiles);

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
    
    // Prevent deletion of last profile
    if (accountProfiles.length === 1) {
      toast.error("You must have at least one profile");
      setDeleteModalOpen(false);
      setProfileToDelete(null);
      return;
    }
    
    const updated = accountProfiles.filter((p) => p.id !== profileToDelete.id);
    setAccountProfiles(updated);
    localStorage.setItem("tradeAccountProfiles", JSON.stringify(updated));
    
    // If deleting the selected profile, select the first remaining one
    if (selectedAccountProfile === profileToDelete.id) {
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

  const handleStartRename = (profile: TradeAccountProfile) => {
    setEditingProfileId(profile.id);
    setEditingName(profile.name);
  };

  const handleSaveRename = () => {
    if (!editingProfileId) return;
    
    const trimmedName = editingName.trim();
    if (!trimmedName) {
      toast.error("Profile name cannot be empty");
      return;
    }
    
    const updated = accountProfiles.map(p => 
      p.id === editingProfileId ? { ...p, name: trimmedName } : p
    );
    setAccountProfiles(updated);
    localStorage.setItem("tradeAccountProfiles", JSON.stringify(updated));
    setEditingProfileId(null);
    setEditingName("");
    toast.success("Profile renamed");
  };

  const handleCancelRename = () => {
    setEditingProfileId(null);
    setEditingName("");
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
            <RadioGroup value={selectedAccountProfile} onValueChange={onAccountProfileChange}>
              <div className="space-y-2">
                {accountProfiles.map((profile) => (
                  <div 
                    key={profile.id} 
                    className={`flex items-center gap-2 bg-background border rounded-lg px-4 py-2 transition-colors ${
                      selectedAccountProfile === profile.id ? 'border-primary' : 'border-border'
                    }`}
                  >
                    <RadioGroupItem value={profile.id} id={profile.id} />
                    <Label 
                      htmlFor={profile.id} 
                      className="flex-1 cursor-pointer"
                    >
                      {editingProfileId === profile.id ? (
                        <div className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename();
                              if (e.key === 'Escape') handleCancelRename();
                            }}
                            className="h-7 text-sm"
                            autoFocus
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleSaveRename}
                            className="h-7 w-7 hover:bg-primary/20 hover:text-primary"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm text-foreground">{profile.name}</span>
                      )}
                    </Label>
                    {editingProfileId !== profile.id && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleStartRename(profile)}
                          className="h-7 w-7 hover:bg-primary/20 hover:text-primary"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteProfile(profile)}
                          className="h-7 w-7 hover:bg-destructive/20 hover:text-destructive"
                          disabled={accountProfiles.length === 1}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </RadioGroup>
            <Button
              variant="outline"
              className="w-full border-border mt-2"
              onClick={handleCreateAccountProfile}
              disabled={accountProfiles.length >= 3}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Profile {accountProfiles.length >= 3 && "(Max 3)"}
            </Button>
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
                onCheckedChange={() => {
                  toastHook({
                    title: "This feature is coming soon!",
                    description: "We're working on bringing you the Edge Shower feature."
                  });
                }}
                disabled
                className="opacity-50"
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
