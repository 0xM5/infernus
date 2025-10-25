import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RichJournalEditor } from "./RichJournalEditor";
import { useImageUpload } from "@/hooks/useImageUpload";
import { X } from "lucide-react";

interface ScratchpadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (content: string) => void;
  currentDate: Date;
  userId?: string;
}

export const ScratchpadModal: React.FC<ScratchpadModalProps> = ({
  open,
  onOpenChange,
  onSave,
  currentDate,
  userId,
}) => {
  const [content, setContent] = useState("");
  const { uploadImage } = useImageUpload(userId);

  const handleSave = () => {
    if (content.trim()) {
      onSave(content);
      setContent("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card">
        <DialogTitle className="sr-only">Scratchpad</DialogTitle>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-warning">Scratchpad</h2>
            <button
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Write your trading ideas, market observations, and thoughts in real-time
          </p>

          <div className="min-h-[500px]">
            <RichJournalEditor
              value={content}
              onChange={setContent}
              onImageUpload={uploadImage}
              placeholder="Start writing your trading ideas..."
              height={500}
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={!content.trim()}
              className="bg-success hover:bg-success-light text-success-foreground"
            >
              Attach Notes to Today's Session
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
