import { Button } from "@/components/ui/button";
import { PenLine } from "lucide-react";

interface JournalButtonProps {
  onClick: () => void;
}

export const JournalButton = ({ onClick }: JournalButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="group relative px-12 py-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all duration-300 hover:scale-105 flex items-center gap-4"
    >
      <span className="text-4xl">✍️</span>
      <span className="text-2xl font-semibold">Start Journaling</span>
    </button>
  );
};
