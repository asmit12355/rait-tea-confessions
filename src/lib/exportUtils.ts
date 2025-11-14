import Papa from "papaparse";

export interface ExportConfession {
  id: string;
  author_name: string;
  title: string;
  content: string;
  created_at: string;
  ip_address?: string;
  device_info?: string;
  tags?: string[];
}

export interface ExportReport {
  id: string;
  confession_id: string;
  reason: string;
  created_at: string;
  ip_address?: string;
  device_info?: string;
  confession_title?: string;
}

export const exportToCSV = (data: any[], filename: string) => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}-${Date.now()}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const formatConfessionsForExport = (confessions: ExportConfession[]) => {
  return confessions.map((c) => ({
    ID: c.id,
    Author: c.author_name,
    Title: c.title,
    Content: c.content,
    Tags: c.tags?.join(", ") || "",
    "Created At": new Date(c.created_at).toLocaleString(),
    "IP Address": c.ip_address || "N/A",
    "Device Info": c.device_info || "N/A",
  }));
};

export const formatReportsForExport = (reports: ExportReport[]) => {
  return reports.map((r) => ({
    "Report ID": r.id,
    "Confession ID": r.confession_id,
    "Confession Title": r.confession_title || "N/A",
    Reason: r.reason,
    "Reported At": new Date(r.created_at).toLocaleString(),
    "IP Address": r.ip_address || "N/A",
    "Device Info": r.device_info || "N/A",
  }));
};

export const formatAnalyticsForExport = (analytics: any) => {
  return [
    { Metric: "Total Confessions", Value: analytics.totalConfessions },
    { Metric: "Confessions This Week", Value: analytics.weeklyConfessions },
    { Metric: "Confessions Today", Value: analytics.dailyConfessions },
    { Metric: "Total Upvotes", Value: analytics.totalUpvotes },
    { Metric: "Total Downvotes", Value: analytics.totalDownvotes },
  ];
};
