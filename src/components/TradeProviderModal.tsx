import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface TradeProviderModalProps {
  open: boolean;
  onClose: () => void;
  onProviderSelect: (provider: string) => void;
}

const providers = [
  "InteractiveBrokers",
  "Robinhood",
  "SierraChart",
  "Tradovate",
];

export const TradeProviderModal = ({ open, onClose, onProviderSelect }: TradeProviderModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Trade Provider</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          {providers.map((provider) => (
            <Button
              key={provider}
              variant="outline"
              className="w-full justify-start h-auto py-3 px-4 hover:bg-muted"
              onClick={() => onProviderSelect(provider)}
            >
              {provider}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
