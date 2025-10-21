import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

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

  const handleAddEdge = () => {
    if (newEdge.trim() && !edges.includes(newEdge.trim())) {
      onEdgesChange([...edges, newEdge.trim()]);
      onEdgeSelect(newEdge.trim());
      setNewEdge("");
      setIsAddingNew(false);
    }
  };

  const handleDeleteEdge = (edgeToDelete: string) => {
    const updatedEdges = edges.filter(e => e !== edgeToDelete);
    onEdgesChange(updatedEdges);
    // Also remove from selected if it was selected
    if (selectedEdges.includes(edgeToDelete)) {
      onEdgeSelect(edgeToDelete);
    }
  };

  return (
    <div className="space-y-3">
      <Select
        onValueChange={(value) => {
          if (value === "__add_new__") {
            setIsAddingNew(true);
          } else {
            onEdgeSelect(value);
          }
        }}
      >
        <SelectTrigger className="bg-background rounded-lg">
          <SelectValue placeholder="Select edges" />
        </SelectTrigger>
        <SelectContent className="bg-background">
          {edges.map((edge) => (
            <SelectItem key={edge} value={edge} className="group">
              <div className="flex items-center justify-between w-full">
                <span>{edge}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteEdge(edge);
                  }}
                  className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-red-400 hover:text-red-300" />
                </button>
              </div>
            </SelectItem>
          ))}
          <SelectItem value="__add_new__" className="text-primary font-semibold">
            Add new tag
          </SelectItem>
        </SelectContent>
      </Select>

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
