import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface TagFilterProps {
  availableTags: string[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  onClearAll: () => void;
}

const TagFilter = ({ availableTags, selectedTags, onTagToggle, onClearAll }: TagFilterProps) => {
  if (availableTags.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Filter by Tags</h3>
        {selectedTags.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            Clear all <X className="h-3 w-3" />
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {availableTags.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <Badge
              key={tag}
              variant={isSelected ? "default" : "outline"}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onTagToggle(tag)}
            >
              #{tag}
            </Badge>
          );
        })}
      </div>
    </div>
  );
};

export default TagFilter;
