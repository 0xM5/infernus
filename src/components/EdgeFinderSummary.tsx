import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";

interface EdgeFinderSummaryProps {
  responses: {
    energy: number;
    stress: number;
    confidence: number;
    sleepHours: string;
    sleepMinutes: string;
    ateLastNight: string;
    ateMorning: string;
    caffeine: string;
    exercise: string;
    marketConditionTrending: boolean;
    marketConditionRange: boolean;
    vwapAbove: boolean;
    vwapBelow: boolean;
    volumeSpeedingUp: boolean;
    volumeStalling: boolean;
    keyLevels: string;
    whyTrade: string;
    fixTomorrow: string;
  };
  onUpdate: (responses: any) => void;
}

export const EdgeFinderSummary = ({ responses, onUpdate }: EdgeFinderSummaryProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedResponses, setEditedResponses] = useState(responses);

  const handleSave = () => {
    onUpdate(editedResponses);
    setIsEditing(false);
  };

  const updateResponse = (key: string, value: any) => {
    setEditedResponses({ ...editedResponses, [key]: value });
  };

  const formatMarketConditions = () => {
    const conditions = [];
    if (responses.marketConditionTrending) conditions.push("Trending");
    if (responses.marketConditionRange) conditions.push("Range");
    return conditions.length > 0 ? conditions.join(", ") : "None selected";
  };

  const formatVWAP = () => {
    const vwap = [];
    if (responses.vwapAbove) vwap.push("Above");
    if (responses.vwapBelow) vwap.push("Below");
    return vwap.length > 0 ? vwap.join(", ") : "None selected";
  };

  const formatVolume = () => {
    const volume = [];
    if (responses.volumeSpeedingUp) volume.push("Speeding Up");
    if (responses.volumeStalling) volume.push("Stalling");
    return volume.length > 0 ? volume.join(", ") : "None selected";
  };

  return (
    <div className="bg-secondary/30 border border-border/50 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-foreground">Edge Analysis Summary</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(true)}
          className="h-8 w-8 p-0"
        >
          <Pencil className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-muted-foreground">Energy:</span>
          <span className="ml-2 text-foreground font-medium">{responses.energy}/5</span>
        </div>
        <div>
          <span className="text-muted-foreground">Stress:</span>
          <span className="ml-2 text-foreground font-medium">{responses.stress}/5</span>
        </div>
        <div>
          <span className="text-muted-foreground">Confidence:</span>
          <span className="ml-2 text-foreground font-medium">{responses.confidence}/5</span>
        </div>
        <div>
          <span className="text-muted-foreground">Sleep:</span>
          <span className="ml-2 text-foreground font-medium">
            {responses.sleepHours}h {responses.sleepMinutes}m
          </span>
        </div>
      </div>

      {responses.whyTrade && (
        <div className="pt-2 border-t border-border/30">
          <span className="text-muted-foreground text-xs">Why I took this trade:</span>
          <p className="text-foreground text-xs mt-1 line-clamp-2">{responses.whyTrade}</p>
        </div>
      )}

      {responses.fixTomorrow && (
        <div className="pt-2 border-t border-border/30">
          <span className="text-muted-foreground text-xs">Fix for tomorrow:</span>
          <p className="text-foreground text-xs mt-1 line-clamp-2">{responses.fixTomorrow}</p>
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle>Edit Edge Analysis</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Energy Level ({editedResponses.energy}/5)</label>
              <Slider
                value={[editedResponses.energy]}
                onValueChange={(val) => updateResponse("energy", val[0])}
                min={1}
                max={5}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Stress Level ({editedResponses.stress}/5)</label>
              <Slider
                value={[editedResponses.stress]}
                onValueChange={(val) => updateResponse("stress", val[0])}
                min={1}
                max={5}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Confidence Level ({editedResponses.confidence}/5)</label>
              <Slider
                value={[editedResponses.confidence]}
                onValueChange={(val) => updateResponse("confidence", val[0])}
                min={1}
                max={5}
                step={1}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Sleep Hours</label>
                <Input
                  type="number"
                  value={editedResponses.sleepHours}
                  onChange={(e) => updateResponse("sleepHours", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Sleep Minutes</label>
                <Input
                  type="number"
                  value={editedResponses.sleepMinutes}
                  onChange={(e) => updateResponse("sleepMinutes", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Why did you take this trade?</label>
              <Textarea
                value={editedResponses.whyTrade}
                onChange={(e) => updateResponse("whyTrade", e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">One fix for tomorrow</label>
              <Textarea
                value={editedResponses.fixTomorrow}
                onChange={(e) => updateResponse("fixTomorrow", e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
