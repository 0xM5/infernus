import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  return (
    <div className="space-y-4">
      <Select
        onValueChange={(value) => {
          if (value === "__add_new__") {
            setIsAddingNew(true);
          } else {
            onEdgeSelect(value);
          }
        }}
      >
        <SelectTrigger className="bg-background">
          <SelectValue placeholder="Select edges" />
        </SelectTrigger>
        <SelectContent className="bg-background">
          {edges.map((edge) => (
            <SelectItem key={edge} value={edge}>
              {edge}
            </SelectItem>
          ))}
          <SelectItem value="__add_new__" className="text-purple-500 font-semibold">
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
            className="flex-1 px-3 py-2 bg-background rounded-md text-sm"
            autoFocus
          />
          <button
            onClick={handleAddEdge}
            className="px-4 py-2 bg-purple-500 text-white rounded-md text-sm"
          >
            Add
          </button>
        </div>
      )}

      {selectedEdges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedEdges.map((edge) => (
            <button
              key={edge}
              onClick={() => {
                onEdgeSelect(edge);
              }}
              className="px-3 py-1 rounded-full text-sm bg-purple-500 text-white"
            >
              {edge}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
