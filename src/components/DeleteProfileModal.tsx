import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  profileName: string;
}

export const DeleteProfileModal = ({
  isOpen,
  onClose,
  onConfirm,
  profileName,
}: DeleteProfileModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] animate-scale-in bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">Delete Profile</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-muted-foreground">
            Are you sure you want to delete <span className="font-semibold text-foreground">"{profileName}"</span>?
          </p>
          <p className="text-muted-foreground mt-2">
            If this is your active profile, the first remaining profile will be automatically selected.
          </p>
          <p className="text-destructive font-semibold mt-3">
            Once deleted, your data is gone from our database forever.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="border-border">
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};