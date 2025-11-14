import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, ThumbsDown, MessageCircle, Share2, Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { getDeviceInfo } from "@/lib/deviceInfo";
import ThemedShareDialog from "@/components/ThemedShareDialog";
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
  slug?: string;
  tags?: string[];
}

const ConfessionCard = ({
  id,
  author,
  timestamp,
  title,
  content,
  slug,
  tags,
}: ConfessionCardProps) => {
  const navigate = useNavigate();
  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [userVote, setUserVote] = useState<"upvote" | "downvote" | null>(null);
  const [voteIdentifier, setVoteIdentifier] = useState<string>("");
  const [reportReason, setReportReason] = useState("");
  const [showThemedShare, setShowThemedShare] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
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
        await supabase
          .from("confession_votes")
          .delete()
          .eq("confession_id", id)
          .eq("vote_identifier", voteIdentifier);
        setUserVote(null);
      } else {
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
      const deviceInfo = getDeviceInfo();
      
      await supabase.from("confession_reports").insert({
        confession_id: id,
        reason: reportReason,
        reporter_identifier: voteIdentifier,
        device_info: deviceInfo,
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

  const confessionUrl = slug ? `/confession/${slug}` : `/confession/${id}`;
  const shareUrl = `${window.location.origin}${confessionUrl}`;

  return (
    <>
      <Card className="p-4 md:p-6 bg-card border border-border hover:border-primary/50 transition-colors">
        <div 
          className="cursor-pointer" 
          onClick={() => navigate(confessionUrl)}
        >
          <div className="flex items-start justify-between gap-2 mb-2 md:mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold font-display text-base md:text-lg mb-1 md:mb-2 break-words">
                {title}
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-1 md:gap-2 flex-wrap">
                <span>by {author}</span>
                <span className="hidden md:inline">•</span>
                <span className="hidden md:inline">
                  {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
                </span>
              </p>
            </div>
          </div>

          <p className="text-sm md:text-base text-foreground mb-3 md:mb-4 line-clamp-3 break-words">
            {content}
          </p>

          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1 md:gap-2 mb-3 md:mb-4">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs cursor-pointer hover:bg-primary/20"
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          <Button
            variant={userVote === "upvote" ? "default" : "ghost"}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleVote("upvote");
            }}
            className="gap-1 text-xs md:text-sm"
          >
            <ThumbsUp className="h-3 w-3 md:h-4 md:w-4" />
            {upvotes}
          </Button>

          <Button
            variant={userVote === "downvote" ? "default" : "ghost"}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleVote("downvote");
            }}
            className="gap-1 text-xs md:text-sm"
          >
            <ThumbsDown className="h-3 w-3 md:h-4 md:w-4" />
            {downvotes}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(confessionUrl)}
            className="gap-1 text-xs md:text-sm"
          >
            <MessageCircle className="h-3 w-3 md:h-4 md:w-4" />
            {commentsList.length}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowThemedShare(true);
            }}
            className="gap-1 text-xs md:text-sm"
          >
            <Share2 className="h-3 w-3 md:h-4 md:w-4" />
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => e.stopPropagation()}
                className="gap-1 text-xs md:text-sm text-destructive hover:text-destructive"
              >
                <Flag className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
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
                className="min-h-[100px]"
              />
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleReport}>
                  Submit Report
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Card>

      <ThemedShareDialog
        open={showThemedShare}
        onOpenChange={setShowThemedShare}
        confession={{ title, content, author, tags }}
        shareUrl={shareUrl}
      />
    </>
  );
};

export default ConfessionCard;
