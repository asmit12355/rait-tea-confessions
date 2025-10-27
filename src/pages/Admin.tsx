import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Confession {
  id: string;
  author_name: string;
  created_at: string;
  title: string;
  content: string;
}

const Admin = () => {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      toast({
        title: "Access Denied",
        description: "You don't have admin privileges",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    setIsAdmin(true);
    loadConfessions();
  };

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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this confession?")) return;

    const { error } = await supabase.from("confessions").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Confession deleted successfully" });
      loadConfessions();
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onPostClick={() => {}} />

      <main className="container px-4 py-12 md:px-6">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="text-center space-y-3 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">🔒 Admin Dashboard</h2>
            <p className="text-muted-foreground">
              Monitor and manage all confessions
            </p>
          </div>

          {loading ? (
            <div className="text-center text-muted-foreground">Loading...</div>
          ) : confessions.length === 0 ? (
            <div className="text-center text-muted-foreground">
              No confessions yet.
            </div>
          ) : (
            <div className="space-y-4">
              {confessions.map((confession) => (
                <Card key={confession.id} className="p-6 bg-card border-border">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                          <span className="italic">{confession.author_name}</span>
                          <span>•</span>
                          <span>
                            {formatDistanceToNow(new Date(confession.created_at), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">
                          {confession.title}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {confession.content}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete(confession.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Admin;
