import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import ConfessionCard from "@/components/ConfessionCard";
import PostConfessionDialog from "@/components/PostConfessionDialog";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

interface Confession {
  id: string;
  author_name: string;
  created_at: string;
  title: string;
  content: string;
  upvotes: number;
  downvotes: number;
  comments: number;
  userVote?: "upvote" | "downvote" | null;
}

const Index = () => {
  const navigate = useNavigate();
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [showPostDialog, setShowPostDialog] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchConfessions = async () => {
    const { data: confessionsData, error: confessionsError } = await supabase
      .from("confessions")
      .select("*")
      .order("created_at", { ascending: false });

    if (confessionsError) {
      console.error("Error fetching confessions:", confessionsError);
      return;
    }

    const { data: votesData } = await supabase
      .from("confession_votes")
      .select("*");

    const { data: commentsData } = await supabase
      .from("confession_comments")
      .select("confession_id");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const enrichedConfessions = confessionsData.map((confession) => {
      const votes = votesData?.filter((v) => v.confession_id === confession.id) || [];
      const upvotes = votes.filter((v) => v.vote_type === "upvote").length;
      const downvotes = votes.filter((v) => v.vote_type === "downvote").length;
      const userVote = user
        ? (votes.find((v) => v.user_id === user.id)?.vote_type as "upvote" | "downvote" | undefined) || null
        : null;
      const comments =
        commentsData?.filter((c) => c.confession_id === confession.id).length || 0;

      return {
        id: confession.id,
        author_name: confession.author_name,
        created_at: confession.created_at,
        title: confession.title,
        content: confession.content,
        upvotes,
        downvotes,
        comments,
        userVote,
      };
    });

    setConfessions(enrichedConfessions);
  };

  useEffect(() => {
    fetchConfessions();

    const channel = supabase
      .channel("confessions_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "confessions",
        },
        () => {
          fetchConfessions();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "confession_votes",
        },
        () => {
          fetchConfessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const handlePostClick = () => {
    if (!session) {
      navigate("/auth");
    } else {
      setShowPostDialog(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onPostClick={handlePostClick} />

      <main className="container px-4 py-12 md:px-6">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="text-center space-y-3 mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold">Recent Secrets</h2>
            <p className="text-muted-foreground">
              A safe space to share your anonymous confessions
            </p>
          </div>

          <div className="space-y-6">
            {confessions.map((confession) => (
              <ConfessionCard
                key={confession.id}
                id={confession.id}
                author={confession.author_name}
                timestamp={confession.created_at}
                title={confession.title}
                content={confession.content}
                upvotes={confession.upvotes}
                downvotes={confession.downvotes}
                comments={confession.comments}
                userVote={confession.userVote}
                onVoteChange={fetchConfessions}
              />
            ))}
          </div>
        </div>
      </main>

      <PostConfessionDialog
        open={showPostDialog}
        onOpenChange={setShowPostDialog}
        onSuccess={fetchConfessions}
      />
    </div>
  );
};

export default Index;
