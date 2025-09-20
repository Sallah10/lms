/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useQuery } from "@tanstack/react-query";
// import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  // LineChart,
  // Line,
  CartesianGrid,
} from "recharts";
import { ActivityLogs } from "@/components/ActivityLogs";
import { CardHeader, CardTitle, CardContent, Card } from "@/components/ui/card";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#f97316",
];

async function fetchAnalytics() {
  const res = await fetch("/api/dashboard/analytics");
  if (!res.ok) throw new Error("Failed to load analytics");
  return res.json();
}

export default function AnalyticsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard-analytics"],
    queryFn: fetchAnalytics,
  });
  // const router = useRouter();

  useEffect(() => {
    if (error) console.error(error);
  }, [error]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-28 bg-gray-200 rounded animate-pulse" />
          <div className="h-28 bg-gray-200 rounded animate-pulse" />
          <div className="h-28 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-64 bg-gray-200 rounded animate-pulse" />
          <div className="h-64 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data) return <div>Unable to load analytics</div>;

  // console.log(data);

  const {
    totalLeads,
    proposalsSent,
    onboarded,
    stageData,
    statusData,
    priorityData,
    teamPerformance,
    followUpToday,
    recentLeads,
  } = data;

  return (
    <div className="space-y-6">
      {/* Top tabs (Analytics / Reports) — optional */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Overview of the pipeline
          </p>
        </div>
      </div>

      {/* Cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded shadow p-4">
          <p className="text-sm text-gray-500">Total Leads</p>
          <p className="text-2xl font-bold">{totalLeads}</p>
        </div>

        <div className="bg-white rounded shadow p-4">
          <p className="text-sm text-gray-500">Proposals Sent</p>
          <p className="text-2xl font-bold">{proposalsSent}</p>
        </div>

        <div className="bg-white rounded shadow p-4">
          <p className="text-sm text-gray-500">Onboarded</p>
          <p className="text-2xl font-bold">{onboarded}</p>
        </div>

        <div className="bg-white rounded shadow p-4">
          <p className="text-sm text-gray-500">Follow-ups Today</p>
          <p className="text-2xl font-bold">{followUpToday}</p>
        </div>
      </div>

      {/* Charts + priority/team */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Charts */}
        <div className="space-y-4">
          <div className="bg-white rounded shadow p-4">
            <h3 className="font-semibold mb-2">Leads by Status</h3>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded shadow p-4">
            <h3 className="font-semibold mb-2">Status Distribution</h3>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {statusData.map((entry: any, idx: number) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={COLORS[idx % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right: Priority + Team Performance */}
        <div className="space-y-4">
          <div className="bg-white rounded shadow p-4">
            <h3 className="font-semibold mb-2">Priority</h3>
            <div className="flex flex-col gap-3">
              {priorityData && priorityData.length ? (
                priorityData.map((p: any) => {
                  const color =
                    p.priority === "URGENT"
                      ? "text-red-600"
                      : p.priority === "HIGH"
                        ? "text-orange-600"
                        : "text-gray-600";
                  return (
                    <Link
                      key={p.priority}
                      href={{
                        pathname: "/dashboard/leads",
                        query: { priority: p.priority },
                      }}
                      className="flex justify-between"
                    >
                      <span className={`font-medium ${color}`}>
                        {p.priority}
                      </span>
                      <span className="text-sm text-gray-600">{p.count}</span>
                    </Link>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500">No priority data</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded shadow p-4">
            <h3 className="font-semibold mb-2">Team Performance</h3>
            <div className="space-y-2">
              {teamPerformance.map((t: any) => (
                <div
                  key={t.ownerId}
                  className="flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-medium">{t.name}</div>
                    <div className="text-xs text-gray-500">
                      Leads: {t.leads}
                    </div>
                  </div>
                  <div className="w-24 bg-gray-200 rounded h-2">
                    <div
                      style={{
                        width: `${Math.min(
                          100,
                          (t.leads / Math.max(1, totalLeads)) * 100
                        )}%`,
                      }}
                      className="h-2 bg-blue-600 rounded"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent leads table (compact) */}
      <div className="bg-white rounded shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Recent Leads</h3>
          <Link href="/dashboard/leads" className="text-sm text-blue-600">
            View all leads
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs text-gray-500">
              <tr>
                <th className="py-2 pr-6">Partner</th>
                <th className="py-2 pr-6">Contact</th>
                <th className="py-2 pr-6">Stage</th>
                <th className="py-2 pr-6">Status</th>
                <th className="py-2 pr-6">Sales</th>
                <th className="py-2 pr-6">Created</th>
              </tr>
            </thead>
            <tbody>
              {recentLeads.map((l: any) => (
                <tr key={l.id} className="border-t hover:bg-gray-50">
                  <td className="py-3 pr-6">
                    <Link
                      href={`/dashboard/leads/${l.id}`}
                      className="text-blue-600"
                    >
                      {l.name}
                    </Link>
                  </td>
                  <td className="py-3 pr-6">
                    <div>{l.email}</div>
                    <div className="text-xs text-gray-500">{l.phone}</div>
                  </td>
                  <td className="py-3 pr-6">{l.stage?.name ?? "-"}</td>
                  {/* <td className="py-3 pr-6">{l.status}</td> */}
                  <td className="py-3 pr-6">{l.status?.name ?? "-"}</td>
                  <td className="py-3 pr-6">{l.owner?.name ?? "—"}</td>
                  <td className="py-3 pr-6">
                    {new Date(l.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent System Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityLogs limit={20} />
        </CardContent>
      </Card>
    </div>
  );
}
