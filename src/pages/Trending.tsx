import { useState, useEffect } from "react";
import Header from "@/components/Header";
import ConfessionCard from "@/components/ConfessionCard";
import ConfessionForm from "@/components/ConfessionForm";
import { supabase } from "@/integrations/supabase/client";

interface Confession {
  id: string;
  author_name: string;
  created_at: string;
  title: string;
  content: string;
  score?: number;
  slug?: string;
}

const Trending = () => {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrendingConfessions();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("trending-confessions-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "confessions",
        },
        () => {
          loadTrendingConfessions();
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
          loadTrendingConfessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadTrendingConfessions = async () => {
    setLoading(true);
    
    // Get all confessions
    const { data: confessionsData, error: confessionsError } = await supabase
      .from("confessions")
      .select("*")
      .order("created_at", { ascending: false });

    if (confessionsError || !confessionsData) {
      setLoading(false);
      return;
    }

    // Get all votes
    const { data: votesData } = await supabase
      .from("confession_votes")
      .select("confession_id, vote_type");

    // Calculate scores (upvotes - downvotes)
    const confessionsWithScores = confessionsData.map((confession) => {
      const votes = votesData?.filter((v) => v.confession_id === confession.id) || [];
      const upvotes = votes.filter((v) => v.vote_type === "upvote").length;
      const downvotes = votes.filter((v) => v.vote_type === "downvote").length;
      return {
        ...confession,
        score: upvotes - downvotes,
      };
    });

    // Sort by score
    confessionsWithScores.sort((a, b) => (b.score || 0) - (a.score || 0));

    setConfessions(confessionsWithScores);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onPostClick={() => setShowForm(true)} />

      <main className="container px-3 py-6 md:px-6 md:py-12">
        <div className="mx-auto max-w-3xl space-y-6 md:space-y-8">
          <div className="text-center space-y-2 md:space-y-3 mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold font-display">🔥 Trending Confessions</h2>
            <p className="text-sm md:text-base text-muted-foreground">
              Most popular confessions based on votes
            </p>
          </div>

          {loading ? (
            <div className="text-center text-muted-foreground">Loading...</div>
          ) : confessions.length === 0 ? (
            <div className="text-center text-muted-foreground">
              No confessions yet. Be the first to share!
            </div>
          ) : (
            <div className="space-y-6">
              {confessions.map((confession, index) => (
                <div key={confession.id} className="relative">
                  {index < 3 && (
                    <div className="absolute -left-4 md:-left-8 top-4 md:top-6 text-xl md:text-2xl">
                      {index === 0 && "🥇"}
                      {index === 1 && "🥈"}
                      {index === 2 && "🥉"}
                    </div>
                  )}
                  <ConfessionCard
                    id={confession.id}
                    author={confession.author_name}
                    timestamp={confession.created_at}
                    title={confession.title}
                    content={confession.content}
                    slug={confession.slug}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showForm && (
        <ConfessionForm
          onClose={() => setShowForm(false)}
          onSuccess={loadTrendingConfessions}
        />
      )}
    </div>
  );
};

export default Trending;
