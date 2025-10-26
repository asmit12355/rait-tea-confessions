import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface ConfessionCardProps {
  id: string;
  author: string;
  timestamp: string;
  title: string;
  content: string;
}

const ConfessionCard = ({
  id,
  author,
  timestamp,
  title,
  content,
}: ConfessionCardProps) => {
  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);
  const [comments, setComments] = useState(0);
  const [userVote, setUserVote] = useState<"upvote" | "downvote" | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadVotes();
    loadComments();
    checkUserVote();
  }, [id]);

  const loadVotes = async () => {
    const { data } = await supabase
      .from("confession_votes")
      .select("vote_type")
      .eq("confession_id", id);

    if (data) {
      setUpvotes(data.filter((v) => v.vote_type === "upvote").length);
      setDownvotes(data.filter((v) => v.vote_type === "downvote").length);
    }
  };

  const loadComments = async () => {
    const { count } = await supabase
      .from("confession_comments")
      .select("*", { count: "exact", head: true })
      .eq("confession_id", id);

    setComments(count || 0);
  };

  const checkUserVote = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setUserId(user.id);

    const { data } = await supabase
      .from("confession_votes")
      .select("vote_type")
      .eq("confession_id", id)
      .eq("user_id", user.id)
      .single();

    if (data) {
      setUserVote(data.vote_type as "upvote" | "downvote");
    }
  };

  const handleVote = async (type: "upvote" | "downvote") => {
    if (!userId) {
      toast({
        title: "Login required",
        description: "Please log in to vote",
        variant: "destructive",
      });
      return;
    }

    try {
      if (userVote === type) {
        // Remove vote
        await supabase
          .from("confession_votes")
          .delete()
          .eq("confession_id", id)
          .eq("user_id", userId);
        setUserVote(null);
      } else {
        // Add or update vote
        await supabase.from("confession_votes").upsert(
          {
            confession_id: id,
            user_id: userId,
            vote_type: type,
          },
          { onConflict: "confession_id,user_id" }
        );
        setUserVote(type);
      }
      loadVotes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-6 bg-card border-border hover:border-primary/30 transition-all duration-300">
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground italic">{author}</p>
          <p className="text-muted-foreground">
            {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">{title}</h2>
          <p className="text-muted-foreground leading-relaxed">{content}</p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote("upvote")}
              className={`gap-2 hover:text-primary transition-colors ${
                userVote === "upvote" ? "text-primary" : ""
              }`}
            >
              <ThumbsUp className="h-4 w-4" />
              <span className="text-sm">{upvotes}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote("downvote")}
              className={`gap-2 hover:text-destructive transition-colors ${
                userVote === "downvote" ? "text-destructive" : ""
              }`}
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
