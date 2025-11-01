import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trash2, AlertTriangle, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Confession {
  id: string;
  author_name: string;
  created_at: string;
  title: string;
  content: string;
  ip_address?: string;
}

interface Report {
  id: string;
  confession_id: string;
  reason: string;
  reporter_identifier: string;
  ip_address?: string;
  created_at: string;
  confessions?: {
    title: string;
    author_name: string;
  };
}

const Admin = () => {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
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
    loadReports();
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

  const loadReports = async () => {
    const { data, error } = await supabase
      .from("confession_reports")
      .select(`
        *,
        confessions (
          title,
          author_name
        )
      `)
      .order("created_at", { ascending: false });

    if (data && !error) {
      setReports(data as Report[]);
    }
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
      loadReports();
    }
  };

  const handleDeleteReport = async (id: string) => {
    const { error } = await supabase.from("confession_reports").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Report dismissed" });
      loadReports();
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onPostClick={() => {}} />

      <main className="container px-4 py-12 md:px-6">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="text-center space-y-3 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-display">🔒 Admin Dashboard</h2>
            <p className="text-muted-foreground">
              Monitor and manage all confessions and reports
            </p>
          </div>

          <Tabs defaultValue="confessions" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="confessions">
                Confessions ({confessions.length})
              </TabsTrigger>
              <TabsTrigger value="reports">
                Reports ({reports.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="confessions" className="space-y-4">
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
                              {confession.ip_address && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono text-xs bg-secondary px-2 py-1 rounded">
                                    IP: {confession.ip_address}
                                  </span>
                                </>
                              )}
                            </div>
                            <h3 className="text-xl font-semibold mb-2 font-mono">
                              {confession.title}
                            </h3>
                            <p className="text-muted-foreground leading-relaxed font-mono">
                              {confession.content}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => navigate(`/confession/${confession.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => handleDelete(confession.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              {reports.length === 0 ? (
                <div className="text-center text-muted-foreground">
                  No reports yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <Card key={report.id} className="p-6 bg-card border-border border-l-4 border-l-destructive">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                              <AlertTriangle className="h-5 w-5 text-destructive" />
                              <h3 className="text-lg font-semibold">Report</h3>
                            </div>
                            
                            {report.confessions && (
                              <div className="mb-3 p-3 bg-secondary/50 rounded-md">
                                <p className="text-sm text-muted-foreground mb-1">Reported Confession:</p>
                                <p className="font-semibold font-mono">{report.confessions.title}</p>
                                <p className="text-sm text-muted-foreground mt-1">by {report.confessions.author_name}</p>
                              </div>
                            )}

                            <div className="space-y-2">
                              <div>
                                <p className="text-sm text-muted-foreground">Reason:</p>
                                <p className="text-foreground">{report.reason}</p>
                              </div>
                              
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span>
                                  {formatDistanceToNow(new Date(report.created_at), {
                                    addSuffix: true,
                                  })}
                                </span>
                                <span>•</span>
                                <span className="font-mono text-xs">
                                  Reporter: {report.reporter_identifier.substring(0, 12)}...
                                </span>
                                {report.ip_address && (
                                  <>
                                    <span>•</span>
                                    <span className="font-mono text-xs bg-destructive/20 px-2 py-1 rounded">
                                      IP: {report.ip_address}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => navigate(`/confession/${report.confession_id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => handleDelete(report.confession_id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteReport(report.id)}
                            >
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Admin;
