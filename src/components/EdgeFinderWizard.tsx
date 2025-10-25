import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";

interface EdgeFinderWizardProps {
  isOpen: boolean;
  onClose: () => void;
  tradeKey: string;
}

export const EdgeFinderWizard = ({ isOpen, onClose, tradeKey }: EdgeFinderWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [responses, setResponses] = useState({
    energy: 3,
    stress: 3,
    confidence: 3,
    sleepHours: "",
    sleepMinutes: "",
    ateLastNight: "",
    ateMorning: "",
    caffeine: "",
    exercise: "",
    marketConditionTrending: false,
    marketConditionRange: false,
    vwapAbove: false,
    vwapBelow: false,
    volumeSpeedingUp: false,
    volumeStalling: false,
    keyLevels: "",
    whyTrade: "",
    fixTomorrow: "",
  });

  const loadSavedData = () => {
    const saved = localStorage.getItem(`edge_finder_${tradeKey}`);
    if (saved) {
      setResponses(JSON.parse(saved));
    }
  };

  const saveData = () => {
    localStorage.setItem(`edge_finder_${tradeKey}`, JSON.stringify(responses));
  };

  const handleNext = () => {
    saveData();
    if (currentStep < 14) {
      setCurrentStep(currentStep + 1);
    } else {
      // Save completed status
      localStorage.setItem(`edge_finder_complete_${tradeKey}`, 'true');
      onClose();
    }
  };

  const handleSkip = () => {
    if (currentStep < 14) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const updateResponse = (key: string, value: any) => {
    setResponses({ ...responses, [key]: value });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <label className="text-sm font-semibold text-foreground">Energy Level (1-5)</label>
            <Slider
              value={[responses.energy]}
              onValueChange={(val) => updateResponse("energy", val[0])}
              min={1}
              max={5}
              step={1}
              className="w-full"
            />
            <div className="text-center text-lg font-bold text-primary">{responses.energy}</div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <label className="text-sm font-semibold text-foreground">Stress Level (1-5)</label>
            <Slider
              value={[responses.stress]}
              onValueChange={(val) => updateResponse("stress", val[0])}
              min={1}
              max={5}
              step={1}
              className="w-full"
            />
            <div className="text-center text-lg font-bold text-primary">{responses.stress}</div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <label className="text-sm font-semibold text-foreground">Confidence Level (1-5)</label>
            <Slider
              value={[responses.confidence]}
              onValueChange={(val) => updateResponse("confidence", val[0])}
              min={1}
              max={5}
              step={1}
              className="w-full"
            />
            <div className="text-center text-lg font-bold text-primary">{responses.confidence}</div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <label className="text-sm font-semibold text-foreground">Sleep</label>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">Hours</label>
                <Input
                  type="number"
                  value={responses.sleepHours}
                  onChange={(e) => updateResponse("sleepHours", e.target.value)}
                  placeholder="Hours"
                  className="bg-background border-border"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">Minutes</label>
                <Input
                  type="number"
                  value={responses.sleepMinutes}
                  onChange={(e) => updateResponse("sleepMinutes", e.target.value)}
                  placeholder="Minutes"
                  className="bg-background border-border"
                />
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <label className="text-sm font-semibold text-foreground">What did you eat last night?</label>
            <Textarea
              value={responses.ateLastNight}
              onChange={(e) => updateResponse("ateLastNight", e.target.value)}
              placeholder="Describe your dinner..."
              className="bg-background border-border min-h-[100px]"
            />
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <label className="text-sm font-semibold text-foreground">What did you eat this morning before trading?</label>
            <Textarea
              value={responses.ateMorning}
              onChange={(e) => updateResponse("ateMorning", e.target.value)}
              placeholder="Describe your breakfast..."
              className="bg-background border-border min-h-[100px]"
            />
          </div>
        );
      case 7:
        return (
          <div className="space-y-4">
            <label className="text-sm font-semibold text-foreground">Any caffeine?</label>
            <Textarea
              value={responses.caffeine}
              onChange={(e) => updateResponse("caffeine", e.target.value)}
              placeholder="Coffee, tea, energy drinks..."
              className="bg-background border-border min-h-[100px]"
            />
          </div>
        );
      case 8:
        return (
          <div className="space-y-4">
            <label className="text-sm font-semibold text-foreground">Did you exercise?</label>
            <Textarea
              value={responses.exercise}
              onChange={(e) => updateResponse("exercise", e.target.value)}
              placeholder="What kind of exercise..."
              className="bg-background border-border min-h-[100px]"
            />
          </div>
        );
      case 9:
        return (
          <div className="space-y-4">
            <label className="text-sm font-semibold text-foreground">Market Condition</label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={responses.marketConditionTrending}
                  onCheckedChange={(checked) => updateResponse("marketConditionTrending", checked)}
                />
                <label className="text-foreground cursor-pointer">Trending</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={responses.marketConditionRange}
                  onCheckedChange={(checked) => updateResponse("marketConditionRange", checked)}
                />
                <label className="text-foreground cursor-pointer">Range</label>
              </div>
            </div>
          </div>
        );
      case 10:
        return (
          <div className="space-y-4">
            <label className="text-sm font-semibold text-foreground">Price vs VWAP</label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={responses.vwapAbove}
                  onCheckedChange={(checked) => updateResponse("vwapAbove", checked)}
                />
                <label className="text-foreground cursor-pointer">Above</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={responses.vwapBelow}
                  onCheckedChange={(checked) => updateResponse("vwapBelow", checked)}
                />
                <label className="text-foreground cursor-pointer">Below</label>
              </div>
            </div>
          </div>
        );
      case 11:
        return (
          <div className="space-y-4">
            <label className="text-sm font-semibold text-foreground">Volume</label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={responses.volumeSpeedingUp}
                  onCheckedChange={(checked) => updateResponse("volumeSpeedingUp", checked)}
                />
                <label className="text-foreground cursor-pointer">Speeding up</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={responses.volumeStalling}
                  onCheckedChange={(checked) => updateResponse("volumeStalling", checked)}
                />
                <label className="text-foreground cursor-pointer">Stalling</label>
              </div>
            </div>
          </div>
        );
      case 12:
        return (
          <div className="space-y-4">
            <label className="text-sm font-semibold text-foreground">Key levels hit?</label>
            <Textarea
              value={responses.keyLevels}
              onChange={(e) => updateResponse("keyLevels", e.target.value)}
              placeholder="Describe key price levels..."
              className="bg-background border-border min-h-[100px]"
            />
          </div>
        );
      case 13:
        return (
          <div className="space-y-4">
            <label className="text-sm font-semibold text-foreground">Why did you take this trade? Go in depth. Add photos.</label>
            <Textarea
              value={responses.whyTrade}
              onChange={(e) => updateResponse("whyTrade", e.target.value)}
              placeholder="Describe in detail why you entered this trade..."
              className="bg-background border-border min-h-[200px]"
            />
          </div>
        );
      case 14:
        return (
          <div className="space-y-4">
            <label className="text-sm font-semibold text-foreground">One fix for tomorrow</label>
            <Textarea
              value={responses.fixTomorrow}
              onChange={(e) => updateResponse("fixTomorrow", e.target.value)}
              placeholder="What will you improve tomorrow..."
              className="bg-background border-border min-h-[150px]"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] animate-scale-in bg-card border-border">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-foreground">
              Help Me Find My Edge - Step {currentStep} of 14
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="py-6">
          {renderStep()}
        </div>

        <div className="flex justify-between gap-2">
          <Button variant="outline" onClick={handleSkip} className="border-border">
            Skip
          </Button>
          <Button onClick={handleNext} className="bg-primary hover:bg-primary/90">
            {currentStep === 14 ? "Done" : "Next"}
          </Button>
        </div>

        <div className="flex gap-1 justify-center mt-2">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded ${i < currentStep ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};