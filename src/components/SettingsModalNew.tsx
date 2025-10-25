import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTradingProfiles, TradingProfile } from "@/hooks/useTradingProfiles";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, X, Pencil, Check, LogOut, Info } from "lucide-react";
import { DeleteProfileModal } from "./DeleteProfileModal";
import { toast } from "sonner";
import { useToast } from "@/hooks/use-toast";

interface QuestionProfile {
  id: string;
  name: string;
  questions: string[];
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProfile: () => void;
  selectedProfile: string;
  onProfileChange: (profileId: string) => void;
  edgeShowerEnabled: boolean;
  onEdgeShowerChange: (enabled: boolean) => void;
  activeProfile: TradingProfile | null;
  profiles: TradingProfile[];
  onActiveProfileChange: (profile: TradingProfile) => void;
  onCreateAccountProfile: () => Promise<void>;
  onDeleteAccountProfile: (id: string) => Promise<void>;
  onUpdateAccountProfile: (id: string, updates: Partial<TradingProfile>) => Promise<void>;
}

export const SettingsModalNew = ({
  isOpen,
  onClose,
  onCreateProfile,
  selectedProfile,
  onProfileChange,
  edgeShowerEnabled,
  onEdgeShowerChange,
  activeProfile,
  profiles,
  onActiveProfileChange,
  onCreateAccountProfile,
  onDeleteAccountProfile,
  onUpdateAccountProfile,
}: SettingsModalProps) => {
  const { toast: toastHook } = useToast();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [questionProfiles, setQuestionProfiles] = useState<QuestionProfile[]>([
    { id: "default", name: "Default", questions: [] }
  ]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<TradingProfile | null>(null);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [commission, setCommission] = useState("");
  const [deleteQuestionProfileId, setDeleteQuestionProfileId] = useState<string | null>(null);
  const [bgHue, setBgHue] = useState(263);
  const [bgSaturation, setBgSaturation] = useState(70);
  const [bgLightness, setBgLightness] = useState(50);
  const [secondaryHue, setSecondaryHue] = useState(0);
  const [secondarySaturation, setSecondarySaturation] = useState(84);
  const [secondaryLightness, setSecondaryLightness] = useState(60);
  const [gradientPopoverOpen, setGradientPopoverOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const savedProfiles = localStorage.getItem("questionProfiles");
    if (savedProfiles) {
      const parsed = JSON.parse(savedProfiles);
      setQuestionProfiles([{ id: "default", name: "Default", questions: [] }, ...parsed]);
    }

    if (activeProfile) {
      setCommission(activeProfile.commission?.toString() || "0");
    }

    // Load saved gradient or use defaults
    const savedGradient = localStorage.getItem("customGradient");
    if (savedGradient) {
      const gradient = JSON.parse(savedGradient);
      setBgHue(gradient.bgHue);
      setBgSaturation(gradient.bgSaturation);
      setBgLightness(gradient.bgLightness);
      setSecondaryHue(gradient.secondaryHue);
      setSecondarySaturation(gradient.secondarySaturation);
      setSecondaryLightness(gradient.secondaryLightness);
    }
  }, [isOpen, activeProfile]);

  const handleCreateAccountProfile = async () => {
    if (profiles.length >= 3) {
      toast.error("Maximum 3 profiles allowed");
      return;
    }
    await onCreateAccountProfile();
  };

  const handleDeleteProfile = (profile: TradingProfile) => {
    setProfileToDelete(profile);
    setDeleteModalOpen(true);
  };

  const confirmDeleteProfile = async () => {
    if (!profileToDelete) return;
    
    if (profiles.length === 1) {
      toast.error("You must have at least one profile");
      setDeleteModalOpen(false);
      setProfileToDelete(null);
      return;
    }
    
    await onDeleteAccountProfile(profileToDelete.id);
    setDeleteModalOpen(false);
    setProfileToDelete(null);
  };

  const handleCommissionChange = async (value: string) => {
    setCommission(value);
    if (activeProfile) {
      await onUpdateAccountProfile(activeProfile.id, { commission: parseFloat(value) || 0 });
    }
  };

  const handleStartRename = (profile: TradingProfile) => {
    setEditingProfileId(profile.id);
    setEditingName(profile.name);
  };

  const handleSaveRename = async () => {
    if (!editingProfileId) return;
    
    const trimmedName = editingName.trim();
    if (!trimmedName) {
      toast.error("Profile name cannot be empty");
      return;
    }
    
    await onUpdateAccountProfile(editingProfileId, { name: trimmedName });
    setEditingProfileId(null);
    setEditingName("");
  };

  const handleCancelRename = () => {
    setEditingProfileId(null);
    setEditingName("");
  };

  const handleDeleteQuestionProfile = (profileId: string) => {
    setDeleteQuestionProfileId(profileId);
  };

  const confirmDeleteQuestionProfile = () => {
    if (!deleteQuestionProfileId) return;
    
    const updatedProfiles = questionProfiles.filter(p => p.id !== deleteQuestionProfileId);
    const customProfiles = updatedProfiles.filter(p => p.id !== "default");
    localStorage.setItem("questionProfiles", JSON.stringify(customProfiles));
    setQuestionProfiles(updatedProfiles);
    
    if (selectedProfile === deleteQuestionProfileId) {
      onProfileChange("default");
    }
    
    setDeleteQuestionProfileId(null);
    toast.success("Question profile deleted");
  };

  const handleLogout = async () => {
    await signOut();
    toast.success("Logged out successfully");
    onClose();
    navigate("/auth");
  };

  const applyGradient = () => {
    const gradient = {
      bgHue,
      bgSaturation,
      bgLightness,
      secondaryHue,
      secondarySaturation,
      secondaryLightness,
    };
    localStorage.setItem("customGradient", JSON.stringify(gradient));
    
    // Update CSS variables so the background updates immediately
    const start = `${bgHue} ${bgSaturation}% ${bgLightness}%`;
    const end = `${secondaryHue} ${secondarySaturation}% ${secondaryLightness}%`;
    document.documentElement.style.setProperty('--background-gradient-start', start);
    document.documentElement.style.setProperty('--background-gradient-end', end);
    
    setGradientPopoverOpen(false);
    toast.success("Background updated");
  };

  const resetToDefaultGradient = () => {
    setBgHue(263);
    setBgSaturation(70);
    setBgLightness(50);
    setSecondaryHue(0);
    setSecondarySaturation(84);
    setSecondaryLightness(60);
    
    localStorage.removeItem("customGradient");
    document.documentElement.style.setProperty('--background-gradient-start', '263 70% 50%');
    document.documentElement.style.setProperty('--background-gradient-end', '0 84% 60%');
    
    setGradientPopoverOpen(false);
    toast.success("Reset to default gradient");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] animate-scale-in bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Trade Account Profile</label>
            <RadioGroup value={activeProfile?.id} onValueChange={(id) => {
              const profile = profiles.find(p => p.id === id);
              if (profile) onActiveProfileChange(profile);
            }}>
              <div className="space-y-2">
                {profiles.map((profile) => (
                  <div 
                    key={profile.id} 
                    className={`flex items-center gap-2 bg-background border rounded-lg px-4 py-2 transition-colors ${
                      activeProfile?.id === profile.id ? 'border-primary' : 'border-border'
                    }`}
                  >
                    <RadioGroupItem value={profile.id} id={profile.id} />
                    <Label 
                      htmlFor={profile.id} 
                      className="flex-1 cursor-pointer"
                    >
                      {editingProfileId === profile.id ? (
                        <div className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename();
                              if (e.key === 'Escape') handleCancelRename();
                            }}
                            className="h-7 text-sm"
                            autoFocus
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleSaveRename}
                            className="h-7 w-7 hover:bg-primary/20 hover:text-primary"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm text-foreground">{profile.name}</span>
                      )}
                    </Label>
                    {editingProfileId !== profile.id && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleStartRename(profile)}
                          className="h-7 w-7 hover:bg-primary/20 hover:text-primary"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteProfile(profile)}
                          className="h-7 w-7 hover:bg-destructive/20 hover:text-destructive"
                          disabled={profiles.length === 1}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </RadioGroup>
            <Button
              variant="outline"
              className="w-full border-border mt-2"
              onClick={handleCreateAccountProfile}
              disabled={profiles.length >= 3}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Profile {profiles.length >= 3 && "(Max 3)"}
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-foreground">Commission</label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3.5 h-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Your round-trip fees per buy/sell</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                type="number"
                placeholder="Round-trip fee per trade"
                value={commission}
                onChange={(e) => handleCommissionChange(e.target.value)}
                className="bg-background border-border pl-7"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Question Profile</label>
            <Select value={selectedProfile} onValueChange={onProfileChange}>
              <SelectTrigger className="w-full bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {questionProfiles.map((profile) => (
                  <div key={profile.id} className="flex items-center group hover:bg-accent">
                    <SelectItem value={profile.id} className="flex-1">
                      {profile.name}
                    </SelectItem>
                    {profile.id !== "default" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteQuestionProfile(profile.id);
                        }}
                        className="h-7 w-7 mr-2 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
                <div className="border-t border-border mt-2 pt-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-primary hover:text-primary hover:bg-primary/10"
                    onClick={() => {
                      onClose();
                      onCreateProfile();
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Profile
                  </Button>
                </div>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Edge Shower</label>
            <div className="flex items-center justify-between bg-background border border-border rounded-lg px-4 py-3">
              <span className="text-sm text-muted-foreground">Display your best edge</span>
              <Switch 
                checked={edgeShowerEnabled} 
                onCheckedChange={() => {
                  toastHook({
                    title: "This feature is coming soon!",
                    description: "We're working on bringing you the Edge Shower feature."
                  });
                }}
                disabled
                className="opacity-50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Popover open={gradientPopoverOpen} onOpenChange={setGradientPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full border-border">
                  Customize background color
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[420px] bg-popover border-border z-50" align="start">
                <div className="space-y-4">
                  <div 
                    className="w-full h-16 rounded-lg"
                    style={{
                      backgroundImage: `linear-gradient(135deg, hsl(${bgHue} ${bgSaturation}% ${bgLightness}%), hsl(${secondaryHue} ${secondarySaturation}% ${secondaryLightness}%))`
                    }}
                  />
                  
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Primary Hue</Label>
                      <Slider
                        value={[bgHue]}
                        onValueChange={([value]) => setBgHue(value)}
                        max={360}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-xs text-muted-foreground">Primary Saturation</Label>
                      <Slider
                        value={[bgSaturation]}
                        onValueChange={([value]) => setBgSaturation(value)}
                        max={100}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-xs text-muted-foreground">Primary Lightness</Label>
                      <Slider
                        value={[bgLightness]}
                        onValueChange={([value]) => setBgLightness(value)}
                        max={100}
                        step={1}
                        className="mt-2"
                      />
                    </div>

                    <div className="pt-2 border-t border-border">
                      <Label className="text-xs text-muted-foreground">Secondary Hue</Label>
                      <Slider
                        value={[secondaryHue]}
                        onValueChange={([value]) => setSecondaryHue(value)}
                        max={360}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-xs text-muted-foreground">Secondary Saturation</Label>
                      <Slider
                        value={[secondarySaturation]}
                        onValueChange={([value]) => setSecondarySaturation(value)}
                        max={100}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-xs text-muted-foreground">Secondary Lightness</Label>
                      <Slider
                        value={[secondaryLightness]}
                        onValueChange={([value]) => setSecondaryLightness(value)}
                        max={100}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetToDefaultGradient}
                      className="flex-1"
                    >
                      Reset to Default
                    </Button>
                    <Button
                      onClick={applyGradient}
                      className="flex-1"
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="pt-4 border-t border-border">
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <DeleteProfileModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setProfileToDelete(null);
          }}
          onConfirm={confirmDeleteProfile}
          profileName={profileToDelete?.name || ""}
        />

        <AlertDialog open={!!deleteQuestionProfileId} onOpenChange={() => setDeleteQuestionProfileId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Question Profile</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this question profile? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteQuestionProfile} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
};
