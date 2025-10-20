import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";

interface JournalQuestionsProps {
  energy: number;
  energyWhy: string;
  stress: number;
  stressWhy: string;
  confidence: number;
  confidenceWhy: string;
  bias: string;
  regime: string;
  vwap: string;
  keyLevels: string;
  volume: string;
  fixTomorrow: string;
  additionalComments: string;
  onEnergyChange: (value: number) => void;
  onEnergyWhyChange: (value: string) => void;
  onStressChange: (value: number) => void;
  onStressWhyChange: (value: string) => void;
  onConfidenceChange: (value: number) => void;
  onConfidenceWhyChange: (value: string) => void;
  onBiasChange: (value: string) => void;
  onRegimeChange: (value: string) => void;
  onVwapChange: (value: string) => void;
  onKeyLevelsChange: (value: string) => void;
  onVolumeChange: (value: string) => void;
  onFixTomorrowChange: (value: string) => void;
  onAdditionalCommentsChange: (value: string) => void;
}

export const JournalQuestions = ({
  energy,
  energyWhy,
  stress,
  stressWhy,
  confidence,
  confidenceWhy,
  bias,
  regime,
  vwap,
  keyLevels,
  volume,
  fixTomorrow,
  additionalComments,
  onEnergyChange,
  onEnergyWhyChange,
  onStressChange,
  onStressWhyChange,
  onConfidenceChange,
  onConfidenceWhyChange,
  onBiasChange,
  onRegimeChange,
  onVwapChange,
  onKeyLevelsChange,
  onVolumeChange,
  onFixTomorrowChange,
  onAdditionalCommentsChange,
}: JournalQuestionsProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-white font-semibold mb-2">Mood at open?</h3>
      </div>

      <div>
        <div className="text-sm text-muted-foreground mb-2">Energy 1–5?</div>
        <Slider
          value={[energy]}
          onValueChange={(values) => onEnergyChange(values[0])}
          min={1}
          max={5}
          step={1}
          className="mb-2"
        />
        <div className="text-sm text-white mb-1">Why?</div>
        <Textarea
          value={energyWhy}
          onChange={(e) => onEnergyWhyChange(e.target.value)}
          className="bg-background min-h-[60px]"
          placeholder="Explain your energy level..."
        />
      </div>

      <div>
        <div className="text-sm text-muted-foreground mb-2">Stress 1–5?</div>
        <Slider
          value={[stress]}
          onValueChange={(values) => onStressChange(values[0])}
          min={1}
          max={5}
          step={1}
          className="mb-2"
        />
        <div className="text-sm text-white mb-1">Why?</div>
        <Textarea
          value={stressWhy}
          onChange={(e) => onStressWhyChange(e.target.value)}
          className="bg-background min-h-[60px]"
          placeholder="Explain your stress level..."
        />
      </div>

      <div>
        <div className="text-sm text-muted-foreground mb-2">Confidence 1–5?</div>
        <Slider
          value={[confidence]}
          onValueChange={(values) => onConfidenceChange(values[0])}
          min={1}
          max={5}
          step={1}
          className="mb-2"
        />
        <div className="text-sm text-white mb-1">Why?</div>
        <Textarea
          value={confidenceWhy}
          onChange={(e) => onConfidenceWhyChange(e.target.value)}
          className="bg-background min-h-[60px]"
          placeholder="Explain your confidence level..."
        />
      </div>

      <div>
        <div className="text-sm text-muted-foreground mb-2">Bias: long/short/none?</div>
        <Textarea
          value={bias}
          onChange={(e) => onBiasChange(e.target.value)}
          className="bg-background min-h-[80px]"
          placeholder="Describe your market bias..."
        />
      </div>

      <div>
        <div className="text-sm text-muted-foreground mb-2">Regime: trend or range?</div>
        <Textarea
          value={regime}
          onChange={(e) => onRegimeChange(e.target.value)}
          className="bg-background min-h-[80px]"
          placeholder="Describe the market regime..."
        />
      </div>

      <div>
        <div className="text-sm text-muted-foreground mb-2">Above or below VWAP?</div>
        <Textarea
          value={vwap}
          onChange={(e) => onVwapChange(e.target.value)}
          className="bg-background min-h-[80px]"
          placeholder="Describe VWAP position..."
        />
      </div>

      <div>
        <div className="text-sm text-muted-foreground mb-2">Key levels hit?</div>
        <Textarea
          value={keyLevels}
          onChange={(e) => onKeyLevelsChange(e.target.value)}
          className="bg-background min-h-[80px]"
          placeholder="List key levels..."
        />
      </div>

      <div>
        <div className="text-sm text-muted-foreground mb-2">Volume: speeding or stalling?</div>
        <Textarea
          value={volume}
          onChange={(e) => onVolumeChange(e.target.value)}
          className="bg-background min-h-[80px]"
          placeholder="Describe volume behavior..."
        />
      </div>

      <div>
        <div className="text-sm text-muted-foreground mb-2">One fix for tomorrow?</div>
        <Textarea
          value={fixTomorrow}
          onChange={(e) => onFixTomorrowChange(e.target.value)}
          className="bg-background min-h-[80px]"
          placeholder="What will you improve tomorrow?"
        />
      </div>

      <div>
        <div className="text-sm text-muted-foreground mb-2">Additional Comments</div>
        <div className="text-xs text-yellow-500 mb-2 italic">
          We highly advise to have photos and be very specific with what you are talking about. A week from now, you will come read this. Don't let yourself be confused.
        </div>
        <Textarea
          value={additionalComments}
          onChange={(e) => onAdditionalCommentsChange(e.target.value)}
          className="bg-background min-h-[120px]"
          placeholder="Add detailed comments and observations..."
        />
      </div>
    </div>
  );
};
