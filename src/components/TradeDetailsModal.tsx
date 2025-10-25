import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Star, Trash2 } from "lucide-react";
import { EdgeSelector } from "./EdgeSelector";
import { JournalQuestions } from "./JournalQuestions";
import { CustomQuestionJournal } from "./CustomQuestionJournal";
import { EdgeFinderWizard } from "./EdgeFinderWizard";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useAuth } from "@/hooks/useAuth";
import { useTrades } from "@/hooks/useTrades";
import { useJournalEntries } from "@/hooks/useJournalEntries";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useTradingProfiles } from "@/hooks/useTradingProfiles";

interface Trade {
  id?: string;
  date: Date;
  profit: number;
  symbol: string;
  side?: "LONG" | "SHORT";
  quantity?: number;
  entryPrice?: number;
  exitPrice?: number;
  entryTime?: string;
  exitTime?: string;
  rating?: number;
  target?: number;
  stop_loss?: number;
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
  const { user } = useAuth();
  const { uploadImage } = useImageUpload(user?.id);
  const { activeProfile } = useTradingProfiles(user?.id);
  const { saveTrade, deleteTrade } = useTrades(activeProfile?.id, user?.id);
  const currentTrade = selectedTrade && trades.find(t => 
    t.date.toISOString() === selectedTrade.date.toISOString() && 
    t.symbol === selectedTrade.symbol
  );
  
  const { entry, updateEntry } = useJournalEntries(currentTrade?.id, activeProfile?.id, user?.id);
  
  const [rating, setRating] = useState(0);
  const [target, setTarget] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [edges, setEdges] = useState<string[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<string[]>([]);
  const [showEdgeFinderWizard, setShowEdgeFinderWizard] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [customAnswers, setCustomAnswers] = useState<Record<number, string>>({});
  
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

  // Load trade data from database - reset state when trade changes, then load from entry
  useEffect(() => {
    if (!currentTrade) return;

    // Always update basic trade fields
    setRating(currentTrade.rating || 0);
    setTarget(currentTrade.target?.toString() || "");
    setStopLoss(currentTrade.stop_loss?.toString() || "");

    // Reset journal state to defaults first (ensures clean slate for each trade)
    setSelectedEdges([]);
    setCustomAnswers({});
    setEnergy(3);
    setEnergyWhy("");
    setStress(3);
    setStressWhy("");
    setConfidence(3);
    setConfidenceWhy("");
    setBias("");
    setRegime("");
    setVwap("");
    setKeyLevels("");
    setVolume("");
    setFixTomorrow("");
    setAdditionalComments("");

    // Then load from entry if it exists for this specific trade
    if (entry?.content && entry.trade_id === currentTrade.id) {
      const content = entry.content as any;
      
      const rawCA = content.customAnswers || {};
      const normalizedCA: Record<number, string> = {};
      Object.entries(rawCA).forEach(([k, v]: [string, any]) => {
        const m = /^question_(-?\d+)$/.exec(k);
        const key = m ? Number(m[1]) : Number(k);
        if (!Number.isNaN(key)) normalizedCA[key] = typeof v === 'string' ? v : String(v ?? '');
      });
      
      setSelectedEdges(content.edges || []);
      setCustomAnswers(normalizedCA);
      setEnergy(content.energy ?? 3);
      setEnergyWhy(content.energyWhy || "");
      setStress(content.stress ?? 3);
      setStressWhy(content.stressWhy || "");
      setConfidence(content.confidence ?? 3);
      setConfidenceWhy(content.confidenceWhy || "");
      setBias(content.bias || "");
      setRegime(content.regime || "");
      setVwap(content.vwap || "");
      setKeyLevels(content.keyLevels || "");
      setVolume(content.volume || "");
      setFixTomorrow(content.fixTomorrow || "");
      setAdditionalComments(content.additionalComments || "");
    }
  }, [selectedTrade?.date?.toISOString(), selectedTrade?.symbol, currentTrade?.id, entry?.trade_id, activeProfile?.id]);

  // Auto-save trade basic fields
  useEffect(() => {
    if (currentTrade?.id && selectedProfile && user?.id) {
      const timeoutId = setTimeout(() => {
        saveTrade({
          ...currentTrade,
          id: currentTrade.id,
          profile_id: selectedProfile,
          user_id: user.id,
          date: currentTrade.date.toISOString().split('T')[0],
          rating: rating || undefined,
          target: target ? parseFloat(target) : undefined,
          stop_loss: stopLoss ? parseFloat(stopLoss) : undefined,
        });
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [rating, target, stopLoss]);

  // Auto-save journal data
  useEffect(() => {
    if (currentTrade?.id && selectedProfile && user?.id) {
      const journalContent = {
        edges: selectedEdges,
        customAnswers,
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
      };

      // Prevent save loop: only save if content actually changed
      if (entry?.content && JSON.stringify(entry.content) === JSON.stringify(journalContent)) {
        return;
      }

      updateEntry(journalContent, selectedProfile === "default" ? "standard_questions" : "custom_questions");
    }
  }, [selectedEdges, customAnswers, energy, energyWhy, stress, stressWhy, confidence, confidenceWhy, 
      bias, regime, vwap, keyLevels, volume, fixTomorrow, additionalComments]);

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

  // Save edges to localStorage whenever they change
  useEffect(() => {
    if (edges.length > 0) {
      localStorage.setItem("tradeEdges", JSON.stringify(edges));
    }
  }, [edges]);

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

  const handleDeleteTrade = async () => {
    if (currentTrade?.id) {
      await deleteTrade(currentTrade.id);
      setShowDeleteDialog(false);
      onClose();
    }
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

              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="w-full mt-4"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Trade
              </Button>
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
                  <Button
                    variant="outline"
                    onClick={() => setShowEdgeFinderWizard(true)}
                    className="border-border"
                  >
                    Help me find my edge
                  </Button>
                </div>
              )}

              {selectedProfile !== "default" ? (
                <CustomQuestionJournal
                  questions={profileQuestions}
                  answers={customAnswers}
                  onAnswerChange={(index, value) => {
                    setCustomAnswers(prev => ({ ...prev, [index]: value }));
                  }}
                  onImageUpload={uploadImage}
                />
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Journal Entry</label>
                  <ReactQuill
                    theme="snow"
                    value={additionalComments}
                    onChange={setAdditionalComments}
                    modules={modules}
                    className="bg-background rounded-lg"
                    style={{ height: '400px' }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <EdgeFinderWizard
          isOpen={showEdgeFinderWizard}
          onClose={() => setShowEdgeFinderWizard(false)}
          tradeKey={currentTrade?.id || ""}
        />

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                Once deleted, this trade is gone forever. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteTrade} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete Forever
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
};
