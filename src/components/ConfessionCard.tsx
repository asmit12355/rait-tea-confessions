import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, MessageCircle, Share2, Flag, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import * as htmlToImage from 'html-to-image';
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
  const cardRef = useRef<HTMLDivElement>(null);

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
    const shareUrl = `${window.location.origin}/confession/${id}`;
    const shareText = `Check out this confession: "${title}"`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: shareText,
          url: shareUrl,
        });
        toast({ title: "Shared successfully!" });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error("Error sharing:", error);
        }
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: "Link copied to clipboard!" });
    }
  };

  const handleShareCard = async () => {
    if (!cardRef.current) return;
    
    try {
      toast({ title: "Generating card..." });
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
      });
      
      const link = document.createElement('a');
      link.download = `confession-${id}.png`;
      link.href = dataUrl;
      link.click();
      toast({ title: "Card saved! Share it on Instagram!" });
    } catch (error) {
      console.error("Error generating card:", error);
      toast({ title: "Failed to generate card", variant: "destructive" });
    }
  };

  const truncateContent = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <Card className="p-4 md:p-6 bg-card border-border hover:border-primary/30 transition-all duration-300">
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs md:text-sm">
          <p className="text-muted-foreground italic">{author}</p>
          <p className="text-muted-foreground">
            {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
          </p>
        </div>

        <div>
          <h2 className="text-base md:text-lg font-semibold mb-2 font-mono text-center">{title}</h2>
          <p className="text-muted-foreground leading-relaxed font-mono text-sm md:text-base">{truncateContent(content)}</p>
          <div className="flex justify-center mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/confession/${id}`)}
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs md:text-sm"
            >
              View Full Post
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-1 md:gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote("upvote")}
              className={`gap-1 transition-colors ${
                userVote === "upvote" ? "text-green-500 hover:text-green-600" : "hover:text-green-500"
              }`}
            >
              <ThumbsUp className="h-3 w-3 md:h-4 md:w-4" />
              <span className="text-xs md:text-sm">{upvotes}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote("downvote")}
              className={`gap-1 transition-colors ${
                userVote === "downvote" ? "text-red-500 hover:text-red-600" : "hover:text-red-500"
              }`}
            >
              <ThumbsDown className="h-3 w-3 md:h-4 md:w-4" />
              <span className="text-xs md:text-sm">{downvotes}</span>
            </Button>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/confession/${id}`)}
              className="gap-1 text-yellow-600 hover:text-yellow-700"
            >
              <MessageCircle className="h-3 w-3 md:h-4 md:w-4" />
              <span className="text-xs md:text-sm">{commentsList.length}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="gap-1 hover:text-primary"
            >
              <Share2 className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShareCard}
              className="gap-1 hover:text-primary"
            >
              <Image className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 hover:text-destructive"
                >
                  <Flag className="h-3 w-3 md:h-4 md:w-4" />
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

      {/* Hidden card for image generation */}
      <div className="fixed -left-[9999px] top-0">
        <div
          ref={cardRef}
          className="w-[1080px] h-[1080px] bg-gradient-to-br from-primary/20 to-secondary/20 p-16 flex flex-col justify-center items-center"
        >
          <div className="bg-card rounded-3xl shadow-2xl p-12 max-w-[900px] w-full">
            <div className="space-y-8">
              <div className="text-center">
                <h1 className="text-5xl font-bold mb-4 text-foreground">{title}</h1>
                <p className="text-2xl text-muted-foreground leading-relaxed">{content}</p>
              </div>
              <div className="flex justify-between items-center pt-8 border-t border-border">
                <span className="text-xl font-medium text-muted-foreground">{author}</span>
                <div className="flex gap-8 text-xl text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <ThumbsUp className="h-6 w-6" /> {upvotes}
                  </span>
                  <span className="flex items-center gap-2">
                    <MessageCircle className="h-6 w-6" /> {commentsList.length}
                  </span>
                </div>
              </div>
              <div className="text-center pt-4">
                <p className="text-lg text-muted-foreground">RAIT Confession Tea</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ConfessionCard;
