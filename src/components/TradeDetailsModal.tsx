import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Star, Trash2, Info } from "lucide-react";
import { EdgeSelector } from "./EdgeSelector";
import { JournalQuestions } from "./JournalQuestions";
import { CustomQuestionJournal } from "./CustomQuestionJournal";
import { EdgeFinderSummary } from "./EdgeFinderSummary";
import { RichJournalEditor } from "./RichJournalEditor";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useAuth } from "@/hooks/useAuth";
import { useTrades } from "@/hooks/useTrades";
import { useJournalEntries } from "@/hooks/useJournalEntries";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useTradingProfiles } from "@/hooks/useTradingProfiles";
import BlotFormatter from "quill-blot-formatter";
import { toast } from "sonner";

// Register image resize/move module once
try {
  // @ts-ignore
  Quill.register("modules/blotFormatter", BlotFormatter);
  // Register custom font whitelist
  // @ts-ignore
  const Font = Quill.import('formats/font');
  // Allow standard plus our custom font keys used in CSS
  Font.whitelist = ['sans-serif','serif','monospace','playfair','lora','robotomono'];
  Quill.register(Font, true);
} catch {}

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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [customAnswers, setCustomAnswers] = useState<Record<number, string>>({});
  const [edgeFinderResponses, setEdgeFinderResponses] = useState<any>(null);
  const [edgeFinderCompleted, setEdgeFinderCompleted] = useState(false);
  const [edgeEditOpen, setEdgeEditOpen] = useState(false);
  const [isScratchpadEditing, setIsScratchpadEditing] = useState(false);
  
  // Ref for main journal quill editor
  const mainJournalRef = useRef<ReactQuill | null>(null);
  
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

  const imageHandler = () => {
    return function(this: any) {
      const input = document.createElement('input');
      input.setAttribute('type', 'file');
      input.setAttribute('accept', 'image/*');
      input.click();

      input.onchange = async () => {
        const file = input.files?.[0];
        if (file && uploadImage) {
          const url = await uploadImage(file);
          if (url && mainJournalRef.current) {
            const quill = mainJournalRef.current.getEditor();
            const range = quill.getSelection(true);
            quill.insertEmbed(range.index, 'image', url);
          }
        }
      };
    };
  };

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
    setIsScratchpadEditing(false);

    // Check if Edge Finder wizard was completed for this trade
    const edgeFinderComplete = localStorage.getItem(`edge_finder_complete_${currentTrade.id}`);
    const savedEdgeFinderData = localStorage.getItem(`edge_finder_${currentTrade.id}`);
    
    if (edgeFinderComplete && savedEdgeFinderData) {
      setEdgeFinderCompleted(true);
      setEdgeFinderResponses(JSON.parse(savedEdgeFinderData));
    } else {
      setEdgeFinderCompleted(false);
      setEdgeFinderResponses(null);
    }

    // Then load from entry if it exists for this specific trade
    if (entry?.content && entry.trade_id === currentTrade.id) {
      const content = entry.content as any;

      if ((entry as any).entry_type === 'scratchpad') {
        setAdditionalComments(content?.html || "");
      } else {
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
    }
}, [selectedTrade?.date?.toISOString(), selectedTrade?.symbol, currentTrade?.id, entry?.trade_id, activeProfile?.id]);

  // Auto-save trade basic fields
  useEffect(() => {
    if (currentTrade?.id && selectedProfile && user?.id) {
      const timeoutId = setTimeout(() => {
        saveTrade({
          id: currentTrade.id,
          profile_id: selectedProfile,
          user_id: user.id,
          symbol: currentTrade.symbol,
          profit: currentTrade.profit,
          date: currentTrade.date.toISOString().split('T')[0],
          side: currentTrade.side,
          quantity: currentTrade.quantity,
          entry_price: currentTrade.entryPrice,
          exit_price: currentTrade.exitPrice,
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
      if (currentTrade.symbol === 'SCRATCHPAD') {
        const scratchContent = { html: additionalComments };
        if (entry?.content && JSON.stringify(entry.content) === JSON.stringify(scratchContent)) {
          return;
        }
        updateEntry(scratchContent, 'free_form');
        return;
      }

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
      bias, regime, vwap, keyLevels, volume, fixTomorrow, additionalComments, currentTrade?.symbol]);

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

  // Handle clipboard image paste (image blobs)
  useEffect(() => {
    const quill = (mainJournalRef.current as any)?.getEditor?.();
    const root = quill?.root as HTMLElement | undefined;
    if (!quill || !root) return;
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          if (!blob) continue;
          if (uploadImage) {
            e.preventDefault();
            const file = new File([blob], 'pasted-image.png', { type: blob.type });
            const url = await uploadImage(file);
            if (url) {
              const range = quill.getSelection(true);
              quill.insertEmbed(range?.index ?? 0, 'image', url);
            }
          }
        }
      }
    };
    root.addEventListener('paste', handlePaste as any);
    return () => root.removeEventListener('paste', handlePaste as any);
  }, [isOpen, uploadImage]);

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
    toolbar: {
      container: [
        [{ font: [] }, { size: ["small", false, "large", "huge"] }],
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline"],
        [{ color: [] }, { background: [] }],
        ["image"],
        ["clean"],
      ],
      handlers: {
        image: imageHandler(),
      },
    },
    blotFormatter: {},
    clipboard: {
      matchVisual: false,
      matchers: [
        ["img", (node: any, delta: any) => {
          const image = node;
          const imageUrl = image.getAttribute("src");
          if (imageUrl && imageUrl.startsWith("data:image")) {
            fetch(imageUrl)
              .then((res) => res.blob())
              .then((blob) => {
                const file = new File([blob], "pasted-image.png", { type: blob.type });
                if (uploadImage) {
                  uploadImage(file).then((url) => {
                    if (url && mainJournalRef.current) {
                      const quill = mainJournalRef.current.getEditor();
                      const range = quill.getSelection(true);
                      quill.deleteText(range.index - 1, 1);
                      quill.insertEmbed(range.index - 1, "image", url);
                    }
                  });
                }
              });
            return { ops: [] };
          }
          return delta;
        }],
      ],
    },
  } as const;

  const formats = [
    "header",
    "font",
    "size",
    "bold",
    "italic",
    "underline",
    "color",
    "background",
    "image",
    "clean",
  ];

  const getPnLColor = () => {
    if (totalPnL > 0) return "text-green-400";
    if (totalPnL < 0) return "text-red-400";
    return "text-muted-foreground";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] h-[85vh] p-0 bg-transparent border-none shadow-none">
        <div className="sr-only">
          <h2>Trade Details</h2>
        </div>
        <div className="flex gap-6 h-full min-h-0">
          {/* Left side - Trade Details */}
          <div className="w-[250px] bg-muted rounded-xl p-6 space-y-4 overflow-y-auto">
            <h2
              className={`text-xl mb-6 ${dayTrades[0]?.symbol === 'SCRATCHPAD' ? 'text-warning' : 'text-white'}`}
              style={{ fontWeight: 700, fontFamily: "Inter" }}
            >
              {dayTrades[0]?.symbol === 'SCRATCHPAD' ? 'Scratchpad' : 'Trade Details'}
            </h2>

            {dayTrades[0]?.symbol === 'SCRATCHPAD' ? (
              <div className="text-sm text-muted-foreground">
                View your trading notes and ideas for this day.
              </div>
            ) : (
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
                Delete {dayTrades[0]?.symbol === 'SCRATCHPAD' ? 'Scratchpad' : 'Trade'}
              </Button>
            </div>
            )}
          </div>

          {/* Right side - Edge Tags and Journal */}
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            {/* Edge Tags */}
            {dayTrades[0]?.symbol !== 'SCRATCHPAD' && (
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
            )}

            {/* Journal Section */}
            <div className="flex-1 min-h-0 bg-muted rounded-xl p-6 overflow-y-auto">
              {dayTrades[0]?.symbol === 'SCRATCHPAD' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Scratchpad Notes</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsScratchpadEditing(true);
                        toast.success("Editing enabled");
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    </Button>
                  </div>
                  <div className={isScratchpadEditing ? "[&_.ql-editor]:text-white" : "[&_.ql-editor]:text-white [&_.ql-toolbar]:hidden"}>
                    <RichJournalEditor
                      value={additionalComments}
                      onChange={setAdditionalComments}
                      onImageUpload={uploadImage}
                      height={600}
                      readOnly={!isScratchpadEditing}
                    />
                  </div>
                </div>
              ) : selectedProfile === "default" && (
                <div className="space-y-4 mb-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (!edgeFinderResponses) {
                        setEdgeFinderResponses({
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
                      }
                      setEdgeEditOpen(true);
                    }}
                    className="border-border"
                  >
                    Discover My Edge
                  </Button>
                  {edgeFinderResponses && (
                    <EdgeFinderSummary
                      responses={edgeFinderResponses}
                      onUpdate={(updatedResponses) => {
                        setEdgeFinderResponses(updatedResponses);
                        setEdgeFinderCompleted(true);
                        localStorage.setItem(`edge_finder_${currentTrade?.id}`, JSON.stringify(updatedResponses));
                      }}
                      open={edgeEditOpen}
                      onOpenChange={setEdgeEditOpen}
                    />
                  )}
                </div>
              )}

              {dayTrades[0]?.symbol !== 'SCRATCHPAD' && selectedProfile !== "default" ? (
                <CustomQuestionJournal
                  questions={profileQuestions}
                  answers={customAnswers}
                  onAnswerChange={(index, value) => {
                    setCustomAnswers(prev => ({ ...prev, [index]: value }));
                  }}
                  onImageUpload={uploadImage}
                />
              ) : dayTrades[0]?.symbol !== 'SCRATCHPAD' ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-foreground">Journal Entry</label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Write a detailed reason for taking this trade. Future you will need this context when reviewing performance.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <RichJournalEditor
                    value={additionalComments}
                    onChange={setAdditionalComments}
                    onImageUpload={uploadImage}
                    height={420}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>

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
