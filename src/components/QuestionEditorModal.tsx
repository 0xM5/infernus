import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

interface QuestionEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileName: string;
  profileId: string;
  onSave: (profileId: string) => void;
  onCancel: () => void;
}

export const QuestionEditorModal = ({
  isOpen,
  onClose,
  profileName,
  profileId,
  onSave,
  onCancel,
}: QuestionEditorModalProps) => {
  const [questions, setQuestions] = useState<string[]>([""]); // Start with one question
  const MAX_QUESTIONS = 25;

  const addQuestion = () => {
    if (questions.length >= MAX_QUESTIONS) {
      toast.error(`Maximum of ${MAX_QUESTIONS} questions reached`);
      return;
    }
    setQuestions([...questions, ""]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length === 1) {
      toast.error("At least one question is required");
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = value;
    setQuestions(newQuestions);
  };

  const handleDone = () => {
    const validQuestions = questions.filter(q => q.trim() !== "");
    
    if (validQuestions.length === 0) {
      toast.error("Please add at least one question");
      return;
    }

    // Save to localStorage
    const savedProfiles = localStorage.getItem("questionProfiles");
    const profiles = savedProfiles ? JSON.parse(savedProfiles) : [];
    
    profiles.push({
      id: profileId,
      name: profileName,
      questions: validQuestions,
    });

    localStorage.setItem("questionProfiles", JSON.stringify(profiles));
    
    toast.success("Profile created successfully!");
    setQuestions([""]);
    onSave(profileId);
    onClose();
  };

  const handleCancel = () => {
    setQuestions([""]);
    onClose();
    onCancel();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-[700px] max-h-[85vh] animate-scale-in bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">
            {profileName} - Questions
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4 overflow-y-auto max-h-[60vh]">
          {questions.map((question, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground">
                  Question {index + 1}
                </label>
                {questions.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeQuestion(index)}
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Textarea
                value={question}
                onChange={(e) => updateQuestion(index, e.target.value)}
                placeholder="Enter your question"
                className="min-h-[100px] bg-background border-border"
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3 justify-between pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={addQuestion}
            disabled={questions.length >= MAX_QUESTIONS}
            className="border-primary text-primary hover:bg-primary/10"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Question ({questions.length}/{MAX_QUESTIONS})
          </Button>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="border-destructive text-destructive hover:bg-destructive/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDone}
              className="bg-success hover:bg-success/90 text-success-foreground"
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
