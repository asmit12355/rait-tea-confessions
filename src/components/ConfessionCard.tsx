import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, MessageCircle } from "lucide-react";

interface ConfessionCardProps {
  author: string;
  timestamp: string;
  title: string;
  content: string;
  upvotes: number;
  downvotes: number;
  comments: number;
}

const ConfessionCard = ({
  author,
  timestamp,
  title,
  content,
  upvotes,
  downvotes,
  comments,
}: ConfessionCardProps) => {
  return (
    <Card className="p-6 bg-card border-border hover:border-primary/50 transition-all duration-300 shadow-card hover:shadow-glow">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground italic">{author}</p>
          <p className="text-xs text-muted-foreground">{timestamp}</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3 text-foreground">{title}</h2>
          <p className="text-muted-foreground leading-relaxed line-clamp-4">{content}</p>
        </div>

        <button className="text-primary hover:text-accent transition-colors text-sm font-medium">
          View Post →
        </button>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 hover:text-primary transition-colors"
            >
              <ThumbsUp className="h-4 w-4" />
              <span className="text-sm">{upvotes}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 hover:text-destructive transition-colors"
            >
              <ThumbsDown className="h-4 w-4" />
              <span className="text-sm">{downvotes}</span>
            </Button>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <MessageCircle className="h-4 w-4" />
            <span className="text-sm">{comments}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ConfessionCard;
