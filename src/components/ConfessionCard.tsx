import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, MessageCircle, Share2, Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  const navigate = useNavigate();
  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [userVote, setUserVote] = useState<"upvote" | "downvote" | null>(null);
  const [voteIdentifier, setVoteIdentifier] = useState<string>("");
  const [reportReason, setReportReason] = useState("");
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
      .select("id")
      .eq("confession_id", id);

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

  const handleReport = async () => {
    if (!reportReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for reporting",
        variant: "destructive",
      });
      return;
    }

    try {
      await supabase.from("confession_reports").insert({
        confession_id: id,
        reason: reportReason,
        reporter_identifier: voteIdentifier,
      });

      setReportReason("");
      toast({ title: "Report submitted. Thank you!" });
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
      const shareUrl = `${window.location.origin}/confession/${id}`;
      const shareData = {
        title: title,
        text: `${title}\n\n${content.substring(0, 100)}...`,
        url: shareUrl,
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${title}\n\n${content}\n\n${shareUrl}`);
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

  const truncateContent = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
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
          <h2 className="text-xl font-semibold mb-3 font-mono text-center">{title}</h2>
          <p className="text-muted-foreground leading-relaxed font-mono">{truncateContent(content)}</p>
          <Button
            variant="link"
            onClick={() => navigate(`/confession/${id}`)}
            className="mt-2 p-0 h-auto text-primary"
          >
            View Full Post
          </Button>
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
              onClick={() => navigate(`/confession/${id}`)}
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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 hover:text-destructive"
                >
                  <Flag className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Report Confession</AlertDialogTitle>
                  <AlertDialogDescription>
                    Please provide a reason for reporting this confession.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Textarea
                  placeholder="Reason for reporting..."
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="bg-secondary border-border"
                />
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReport}>Submit Report</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

      </div>
    </Card>
  );
};

export default ConfessionCard;
