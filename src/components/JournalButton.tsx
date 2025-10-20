import { Button } from "@/components/ui/button";
import { PenLine } from "lucide-react";

interface JournalButtonProps {
  onClick: () => void;
}

export const JournalButton = ({ onClick }: JournalButtonProps) => {
  return (
    <Button
      onClick={onClick}
      className="flex items-center gap-2 bg-card hover:bg-card/80 border border-border text-foreground transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20"
      size="lg"
    >
      <PenLine className="w-5 h-5" />
      <span>Start Journaling</span>
    </Button>
  );
};
