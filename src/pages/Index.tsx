import { useState, useEffect } from "react";
import Header from "@/components/Header";
import ConfessionCard from "@/components/ConfessionCard";
import ConfessionForm from "@/components/ConfessionForm";
import TagFilter from "@/components/TagFilter";
import { supabase } from "@/integrations/supabase/client";

interface Confession {
  id: string;
  author_name: string;
  created_at: string;
  title: string;
  content: string;
  slug?: string;
  tags?: string[];
}

const Index = () => {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [filteredConfessions, setFilteredConfessions] = useState<Confession[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  useEffect(() => {
    loadConfessions();

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

  useEffect(() => {
    filterConfessions();
  }, [confessions, selectedTags]);

  const loadConfessions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("confessions")
      .select("*")
      .order("created_at", { ascending: false });

    if (data && !error) {
      setConfessions(data);
      
      const tags = new Set<string>();
      data.forEach((confession) => {
        if (confession.tags) {
          confession.tags.forEach((tag: string) => tags.add(tag));
        }
      });
      setAvailableTags(Array.from(tags).sort());
    }
    setLoading(false);
  };

  const filterConfessions = () => {
    if (selectedTags.length === 0) {
      setFilteredConfessions(confessions);
    } else {
      const filtered = confessions.filter((confession) =>
        confession.tags?.some((tag) => selectedTags.includes(tag))
      );
      setFilteredConfessions(filtered);
    }
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onPostClick={() => setShowForm(true)} />

      <main className="container px-3 py-4 md:px-6 md:py-8">
        <div className="mx-auto max-w-3xl space-y-4 md:space-y-6">
          <div className="text-center space-y-1 md:space-y-2 mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold font-display">Recent Secrets</h2>
          </div>

          <TagFilter
            availableTags={availableTags}
            selectedTags={selectedTags}
            onTagToggle={handleTagToggle}
            onClearAll={() => setSelectedTags([])}
          />

          {loading ? (
            <div className="text-center text-muted-foreground text-sm">Loading...</div>
          ) : filteredConfessions.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm">
              {selectedTags.length > 0
                ? "No confessions found with selected tags."
                : "No confessions yet. Be the first to share!"}
            </div>
          ) : (
            <div className="space-y-4 md:space-y-6">
              {filteredConfessions.map((confession) => (
                <ConfessionCard
                  key={confession.id}
                  id={confession.id}
                  author={confession.author_name}
                  timestamp={confession.created_at}
                  title={confession.title}
                  content={confession.content}
                  slug={confession.slug}
                  tags={confession.tags}
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
