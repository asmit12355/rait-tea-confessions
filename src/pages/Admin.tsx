import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trash2, AlertTriangle, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import AdminAnalytics from "@/components/AdminAnalytics";

interface Confession {
  id: string;
  author_name: string;
  created_at: string;
  title: string;
  content: string;
  ip_address?: string;
  device_info?: string;
}

interface Report {
  id: string;
  confession_id: string;
  reason: string;
  reporter_identifier: string;
  ip_address?: string;
  device_info?: string;
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
  const [selectedConfessions, setSelectedConfessions] = useState<Set<string>>(new Set());
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

  const toggleSelectConfession = (id: string) => {
    const newSelected = new Set(selectedConfessions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedConfessions(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedConfessions.size === confessions.length) {
      setSelectedConfessions(new Set());
    } else {
      setSelectedConfessions(new Set(confessions.map((c) => c.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedConfessions.size === 0) return;

    if (!confirm(`Delete ${selectedConfessions.size} selected confessions?`)) return;

    const ids = Array.from(selectedConfessions);
    const { error } = await supabase.from("confessions").delete().in("id", ids);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: `${selectedConfessions.size} confessions deleted` });
      setSelectedConfessions(new Set());
      loadConfessions();
      loadReports();
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onPostClick={() => {}} />

      <main className="container px-3 py-6 md:px-6 md:py-12">
        <div className="mx-auto max-w-6xl space-y-6 md:space-y-8">
          <div className="text-center space-y-2 md:space-y-3 mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold font-display">🔒 Admin Dashboard</h2>
            <p className="text-sm md:text-base text-muted-foreground">
              Monitor and manage all confessions and reports
            </p>
          </div>

          <Tabs defaultValue="confessions" className="space-y-4 md:space-y-6">
            <TabsList className="grid w-full grid-cols-3 text-sm md:text-base">
              <TabsTrigger value="confessions">
                <span className="hidden sm:inline">Confessions ({confessions.length})</span>
                <span className="sm:hidden">📝 ({confessions.length})</span>
              </TabsTrigger>
              <TabsTrigger value="reports">
                <span className="hidden sm:inline">Reports ({reports.length})</span>
                <span className="sm:hidden">🚩 ({reports.length})</span>
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <span className="hidden sm:inline">Analytics</span>
                <span className="sm:hidden">📊</span>
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
                  {/* Bulk Actions */}
                  <Card className="p-3 md:p-4 bg-card border-border">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedConfessions.size === confessions.length}
                          onCheckedChange={toggleSelectAll}
                        />
                        <span className="text-sm">
                          {selectedConfessions.size > 0
                            ? `${selectedConfessions.size} selected`
                            : "Select All"}
                        </span>
                      </div>
                      {selectedConfessions.size > 0 && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleBulkDelete}
                          className="text-xs md:text-sm"
                        >
                          <Trash2 className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                          Delete Selected ({selectedConfessions.size})
                        </Button>
                      )}
                    </div>
                  </Card>

                  {confessions.map((confession) => (
                    <Card key={confession.id} className="p-3 md:p-6 bg-card border-border">
                      <div className="space-y-3 md:space-y-4">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                          <div className="flex gap-3 flex-1">
                            <Checkbox
                              checked={selectedConfessions.has(confession.id)}
                              onCheckedChange={() => toggleSelectConfession(confession.id)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground mb-2">
                              <span className="italic">{confession.author_name}</span>
                              <span>•</span>
                              <span>
                                {formatDistanceToNow(new Date(confession.created_at), {
                                  addSuffix: true,
                                })}
                              </span>
                              {confession.ip_address && (
                                <>
                                  <span className="hidden sm:inline">•</span>
                                  <span className="font-mono text-[10px] md:text-xs bg-secondary px-2 py-1 rounded">
                                    IP: {confession.ip_address}
                                  </span>
                                </>
                              )}
                              {confession.device_info && (
                                <>
                                  <span className="hidden sm:inline">•</span>
                                  <span className="font-mono text-[10px] md:text-xs bg-secondary px-2 py-1 rounded">
                                    📱 {confession.device_info}
                                  </span>
                                </>
                              )}
                            </div>
                            <h3 className="text-base md:text-xl font-semibold mb-2 font-mono">
                              {confession.title}
                            </h3>
                            <p className="text-sm md:text-base text-muted-foreground leading-relaxed font-mono line-clamp-3">
                              {confession.content}
                            </p>
                            </div>
                          </div>
                          <div className="flex gap-2 self-end md:self-start ml-auto">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => navigate(`/confession/${confession.id}`)}
                              className="h-8 w-8 md:h-10 md:w-10"
                            >
                              <Eye className="h-3 w-3 md:h-4 md:w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => handleDelete(confession.id)}
                              className="h-8 w-8 md:h-10 md:w-10"
                            >
                              <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
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
                    <Card key={report.id} className="p-3 md:p-6 bg-card border-border border-l-4 border-l-destructive">
                      <div className="space-y-3 md:space-y-4">
                        <div className="flex flex-col gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                              <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-destructive" />
                              <h3 className="text-base md:text-lg font-semibold font-display">Report</h3>
                            </div>
                            
                            {report.confessions && (
                              <div className="mb-3 p-2 md:p-3 bg-secondary/50 rounded-md">
                                <p className="text-xs md:text-sm text-muted-foreground mb-1">Reported Confession:</p>
                                <p className="text-sm md:text-base font-semibold font-mono">{report.confessions.title}</p>
                                <p className="text-xs md:text-sm text-muted-foreground mt-1">by {report.confessions.author_name}</p>
                              </div>
                            )}

                            <div className="space-y-2">
                              <div>
                                <p className="text-xs md:text-sm text-muted-foreground">Reason:</p>
                                <p className="text-sm md:text-base text-foreground">{report.reason}</p>
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground">
                                <span>
                                  {formatDistanceToNow(new Date(report.created_at), {
                                    addSuffix: true,
                                  })}
                                </span>
                                <span>•</span>
                                <span className="font-mono text-[10px] md:text-xs">
                                  Reporter: {report.reporter_identifier.substring(0, 8)}...
                                </span>
                                {report.ip_address && (
                                  <>
                                    <span className="hidden sm:inline">•</span>
                                    <span className="font-mono text-[10px] md:text-xs bg-destructive/20 px-2 py-1 rounded">
                                      IP: {report.ip_address}
                                    </span>
                                  </>
                                )}
                                {report.device_info && (
                                  <>
                                    <span className="hidden sm:inline">•</span>
                                    <span className="font-mono text-[10px] md:text-xs bg-destructive/20 px-2 py-1 rounded">
                                      📱 {report.device_info}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/confession/${report.confession_id}`)}
                              className="text-xs md:text-sm"
                            >
                              <Eye className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(report.confession_id)}
                              className="text-xs md:text-sm"
                            >
                              <Trash2 className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                              Delete
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteReport(report.id)}
                              className="text-xs md:text-sm"
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

            <TabsContent value="analytics" className="space-y-4">
              <AdminAnalytics />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Admin;
