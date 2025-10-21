import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

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
}

export const SettingsModal = ({
  isOpen,
  onClose,
  onCreateProfile,
  selectedProfile,
  onProfileChange,
}: SettingsModalProps) => {
  const [profiles, setProfiles] = useState<QuestionProfile[]>([
    { id: "default", name: "Default", questions: [] }
  ]);

  useEffect(() => {
    const savedProfiles = localStorage.getItem("questionProfiles");
    if (savedProfiles) {
      const parsed = JSON.parse(savedProfiles);
      setProfiles([{ id: "default", name: "Default", questions: [] }, ...parsed]);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] animate-scale-in bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
