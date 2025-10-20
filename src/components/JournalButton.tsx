import { Button } from "@/components/ui/button";
import { PenLine } from "lucide-react";

interface JournalButtonProps {
  onClick: () => void;
}

export const JournalButton = ({ onClick }: JournalButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="group relative flex items-center justify-center gap-4 px-10 py-6 bg-transparent rounded-2xl transition-all duration-300 hover:scale-105 overflow-hidden"
      style={{
        background: 'transparent',
        border: '2px solid transparent',
        backgroundImage: 'linear-gradient(hsl(var(--background)), hsl(var(--background))), linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)',
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
      }}
    >
      <span className="text-2xl text-foreground group-hover:text-foreground/80 transition-colors" style={{ fontWeight: 700 }}>
        Start Journaling
      </span>
    </button>
  );
};
