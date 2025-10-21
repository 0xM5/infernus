import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CreateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSuccess: (profileId: string) => void;
  onOpenQuestionEditor: (profileName: string, profileId: string) => void;
}

export const CreateProfileModal = ({
  isOpen,
  onClose,
  onCreateSuccess,
  onOpenQuestionEditor,
}: CreateProfileModalProps) => {
  const [profileName, setProfileName] = useState("");

  const handleCreate = () => {
    if (!profileName.trim()) {
      toast.error("Please enter a profile name");
      return;
    }

    const profileId = `profile_${Date.now()}`;
    onClose();
    onOpenQuestionEditor(profileName, profileId);
  };

  const handleClose = () => {
    setProfileName("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px] animate-scale-in bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">Create New Profile</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Profile Name</label>
            <Input
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Enter profile name"
              className="bg-background border-border"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handleClose}
              className="border-border"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Create
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
