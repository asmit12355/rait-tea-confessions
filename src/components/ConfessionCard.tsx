import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, MessageCircle, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Textarea } from "@/components/ui/textarea";

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
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentPseudonym, setCommentPseudonym] = useState("");
  const [userVote, setUserVote] = useState<"upvote" | "downvote" | null>(null);
  const [voteIdentifier, setVoteIdentifier] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    // Generate or get vote identifier for anonymous voting
    let identifier = localStorage.getItem("vote_identifier");
    if (!identifier) {
      identifier = `anon_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem("vote_identifier", identifier);
    }
    setVoteIdentifier(identifier);
    
    loadVotes();
    loadComments();
    checkUserVote(identifier);
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
    const { data } = await supabase
      .from("confession_comments")
      .select("*")
      .eq("confession_id", id)
      .order("created_at", { ascending: false });

    setCommentsList(data || []);
  };

  const checkUserVote = async (identifier: string) => {
    const { data } = await supabase
      .from("confession_votes")
      .select("vote_type")
      .eq("confession_id", id)
      .eq("vote_identifier", identifier)
      .maybeSingle();

    if (data) {
      setUserVote(data.vote_type as "upvote" | "downvote");
    }
  };

  const handleVote = async (type: "upvote" | "downvote") => {
    try {
      if (userVote === type) {
        // Remove vote
        await supabase
          .from("confession_votes")
          .delete()
          .eq("confession_id", id)
          .eq("vote_identifier", voteIdentifier);
        setUserVote(null);
      } else {
        // Add or update vote
        const { data: existing } = await supabase
          .from("confession_votes")
          .select("id")
          .eq("confession_id", id)
          .eq("vote_identifier", voteIdentifier)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("confession_votes")
            .update({ vote_type: type })
            .eq("id", existing.id);
        } else {
          await supabase.from("confession_votes").insert({
            confession_id: id,
            user_id: null,
            vote_type: type,
            vote_identifier: voteIdentifier,
          });
        }
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

  const handleComment = async () => {
    if (!newComment.trim()) return;

    try {
      await supabase.from("confession_comments").insert({
        confession_id: id,
        user_id: null,
        author_name: commentPseudonym || "Anonymous",
        content: newComment,
      });

      setNewComment("");
      setCommentPseudonym("");
      loadComments();
      toast({ title: "Comment posted!" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    try {
      const shareData = {
        title: title,
        text: `${title}\n\n${content}`,
        url: window.location.href,
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${title}\n\n${content}\n\n${window.location.href}`);
        toast({ title: "Copied to clipboard!" });
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        toast({
          title: "Error sharing",
          description: "Could not share this confession",
          variant: "destructive",
        });
      }
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
          <h2 className="text-xl font-semibold mb-3 font-typewriter">{title}</h2>
          <p className="text-muted-foreground leading-relaxed font-typewriter">{content}</p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote("upvote")}
              className={`gap-2 transition-colors ${
                userVote === "upvote" ? "text-green-500 hover:text-green-600" : "hover:text-green-500"
              }`}
            >
              <ThumbsUp className="h-4 w-4" />
              <span className="text-sm">{upvotes}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote("downvote")}
              className={`gap-2 transition-colors ${
                userVote === "downvote" ? "text-red-500 hover:text-red-600" : "hover:text-red-500"
              }`}
            >
              <ThumbsDown className="h-4 w-4" />
              <span className="text-sm">{downvotes}</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="gap-2 text-yellow-600 hover:text-yellow-700"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm">{commentsList.length}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="gap-2 hover:text-primary"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {showComments && (
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Your pseudonym (optional)"
                value={commentPseudonym}
                onChange={(e) => setCommentPseudonym(e.target.value)}
                className="w-full px-3 py-2 bg-secondary border-border rounded-md text-sm"
              />
              <Textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="bg-secondary border-border"
              />
              <Button onClick={handleComment} size="sm" className="w-full">
                Post Comment
              </Button>
            </div>

            <div className="space-y-3">
              {commentsList.map((comment) => (
                <div key={comment.id} className="bg-secondary/50 p-3 rounded-md">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span className="italic">{comment.author_name}</span>
                    <span>
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ConfessionCard;
