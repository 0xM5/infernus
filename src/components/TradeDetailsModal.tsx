import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Star } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { EdgeSelector } from "./EdgeSelector";
import { JournalQuestions } from "./JournalQuestions";
import { CustomQuestionJournal } from "./CustomQuestionJournal";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

interface Trade {
  date: Date;
  profit: number;
  symbol: string;
  side?: "LONG" | "SHORT";
  quantity?: number;
  entryPrice?: number;
  exitPrice?: number;
  entryTime?: string;
  exitTime?: string;
}

interface TradeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trades: Trade[];
  selectedDate: Date | null;
  selectedProfile: string;
  selectedTrade: Trade | null;
}

export const TradeDetailsModal = ({
  isOpen,
  onClose,
  trades,
  selectedDate,
  selectedProfile,
  selectedTrade,
}: TradeDetailsModalProps) => {
  const [rating, setRating] = useState(0);
  const [target, setTarget] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [edges, setEdges] = useState<string[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<string[]>([]);
  const [helpFindEdge, setHelpFindEdge] = useState(false);
  const [freeJournal, setFreeJournal] = useState("");
  const [customAnswers, setCustomAnswers] = useState<{ [key: number]: string }>({});
  
  // Track the current trade key for saving - use selectedTrade for accurate symbol
  const tradeKey = selectedTrade 
    ? `trade_${selectedTrade.date.toISOString()}_${selectedTrade.symbol}`
    : '';
  
  // Journal questions state
  const [energy, setEnergy] = useState(3);
  const [energyWhy, setEnergyWhy] = useState("");
  const [stress, setStress] = useState(3);
  const [stressWhy, setStressWhy] = useState("");
  const [confidence, setConfidence] = useState(3);
  const [confidenceWhy, setConfidenceWhy] = useState("");
  const [bias, setBias] = useState("");
  const [regime, setRegime] = useState("");
  const [vwap, setVwap] = useState("");
  const [keyLevels, setKeyLevels] = useState("");
  const [volume, setVolume] = useState("");
  const [fixTomorrow, setFixTomorrow] = useState("");
  const [additionalComments, setAdditionalComments] = useState("");

  // Get current profile's questions
  const [profileQuestions, setProfileQuestions] = useState<string[]>([]);

  useEffect(() => {
    if (selectedProfile !== "default") {
      const savedProfiles = localStorage.getItem("questionProfiles");
      if (savedProfiles) {
        const profiles = JSON.parse(savedProfiles);
        const profile = profiles.find((p: any) => p.id === selectedProfile);
        if (profile) {
          setProfileQuestions(profile.questions);
        }
      }
    } else {
      setProfileQuestions([]);
    }
  }, [selectedProfile]);

  // Load edges from localStorage on mount
  useEffect(() => {
    const savedEdges = localStorage.getItem("tradeEdges");
    if (savedEdges) {
      setEdges(JSON.parse(savedEdges));
    }
  }, []);

  // Load selected edges for this specific trade
  useEffect(() => {
    if (tradeKey && selectedDate) {
      const tradeData = localStorage.getItem(tradeKey);
      if (tradeData) {
        const parsed = JSON.parse(tradeData);
        if (parsed.edges && Array.isArray(parsed.edges)) {
          setSelectedEdges(parsed.edges);
        }
      }
    }
  }, [tradeKey, selectedDate]);

  // Save edges to localStorage whenever they change
  useEffect(() => {
    if (edges.length > 0) {
      localStorage.setItem("tradeEdges", JSON.stringify(edges));
    }
  }, [edges]);

  // Save selected edges for this specific trade whenever they change
  useEffect(() => {
    if (tradeKey && selectedDate) {
      const existingData = localStorage.getItem(tradeKey);
      const parsed = existingData ? JSON.parse(existingData) : {};
      parsed.edges = selectedEdges;
      localStorage.setItem(tradeKey, JSON.stringify(parsed));
    }
  }, [selectedEdges, tradeKey, selectedDate]);

  if (!selectedDate) return null;

  const dayTrades = trades.filter((trade) => {
    const tradeDate = trade.date.toISOString().split("T")[0];
    const selectedDateStr = selectedDate.toISOString().split("T")[0];
    return tradeDate === selectedDateStr;
  });

  if (dayTrades.length === 0) return null;

  // Aggregate stats for the day
  const totalPnL = dayTrades.reduce((sum, trade) => sum + trade.profit, 0);
  const totalContracts = dayTrades.reduce(
    (sum, trade) => sum + (trade.quantity || 0),
    0
  );
  const avgEntry =
    dayTrades.reduce((sum, trade) => sum + (trade.entryPrice || 0), 0) /
    dayTrades.length;
  const avgExit =
    dayTrades.reduce((sum, trade) => sum + (trade.exitPrice || 0), 0) /
    dayTrades.length;

  // Calculate R:R ratios
  const plannedRR =
    target && stopLoss
      ? Math.abs((parseFloat(target) - avgEntry) / (avgEntry - parseFloat(stopLoss)))
      : 0;

  const actualRR =
    stopLoss
      ? Math.abs((avgExit - avgEntry) / (avgEntry - parseFloat(stopLoss)))
      : 0;

  const handleStarClick = (starIndex: number, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const starWidth = rect.width;
    const isLeftHalf = clickX < starWidth / 2;
    
    if (isLeftHalf) {
      setRating(starIndex - 0.5);
    } else {
      setRating(starIndex);
    }
  };

  const toggleEdgeSelection = (edge: string) => {
    setSelectedEdges((prev) =>
      prev.includes(edge) ? prev.filter((e) => e !== edge) : [...prev, edge]
    );
  };

  const modules = {
    toolbar: [
      [{ font: [] }, { size: [] }],
      ["bold", "italic", "underline"],
      [{ color: [] }, { background: [] }],
      ["image"],
      ["clean"],
    ],
  };

  const getPnLColor = () => {
    if (totalPnL > 0) return "text-green-400";
    if (totalPnL < 0) return "text-red-400";
    return "text-muted-foreground";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] h-[85vh] p-0 bg-transparent border-none shadow-none">
        <div className="flex gap-6 h-full min-h-0">
          {/* Left side - Trade Details */}
          <div className="w-[250px] bg-muted rounded-xl p-6 space-y-4 overflow-y-auto">
            <h2
              className="text-xl text-white mb-6"
              style={{ fontWeight: 700, fontFamily: "Inter" }}
            >
              Trade Details
            </h2>

            <div className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground mb-1">PnL</div>
                <div className={`text-2xl font-bold ${getPnLColor()}`}>
                  {totalPnL >= 0 ? "+" : ""}${totalPnL.toFixed(2)}
                </div>
                </div>

                {dayTrades[0]?.side && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Order Type</div>
                    <div className={`text-lg font-bold ${dayTrades[0].side === 'LONG' ? 'text-green-400' : 'text-red-400'}`}>
                      {dayTrades[0].side}
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                  Contracts Traded
                </div>
                <div className="text-lg text-white">{totalContracts}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-2">
                  Rate Your Trade
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFull = star <= Math.floor(rating);
                    const isHalf = star === Math.ceil(rating) && rating % 1 !== 0;
                    
                    return (
                      <div key={star} className="relative w-6 h-6">
                        <Star
                          className={`w-6 h-6 cursor-pointer transition-colors absolute ${
                            isFull
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground"
                          }`}
                          onClick={(e) => handleStarClick(star, e)}
                        />
                        {isHalf && (
                          <div className="absolute inset-0 overflow-hidden w-1/2">
                            <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Average Entry
                </div>
                <div className="text-lg text-white">
                  ${avgEntry.toFixed(2)}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Average Exit
                </div>
                <div className="text-lg text-white">${avgExit.toFixed(2)}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">Target</div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    placeholder="Enter target price"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="bg-background rounded-lg pl-7 border-input [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Stop Loss
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    placeholder="Enter stop loss"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    className="bg-background rounded-lg pl-7 border-input [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              {target && stopLoss && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Planned R:R
                  </div>
                  <div className={`text-lg font-bold ${plannedRR >= 2 ? 'text-green-400' : 'text-red-400'}`}>
                    {plannedRR.toFixed(2)}R
                  </div>
                </div>
              )}

              {stopLoss && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Actual R:R
                  </div>
                  <div className={`text-lg font-bold ${actualRR >= 2 ? 'text-green-400' : 'text-red-400'}`}>
                    {actualRR.toFixed(2)}R
                  </div>
                </div>
              )}

              {dayTrades[0].entryTime && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Entry Time
                  </div>
                  <div className="text-lg text-white">
                    {dayTrades[0].entryTime}
                  </div>
                </div>
              )}

              {dayTrades[0].exitTime && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Exit Time
                  </div>
                  <div className="text-lg text-white">
                    {dayTrades[0].exitTime}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right side - Edge Tags and Journal */}
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            {/* Edge Tags */}
            <div className="w-full bg-primary/20 rounded-xl p-6 border-2 border-primary">
              <h2
                className="text-xl text-white mb-4"
                style={{ fontWeight: 700, fontFamily: "Inter" }}
              >
                What was the edge?
              </h2>
              <EdgeSelector
                edges={edges}
                selectedEdges={selectedEdges}
                onEdgesChange={setEdges}
                onEdgeSelect={toggleEdgeSelection}
              />
            </div>

            {/* Journal Section */}
            <div className="flex-1 min-h-0 bg-muted rounded-xl p-6 overflow-y-auto">
              {selectedProfile === "default" && (
                <div className="flex items-center gap-2 mb-4">
                  <Checkbox
                    id="help-edge"
                    checked={helpFindEdge}
                    onCheckedChange={(checked) => setHelpFindEdge(checked as boolean)}
                  />
                  <label
                    htmlFor="help-edge"
                    className="text-white font-semibold cursor-pointer"
                  >
                    Help me find my edge
                  </label>
                </div>
              )}

              {selectedProfile !== "default" ? (
                <CustomQuestionJournal
                  questions={profileQuestions}
                  answers={customAnswers}
                  onAnswerChange={(index, value) => {
                    setCustomAnswers((prev) => ({ ...prev, [index]: value }));
                  }}
                />
              ) : helpFindEdge ? (
                <JournalQuestions
                  energy={energy}
                  energyWhy={energyWhy}
                  stress={stress}
                  stressWhy={stressWhy}
                  confidence={confidence}
                  confidenceWhy={confidenceWhy}
                  bias={bias}
                  regime={regime}
                  vwap={vwap}
                  keyLevels={keyLevels}
                  volume={volume}
                  fixTomorrow={fixTomorrow}
                  additionalComments={additionalComments}
                  onEnergyChange={setEnergy}
                  onEnergyWhyChange={setEnergyWhy}
                  onStressChange={setStress}
                  onStressWhyChange={setStressWhy}
                  onConfidenceChange={setConfidence}
                  onConfidenceWhyChange={setConfidenceWhy}
                  onBiasChange={setBias}
                  onRegimeChange={setRegime}
                  onVwapChange={setVwap}
                  onKeyLevelsChange={setKeyLevels}
                  onVolumeChange={setVolume}
                  onFixTomorrowChange={setFixTomorrow}
                  onAdditionalCommentsChange={setAdditionalComments}
                />
              ) : (
                <div className="h-full">
                  <ReactQuill
                    theme="snow"
                    value={freeJournal}
                    onChange={setFreeJournal}
                    modules={modules}
                    className="h-[calc(100%-50px)] bg-background rounded-xl [&_.ql-container]:rounded-b-xl [&_.ql-toolbar]:rounded-t-xl [&_.ql-container]:border-input [&_.ql-toolbar]:border-input [&_.ql-container]:bg-background [&_.ql-editor]:text-foreground [&_.ql-editor]:min-h-[200px]"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
