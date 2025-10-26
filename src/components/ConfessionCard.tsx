import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface ConfessionCardProps {
  id: string;
  author: string;
  timestamp: string;
  title: string;
  content: string;
  upvotes: number;
  downvotes: number;
  comments: number;
  userVote?: "upvote" | "downvote" | null;
  onVoteChange: () => void;
}

const ConfessionCard = ({
  id,
  author,
  timestamp,
  title,
  content,
  upvotes,
  downvotes,
  comments,
  userVote,
  onVoteChange,
}: ConfessionCardProps) => {
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (voteType: "upvote" | "downvote") => {
    setIsVoting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to vote");
        return;
      }

      if (userVote === voteType) {
        await supabase
          .from("confession_votes")
          .delete()
          .eq("confession_id", id)
          .eq("user_id", user.id);
      } else {
        await supabase.from("confession_votes").upsert({
          confession_id: id,
          user_id: user.id,
          vote_type: voteType,
        });
      }

      onVoteChange();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <Card className="p-6 bg-card border-border hover:border-muted transition-colors">
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground italic">{author}</p>
          <p className="text-muted-foreground">
            {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2 text-foreground">{title}</h2>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className={`gap-2 ${
                userVote === "upvote" ? "text-primary" : ""
              }`}
              onClick={() => handleVote("upvote")}
              disabled={isVoting}
            >
              <ThumbsUp className="h-4 w-4" />
              <span className="text-sm">{upvotes}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`gap-2 ${
                userVote === "downvote" ? "text-destructive" : ""
              }`}
              onClick={() => handleVote("downvote")}
              disabled={isVoting}
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
