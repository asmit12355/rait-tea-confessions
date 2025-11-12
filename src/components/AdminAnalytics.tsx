import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { TrendingUp, MessageSquare, ThumbsUp, FileText } from "lucide-react";

interface AnalyticsData {
  totalConfessions: number;
  totalComments: number;
  totalVotes: number;
  confessionsToday: number;
  confessionsThisWeek: number;
  topAuthors: { name: string; count: number }[];
  dailyStats: { date: string; count: number }[];
  voteDistribution: { type: string; count: number }[];
}

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalConfessions: 0,
    totalComments: 0,
    totalVotes: 0,
    confessionsToday: 0,
    confessionsThisWeek: 0,
    topAuthors: [],
    dailyStats: [],
    voteDistribution: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);

    // Get total confessions
    const { count: totalConfessions } = await supabase
      .from("confessions")
      .select("*", { count: "exact", head: true });

    // Get total comments
    const { count: totalComments } = await supabase
      .from("confession_comments")
      .select("*", { count: "exact", head: true });

    // Get total votes
    const { count: totalVotes } = await supabase
      .from("confession_votes")
      .select("*", { count: "exact", head: true });

    // Get confessions today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: confessionsToday } = await supabase
      .from("confessions")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today.toISOString());

    // Get confessions this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { count: confessionsThisWeek } = await supabase
      .from("confessions")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekAgo.toISOString());

    // Get top authors
    const { data: confessionsData } = await supabase
      .from("confessions")
      .select("author_name");

    const authorCounts: { [key: string]: number } = {};
    confessionsData?.forEach((c) => {
      authorCounts[c.author_name] = (authorCounts[c.author_name] || 0) + 1;
    });

    const topAuthors = Object.entries(authorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Get daily stats for last 7 days
    const { data: recentConfessions } = await supabase
      .from("confessions")
      .select("created_at")
      .gte("created_at", weekAgo.toISOString())
      .order("created_at", { ascending: true });

    const dailyCounts: { [key: string]: number } = {};
    recentConfessions?.forEach((c) => {
      const date = new Date(c.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });

    const dailyStats = Object.entries(dailyCounts).map(([date, count]) => ({
      date,
      count,
    }));

    // Get vote distribution
    const { data: votesData } = await supabase
      .from("confession_votes")
      .select("vote_type");

    const voteCounts: { [key: string]: number } = {};
    votesData?.forEach((v) => {
      voteCounts[v.vote_type] = (voteCounts[v.vote_type] || 0) + 1;
    });

    const voteDistribution = Object.entries(voteCounts).map(([type, count]) => ({
      type,
      count,
    }));

    setAnalytics({
      totalConfessions: totalConfessions || 0,
      totalComments: totalComments || 0,
      totalVotes: totalVotes || 0,
      confessionsToday: confessionsToday || 0,
      confessionsThisWeek: confessionsThisWeek || 0,
      topAuthors,
      dailyStats,
      voteDistribution,
    });

    setLoading(false);
  };

  const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))"];

  if (loading) {
    return <div className="text-center text-muted-foreground">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 md:p-6 bg-card border-border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <FileText className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-muted-foreground">Total Confessions</p>
              <p className="text-xl md:text-2xl font-bold">{analytics.totalConfessions}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6 bg-card border-border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-secondary/10 rounded-lg">
              <MessageSquare className="h-5 w-5 md:h-6 md:w-6 text-secondary" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-muted-foreground">Total Comments</p>
              <p className="text-xl md:text-2xl font-bold">{analytics.totalComments}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6 bg-card border-border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-accent/10 rounded-lg">
              <ThumbsUp className="h-5 w-5 md:h-6 md:w-6 text-accent" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-muted-foreground">Total Votes</p>
              <p className="text-xl md:text-2xl font-bold">{analytics.totalVotes}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6 bg-card border-border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-muted-foreground">This Week</p>
              <p className="text-xl md:text-2xl font-bold">{analytics.confessionsThisWeek}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Confessions Chart */}
        <Card className="p-4 md:p-6 bg-card border-border">
          <h3 className="text-base md:text-lg font-semibold mb-4 font-display">Daily Confessions (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={analytics.dailyStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
              <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                }}
              />
              <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Vote Distribution */}
        <Card className="p-4 md:p-6 bg-card border-border">
          <h3 className="text-base md:text-lg font-semibold mb-4 font-display">Vote Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={analytics.voteDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ type, percent }) => `${type}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="hsl(var(--primary))"
                dataKey="count"
              >
                {analytics.voteDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Top Authors */}
        <Card className="p-4 md:p-6 bg-card border-border lg:col-span-2">
          <h3 className="text-base md:text-lg font-semibold mb-4 font-display">Top Contributors</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analytics.topAuthors}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
              <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                }}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalytics;
