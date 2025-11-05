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
}

const Index = () => {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfessions();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("confessions-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "confessions",
        },
        () => {
          loadConfessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadConfessions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("confessions")
      .select("*")
      .order("created_at", { ascending: false });

    if (data && !error) {
      setConfessions(data);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onPostClick={() => setShowForm(true)} />

      <main className="container px-3 py-4 md:px-6 md:py-8">
        <div className="mx-auto max-w-3xl space-y-4 md:space-y-6">
          <div className="text-center space-y-1 md:space-y-2 mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold font-display">Recent Secrets</h2>
          </div>

          {loading ? (
            <div className="text-center text-muted-foreground text-sm">Loading...</div>
          ) : confessions.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm">
              No confessions yet. Be the first to share!
            </div>
          ) : (
            <div className="space-y-4 md:space-y-6">
              {confessions.map((confession) => (
                <ConfessionCard
                  key={confession.id}
                  id={confession.id}
                  author={confession.author_name}
                  timestamp={confession.created_at}
                  title={confession.title}
                  content={confession.content}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {showForm && (
        <ConfessionForm
          onClose={() => setShowForm(false)}
          onSuccess={loadConfessions}
        />
      )}
    </div>
  );
};

export default Index;
