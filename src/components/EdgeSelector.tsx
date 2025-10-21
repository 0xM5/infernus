import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface EdgeSelectorProps {
  edges: string[];
  selectedEdges: string[];
  onEdgesChange: (edges: string[]) => void;
  onEdgeSelect: (edge: string) => void;
}

export const EdgeSelector = ({
  edges,
  selectedEdges,
  onEdgesChange,
  onEdgeSelect,
}: EdgeSelectorProps) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newEdge, setNewEdge] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleAddEdge = () => {
    if (newEdge.trim() && !edges.includes(newEdge.trim())) {
      onEdgesChange([...edges, newEdge.trim()]);
      onEdgeSelect(newEdge.trim());
      setNewEdge("");
      setIsAddingNew(false);
    }
  };

  const handleDeleteEdge = (edgeToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedEdges = edges.filter(edge => edge !== edgeToDelete);
    onEdgesChange(updatedEdges);
    // Also remove from selected if it was selected
    if (selectedEdges.includes(edgeToDelete)) {
      onEdgeSelect(edgeToDelete);
    }
  };

  return (
    <div className="space-y-3">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between bg-background rounded-lg"
          >
            <span className="text-muted-foreground">Select edges</span>
            <svg
              className="w-4 h-4 opacity-50"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-2 bg-background" align="start">
          <div className="space-y-1">
            {edges.map((edge) => (
              <div
                key={edge}
                className="flex items-center justify-between p-2 hover:bg-accent rounded-md cursor-pointer group"
                onClick={() => {
                  onEdgeSelect(edge);
                  setIsOpen(false);
                }}
              >
                <span>{edge}</span>
                <button
                  onClick={(e) => handleDeleteEdge(edge, e)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/20 rounded"
                >
                  <X className="w-3.5 h-3.5 text-destructive" />
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                setIsAddingNew(true);
                setIsOpen(false);
              }}
              className="w-full text-left p-2 text-primary font-semibold hover:bg-accent rounded-md"
            >
              Add new tag
            </button>
          </div>
        </PopoverContent>
      </Popover>

      {isAddingNew && (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter new edge tag"
            value={newEdge}
            onChange={(e) => setNewEdge(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAddEdge();
              } else if (e.key === "Escape") {
                setIsAddingNew(false);
                setNewEdge("");
              }
            }}
            className="flex-1 px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
          />
          <button
            onClick={handleAddEdge}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors"
          >
            Add
          </button>
        </div>
      )}

      {selectedEdges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedEdges.map((edge) => (
            <div
              key={edge}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-primary text-primary-foreground"
            >
              <span>{edge}</span>
              <button
                onClick={() => onEdgeSelect(edge)}
                className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
