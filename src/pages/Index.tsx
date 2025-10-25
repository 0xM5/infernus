import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTradingProfiles } from "@/hooks/useTradingProfiles";
import { useTrades } from "@/hooks/useTrades";
import { supabase } from "@/integrations/supabase/client";
import { JournalButton } from "@/components/JournalButton";
import { TradeCalendar } from "@/components/TradeCalendar";
import { TradeProviderModal } from "@/components/TradeProviderModal";
import { SettingsModalNew } from "@/components/SettingsModalNew";
import { CreateProfileModal } from "@/components/CreateProfileModal";
import { QuestionEditorModal } from "@/components/QuestionEditorModal";
import { PnLChartModal } from "@/components/PnLChartModal";
import { EdgeShowerBox } from "@/components/EdgeShowerBox";
import { StudyTradesModal } from "@/components/StudyTradesModal";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Upload, Info, Settings, TrendingUp, LogOut } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { parseTradeFile } from "@/utils/tradeParser";
import { toast } from "sonner";
import { getEstimatedCommission } from "@/utils/commissionEstimates";
import { format } from "date-fns";

export interface Trade {
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
}

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { profiles, activeProfile, setActiveProfile, createProfile, updateProfile, deleteProfile, loading: profilesLoading } = useTradingProfiles(user?.id);
  const { trades: dbTrades, bulkImportTrades, loading: tradesLoading } = useTrades(activeProfile?.id, user?.id);
  
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Convert DB trades to display format
  const trades: Trade[] = dbTrades.map(t => ({
    id: t.id,
    date: new Date(t.date),
    profit: t.profit,
    symbol: t.symbol,
    side: t.side as "LONG" | "SHORT" | undefined,
    quantity: t.quantity || undefined,
    entryPrice: t.entry_price || undefined,
    exitPrice: t.exit_price || undefined,
  }));
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [isYearlyView, setIsYearlyView] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState("default");
  const [currentProfileName, setCurrentProfileName] = useState("");
  const [currentProfileId, setCurrentProfileId] = useState("");
  const [showPnLChart, setShowPnLChart] = useState(false);
  const [edgeShowerEnabled, setEdgeShowerEnabled] = useState(false);
  const [showStudyTrades, setShowStudyTrades] = useState(false);
  const [studyEdge, setStudyEdge] = useState<{ edge: string; wins: number; losses: number } | null>(null);
  const [edgesVersion, setEdgesVersion] = useState(0);
  const [useCommission, setUseCommission] = useState(false);
  const [userProfile, setUserProfile] = useState<{ nickname: string | null; account_expires_at: string | null } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('nickname, account_expires_at')
          .eq('id', user.id)
          .single();
        
        if (data) {
          setUserProfile(data);
        }
      }
    };
    
    fetchUserProfile();
  }, [user]);

  // Create default profile if none exist - with safety check
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (!profilesLoading && profiles.length === 0 && user && !loading) {
      // Wait a bit to ensure fetch is complete
      timeoutId = setTimeout(() => {
        // Double-check profiles are still empty
        if (profiles.length === 0) {
          createProfile("Profile 1");
        }
      }, 500);
    }
    
    return () => clearTimeout(timeoutId);
  }, [profilesLoading, profiles.length, user, loading]);

  const formatExpirationDate = () => {
    if (!userProfile?.account_expires_at) {
      return <span className="text-yellow-400">Unlimited Access</span>;
    }
    
    const expiryDate = new Date(userProfile.account_expires_at);
    return format(expiryDate, "EEEE, MMMM d 'at' h:mmaaa 'EST'");
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  useEffect(() => {
    const saved = localStorage.getItem("edgeShowerEnabled");
    if (saved) {
      setEdgeShowerEnabled(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    const handler = () => setEdgesVersion((v) => v + 1);
    window.addEventListener("tradeEdgesUpdated", handler);
    return () => window.removeEventListener("tradeEdgesUpdated", handler);
  }, []);
  const handleEdgeShowerChange = (enabled: boolean) => {
    setEdgeShowerEnabled(enabled);
    localStorage.setItem("edgeShowerEnabled", JSON.stringify(enabled));
  };

  const handleStudyClick = (edge: string, wins: number, losses: number) => {
    setStudyEdge({ edge, wins, losses });
    setShowStudyTrades(true);
  };

  const getTradesWithEdge = (edge: string) => {
    return trades.filter(trade => {
      const tradeData = localStorage.getItem(`trade_${trade.date.toISOString()}_${trade.symbol}`);
      if (tradeData) {
        const parsedData = JSON.parse(tradeData);
        return parsedData.edges && Array.isArray(parsedData.edges) && parsedData.edges.includes(edge);
      }
      return false;
    });
  };
  
  const getMonthlyStats = () => {
    const currentMonth = calendarDate.getMonth();
    const currentYear = calendarDate.getFullYear();
    
    const monthlyTrades = trades.filter(trade => {
      const tradeDate = new Date(trade.date);
      if (isYearlyView) {
        return tradeDate.getFullYear() === currentYear;
      } else {
        return tradeDate.getMonth() === currentMonth && tradeDate.getFullYear() === currentYear;
      }
    });
    
    // Apply commissions if enabled (divide by 2, then subtract per contract)
    const tradesWithCommissions = useCommission && activeProfile?.commission
      ? monthlyTrades.map(trade => {
          const commissionPerContract = activeProfile.commission / 2;
          const totalCommission = commissionPerContract * (trade.quantity || 1);
          return {
            ...trade,
            profit: trade.profit - totalCommission
          };
        })
      : monthlyTrades;
    
    const totalPnL = tradesWithCommissions.reduce((sum, trade) => sum + trade.profit, 0);
    const winningTrades = tradesWithCommissions.filter(trade => trade.profit > 0);
    const losingTrades = tradesWithCommissions.filter(trade => trade.profit < 0);
    const winners = winningTrades.length;
    const losers = losingTrades.length;
    const total = winners + losers;
    const winnerPercentage = total > 0 ? (winners / total) * 100 : 50;
    
    // Calculate average winners and losers
    const avgWinner = winners > 0 ? winningTrades.reduce((sum, trade) => sum + trade.profit, 0) / winners : 0;
    const avgLoser = losers > 0 ? losingTrades.reduce((sum, trade) => sum + trade.profit, 0) / losers : 0;
    const profitRatio = avgLoser !== 0 ? Math.abs(avgWinner / avgLoser) : 0;
    
    return { totalPnL, winners, losers, winnerPercentage, avgWinner, avgLoser, profitRatio };
  };
  
  const monthlyStats = getMonthlyStats();

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.txt') && !file.name.endsWith('.csv')) {
      toast.error("Please select a .txt or .csv file");
      return;
    }

    if (!activeProfile || !user) {
      toast.error("Please wait for profile to load...");
      return;
    }

    try {
      const text = await file.text();
      const parsedTrades = parseTradeFile(text);
      
      if (parsedTrades.length === 0) {
        toast.error("No trades found in the file. Please check the format.");
        return;
      }
      
      const formattedTrades = parsedTrades.map(trade => ({
        profile_id: activeProfile.id,
        user_id: user.id,
        date: format(trade.date, 'yyyy-MM-dd'),
        profit: trade.profit,
        symbol: trade.symbol,
        side: trade.side,
        quantity: trade.quantity,
        entry_price: trade.entryPrice,
        exit_price: trade.exitPrice,
      }));

      await bulkImportTrades(formattedTrades);
    } catch (error) {
      console.error("Error parsing file:", error);
      toast.error("Error parsing trade file");
    }
  };

  if (loading || profilesLoading) {
    return (
      <div className="min-h-screen w-full bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-8">
      <div className="relative">
        {/* Purple gradient glow */}
        <div className="absolute inset-0 bg-gradient-purple blur-3xl opacity-70 rounded-3xl" />
        
        {/* Main container */}
        <div
          className={`relative bg-card border border-border rounded-3xl transition-all duration-500 ${
            isExpanded ? `w-[90vw] ${edgeShowerEnabled ? 'h-auto' : 'h-[85vh]'} p-8` : "w-[600px] h-[400px] p-12"
          } flex ${isExpanded ? "flex-col" : "items-center justify-center"}`}
        >
          {!isExpanded ? (
            <JournalButton onClick={() => setIsExpanded(true)} />
          ) : (
            <div className="space-y-6 h-full flex flex-col">
              <div className="flex items-center justify-between">
                <div className="space-y-4">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground" style={{ fontWeight: 700 }}>
                      Infernus Beta <span style={{ color: 'rgb(77, 77, 77)' }}>v0.01b</span>
                    </h1>
                    <div className="text-sm text-muted-foreground mt-1">
                      Expires On: {formatExpirationDate()}
                    </div>
                  </div>
                  
                  <div className="flex gap-4 items-center">
                    {/* Monthly/Total PnL Box */}
                    <div className="bg-card border border-border rounded-lg px-6 py-3">
                      <div className="text-sm text-muted-foreground mb-1" style={{ fontWeight: 600 }}>
                        {isYearlyView ? 'Total PnL' : 'Monthly PnL'}
                      </div>
                      <div className={`text-2xl font-bold ${monthlyStats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`} style={{ fontWeight: 800 }}>
                        {monthlyStats.totalPnL >= 0 ? '$' : '-$'}{Math.abs(monthlyStats.totalPnL).toFixed(2)}
                      </div>
                    </div>
                    
                    {/* Winners/Losers Box */}
                    <div className="space-y-3">
                      <div className="bg-card border border-border rounded-lg px-4 py-2">
                        <div className="flex gap-6 items-center">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1" style={{ fontWeight: 600 }}>Winners</div>
                            <div className="text-lg font-bold text-green-400 border border-green-500/30 rounded px-2 py-0.5 inline-block" style={{ fontWeight: 700 }}>
                              {monthlyStats.winners}
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-center gap-2">
                            <div className="relative w-32 h-3 bg-red-500 rounded-full overflow-hidden">
                              <div 
                                className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                                style={{ width: `${monthlyStats.winnerPercentage}%` }}
                              />
                            </div>
                            <div className="text-xs text-muted-foreground/60 mt-1" style={{ fontWeight: 500 }}>
                              Win Rate: {monthlyStats.winnerPercentage.toFixed(0)}%
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-xs text-muted-foreground mb-1" style={{ fontWeight: 600 }}>Losers</div>
                            <div className="text-lg font-bold text-red-400 border border-red-500/30 rounded px-2 py-0.5 inline-block" style={{ fontWeight: 700 }}>
                              {monthlyStats.losers}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Open PnL Chart Button */}
                      <Button
                        onClick={() => setShowPnLChart(true)}
                        className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"
                        variant="outline"
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Open PnL Chart
                      </Button>
                    </div>

                    {/* Profit Ratio Box */}
                    <div className="bg-card border border-border rounded-lg px-4 py-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="text-xs text-muted-foreground" style={{ fontWeight: 600 }}>Win/Loss Ratio</div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="w-3.5 h-3.5 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Average outcome of all trades</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-2xl font-bold text-foreground" style={{ fontWeight: 800 }}>
                          {monthlyStats.profitRatio.toFixed(2)}
                        </div>
                        {/* Semi-circle visualization */}
                        <div className="relative w-12 h-6 overflow-hidden">
                          <div 
                            className="w-12 h-12 rounded-full"
                            style={{
                              background: `conic-gradient(from 180deg, #f87171 0deg ${((monthlyStats.avgWinner / (monthlyStats.avgWinner + Math.abs(monthlyStats.avgLoser))) * 180)}deg, #4ade80 ${((monthlyStats.avgWinner / (monthlyStats.avgWinner + Math.abs(monthlyStats.avgLoser))) * 180)}deg 180deg)`
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="text-sm font-semibold text-green-400">
                          ${monthlyStats.avgWinner.toFixed(1)}
                        </div>
                        <div className="text-sm font-semibold text-red-400">
                          -${Math.abs(monthlyStats.avgLoser).toFixed(1)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-4 items-center justify-end">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowSettings(true)}
                    className="border-border"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                  <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-4 py-2">
                    <span className="text-sm text-muted-foreground" style={{ fontWeight: 600 }}>Monthly</span>
                    <Switch 
                      checked={isYearlyView} 
                      onCheckedChange={setIsYearlyView}
                    />
                    <span className="text-sm text-muted-foreground" style={{ fontWeight: 600 }}>Yearly</span>
                  </div>
                  <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-4 py-2">
                    <span className="text-sm text-muted-foreground" style={{ fontWeight: 600 }}>Commission</span>
                    <Switch 
                      checked={useCommission} 
                      onCheckedChange={setUseCommission}
                    />
                  </div>
                  <Button
                    variant="default"
                    className="cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => document.getElementById("file-upload")?.click()}
                  >
                    <div className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Import Trades
                    </div>
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".txt,.csv"
                    onChange={handleFileImport}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => setIsExpanded(false)}
                    className="border-border"
                  >
                    Collapse
                  </Button>
                </div>
              </div>

              {edgeShowerEnabled && (
                <div className="flex justify-center">
                  <EdgeShowerBox 
                    trades={useCommission 
                      ? trades.map(trade => {
                          const commissionValue = parseFloat(localStorage.getItem("userCommission") || "0");
                          return {
                            ...trade,
                            profit: trade.profit - commissionValue
                          };
                        })
                      : trades
                    }
                    onStudyClick={handleStudyClick}
                    refreshKey={edgesVersion}
                  />
                </div>
              )}

              <div className="w-full max-w-[1370px] mx-auto" style={{ maxHeight: '758px' }}>
                <TradeCalendar
                  trades={useCommission
                    ? trades.map(trade => {
                        const commissionValue = parseFloat(localStorage.getItem("userCommission") || "0");
                        return {
                          ...trade,
                          profit: trade.profit - commissionValue
                        };
                      })
                    : trades
                  }
                  currentDate={calendarDate}
                  setCurrentDate={setCalendarDate}
                  selectedProfile={selectedProfile}
                />
              </div>

            </div>
          )}
        </div>
        
        {/* Beta Footer and Logout - inside main container, only when expanded */}
        {isExpanded && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-full max-w-[1370px] px-8">
            <div className="flex flex-col items-center gap-3">
              <div className="bg-secondary border border-border rounded-xl px-4 py-3 text-center text-sm text-muted-foreground w-full">
                <span>Infernus is currently in private beta. If you find any bugs, have questions or suggestions, contact my discord here:</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('mfve');
                    toast.success('Discord username copied to clipboard!');
                  }}
                  className="inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors cursor-pointer ml-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 127.14 96.36"
                    className="w-5 h-5"
                    fill="currentColor"
                  >
                    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
                  </svg>
                  <span className="font-medium">mfve</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{userProfile?.nickname || 'User'}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="border-border hover:bg-destructive hover:text-destructive-foreground"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      
      <SettingsModalNew
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onCreateProfile={() => setShowCreateProfile(true)}
        selectedProfile={selectedProfile}
        onProfileChange={setSelectedProfile}
        edgeShowerEnabled={edgeShowerEnabled}
        onEdgeShowerChange={handleEdgeShowerChange}
        activeProfile={activeProfile}
        profiles={profiles}
        onActiveProfileChange={setActiveProfile}
        onCreateAccountProfile={async () => {
          const newProfile = await createProfile(`Profile ${profiles.length + 1}`);
          if (newProfile) {
            setActiveProfile(newProfile);
          }
        }}
        onDeleteAccountProfile={async (id) => {
          await deleteProfile(id);
        }}
        onUpdateAccountProfile={updateProfile}
      />

      <StudyTradesModal
        isOpen={showStudyTrades}
        onClose={() => {
          setShowStudyTrades(false);
          setStudyEdge(null);
        }}
        edge={studyEdge?.edge || ""}
        trades={studyEdge ? getTradesWithEdge(studyEdge.edge) : []}
        winCount={studyEdge?.wins || 0}
        lossCount={studyEdge?.losses || 0}
      />

      <CreateProfileModal
        isOpen={showCreateProfile}
        onClose={() => setShowCreateProfile(false)}
        onCreateSuccess={(profileId) => setSelectedProfile(profileId)}
        onOpenQuestionEditor={(name, id) => {
          setCurrentProfileName(name);
          setCurrentProfileId(id);
          setShowQuestionEditor(true);
        }}
      />

      <QuestionEditorModal
        isOpen={showQuestionEditor}
        onClose={() => setShowQuestionEditor(false)}
        profileName={currentProfileName}
        profileId={currentProfileId}
        onSave={(profileId) => setSelectedProfile(profileId)}
        onCancel={() => setShowSettings(true)}
      />

      <PnLChartModal
        isOpen={showPnLChart}
        onClose={() => setShowPnLChart(false)}
        trades={useCommission 
          ? trades.map(trade => {
              const commissionValue = parseFloat(localStorage.getItem("userCommission") || "0");
              return {
                ...trade,
                profit: trade.profit - commissionValue
              };
            })
          : trades
        }
        isYearlyView={isYearlyView}
        currentDate={calendarDate}
      />
    </div>
  );
};

export default Index;
