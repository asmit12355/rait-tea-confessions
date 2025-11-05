import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, MessageCircle, Share2, Flag, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
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
import Header from "@/components/Header";

interface Confession {
  id: string;
  author_name: string;
  created_at: string;
  title: string;
  content: string;
}

const ConfessionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [confession, setConfession] = useState<Confession | null>(null);
  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentPseudonym, setCommentPseudonym] = useState("");
  const [userVote, setUserVote] = useState<"upvote" | "downvote" | null>(null);
  const [voteIdentifier, setVoteIdentifier] = useState<string>("");
  const [reportReason, setReportReason] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    let identifier = localStorage.getItem("vote_identifier");
    if (!identifier) {
      identifier = `anon_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem("vote_identifier", identifier);
    }
    setVoteIdentifier(identifier);
    
    loadConfession();
    loadVotes();
    loadComments();
    checkUserVote(identifier);
  }, [id]);

  const loadConfession = async () => {
    const { data, error } = await supabase
      .from("confessions")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      toast({
        title: "Error",
        description: "Confession not found",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    setConfession(data);
  };

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
      const shareUrl = window.location.href;
      const shareData = {
        title: confession?.title,
        text: `${confession?.title}\n\n${confession?.content}`,
        url: shareUrl,
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${confession?.title}\n\n${confession?.content}\n\n${shareUrl}`);
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

  if (!confession) {
    return (
      <div className="min-h-screen bg-background">
        <Header onPostClick={() => navigate("/")} />
        <div className="container py-8">
          <p className="text-center text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onPostClick={() => navigate("/")} />
      <div className="container py-4 md:py-8 px-3 md:px-6 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-3 md:mb-4 gap-2 text-sm md:text-base"
          size="sm"
        >
          <ArrowLeft className="h-3 w-3 md:h-4 md:w-4" />
          Back
        </Button>

        <Card className="p-4 md:p-6 bg-card border-border">
          <div className="space-y-3 md:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs md:text-sm">
              <p className="text-muted-foreground italic">{confession.author_name}</p>
              <p className="text-muted-foreground">
                {formatDistanceToNow(new Date(confession.created_at), { addSuffix: true })}
              </p>
            </div>

            <div>
              <h1 className="text-xl md:text-2xl font-semibold mb-3 md:mb-4 font-mono text-center">{confession.title}</h1>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed font-mono whitespace-pre-wrap">{confession.content}</p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 md:pt-4 border-t border-border">
              <div className="flex items-center gap-1 md:gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVote("upvote")}
                  className={`gap-1 md:gap-2 transition-colors text-xs md:text-sm ${
                    userVote === "upvote" ? "text-green-500 hover:text-green-600" : "hover:text-green-500"
                  }`}
                >
                  <ThumbsUp className="h-3 w-3 md:h-4 md:w-4" />
                  <span>{upvotes}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVote("downvote")}
                  className={`gap-1 md:gap-2 transition-colors text-xs md:text-sm ${
                    userVote === "downvote" ? "text-red-500 hover:text-red-600" : "hover:text-red-500"
                  }`}
                >
                  <ThumbsDown className="h-3 w-3 md:h-4 md:w-4" />
                  <span>{downvotes}</span>
                </Button>
              </div>

              <div className="flex items-center gap-1 md:gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 md:gap-2 text-yellow-600 hover:text-yellow-700 text-xs md:text-sm"
                >
                  <MessageCircle className="h-3 w-3 md:h-4 md:w-4" />
                  <span>{commentsList.length}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="gap-1 md:gap-2 hover:text-primary"
                >
                  <Share2 className="h-3 w-3 md:h-4 md:w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 md:gap-2 hover:text-destructive"
                    >
                      <Flag className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-base md:text-lg">Report Confession</AlertDialogTitle>
                      <AlertDialogDescription className="text-sm md:text-base">
                        Please provide a reason for reporting this confession.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Textarea
                      placeholder="Reason for reporting..."
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="bg-secondary border-border text-sm md:text-base"
                    />
                    <AlertDialogFooter>
                      <AlertDialogCancel className="text-sm md:text-base">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleReport} className="text-sm md:text-base">Submit Report</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <div className="space-y-3 md:space-y-4 pt-3 md:pt-4 border-t border-border">
              <h3 className="font-semibold text-base md:text-lg font-display">Comments</h3>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Your pseudonym (optional)"
                  value={commentPseudonym}
                  onChange={(e) => setCommentPseudonym(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary border-border rounded-md text-xs md:text-sm"
                />
                <Textarea
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="bg-secondary border-border text-sm md:text-base"
                  rows={3}
                />
                <Button onClick={handleComment} size="sm" className="w-full text-sm md:text-base">
                  Post Comment
                </Button>
              </div>

              <div className="space-y-2 md:space-y-3">
                {commentsList.map((comment) => (
                  <div key={comment.id} className="bg-secondary/50 p-2 md:p-3 rounded-md">
                    <div className="flex items-center justify-between text-[10px] md:text-xs text-muted-foreground mb-1">
                      <span className="italic">{comment.author_name}</span>
                      <span>
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs md:text-sm">{comment.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ConfessionDetail;
