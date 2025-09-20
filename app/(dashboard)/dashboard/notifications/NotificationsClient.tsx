// app/dashboard/notifications/NotificationsClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  //   User,
  //   Building,
  //   Download,
  //   Clock,
  ArrowLeft,
} from "lucide-react";

interface ActivityLog {
  id: string;
  action: string;
  details: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  user: {
    name: string | null;
    email: string | null;
  } | null;
  lead: {
    name: string | null;
    email: string | null;
  } | null;
  userId: string;
}

interface DuplicateLead {
  email: string;
  name: string;
  count: number;
  leads?: Array<{
    id: string;
    name: string;
    owner: string | { name: string | null } | null;
    createdAt: string | Date;
  }>;
}

interface SystemStats {
  totalUsers: number;
  totalLeads: number;
  pendingReview: number;
  pendingVerification: number;
}

interface NotificationClientProps {
  initialActivities: ActivityLog[];
  duplicateLeads: DuplicateLead[];
  systemStats: SystemStats;
}

export default function NotificationsClient({
  initialActivities,
  duplicateLeads,
  systemStats,
}: NotificationClientProps) {
  const [filter, setFilter] = useState("all");
  const [activities] = useState<ActivityLog[]>(initialActivities);

  // Filter activities based on selection
  const filteredActivities = activities.filter((log) => {
    if (filter === "all") return true;
    if (filter === "sales") return log.action.includes("SALES_");
    if (filter === "pdm") return log.action.includes("PDM_");
    if (filter === "care") return log.action.includes("CARE_");
    if (filter === "admin") return log.action.includes("ADMIN_");
    if (filter === "system")
      return log.action.includes("BULK_") || log.action.includes("SYSTEM_");
    return true;
  });

  const getActivityStyle = (action: string) => {
    if (action.includes("SALES_")) {
      return { borderColor: "border-blue-500", icon: "💼", label: "Sales" };
    }
    if (action.includes("PDM_")) {
      return { borderColor: "border-purple-500", icon: "👔", label: "PDM" };
    }
    if (action.includes("CARE_")) {
      return { borderColor: "border-green-500", icon: "🤝", label: "Care" };
    }
    if (action.includes("ADMIN_")) {
      return { borderColor: "border-red-500", icon: "⚙️", label: "Admin" };
    }
    return { borderColor: "border-gray-500", icon: "🔔", label: "System" };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Notification Center</h1>
          <p className="text-gray-600">System activity and alerts</p>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
          size="sm"
        >
          All Activities
        </Button>
        <Button
          variant={filter === "sales" ? "default" : "outline"}
          onClick={() => setFilter("sales")}
          size="sm"
        >
          Sales Actions
        </Button>
        <Button
          variant={filter === "pdm" ? "default" : "outline"}
          onClick={() => setFilter("pdm")}
          size="sm"
        >
          PDM Reviews
        </Button>
        <Button
          variant={filter === "care" ? "default" : "outline"}
          onClick={() => setFilter("care")}
          size="sm"
        >
          Customer Care
        </Button>
        <Button
          variant={filter === "admin" ? "default" : "outline"}
          onClick={() => setFilter("admin")}
          size="sm"
        >
          Admin Actions
        </Button>
        <Button
          variant={filter === "system" ? "default" : "outline"}
          onClick={() => setFilter("system")}
          size="sm"
        >
          System Events
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Logs */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recent Activity ({filteredActivities.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredActivities.map((log) => {
                const style = getActivityStyle(log.action);
                return (
                  <div
                    key={log.id}
                    className={`border-l-4 ${style.borderColor} pl-4 py-3`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm">{style.icon}</span>
                          <span className="font-medium">
                            {log.action.replace(/_/g, " ")}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {style.label}
                          </Badge>
                          {log.user && (
                            <span className="text-xs text-gray-500">
                              by {log.user.name}
                            </span>
                          )}
                        </div>

                        {log.lead && (
                          <p className="text-sm text-gray-600 mb-1">
                            Lead: <strong>{log.lead.name}</strong> (
                            {log.lead.email})
                          </p>
                        )}

                        {log.details && (
                          <p className="text-sm text-gray-700">{log.details}</p>
                        )}

                        {log.oldValue && log.newValue && (
                          <p className="text-sm text-gray-600">
                            Changed from{" "}
                            <span className="font-medium">{log.oldValue}</span>
                            to{" "}
                            <span className="font-medium">{log.newValue}</span>
                          </p>
                        )}
                      </div>

                      <div className="text-right text-sm text-gray-500 whitespace-nowrap">
                        <p>{new Date(log.createdAt).toLocaleDateString()}</p>
                        <p>{new Date(log.createdAt).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredActivities.length === 0 && (
                <p className="text-gray-500 text-center py-8">
                  No activities found
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Duplicate Lead Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Duplicate Alerts
              {duplicateLeads.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {duplicateLeads.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {duplicateLeads.map((duplicate, index) => (
                <div
                  key={index}
                  className="border-l-4 border-orange-500 pl-4 py-2"
                >
                  <h4 className="font-medium text-sm">
                    {duplicate.name || duplicate.email}
                  </h4>
                  <p className="text-xs text-gray-600 mb-2">
                    {duplicate.count} duplicate entries{" "}
                    {/* Show owner information handling both formats */}
                    {duplicate.leads &&
                      duplicate.leads.slice(0, 3).map((lead, leadIndex) => (
                        <div key={leadIndex} className="text-xs text-gray-500">
                          • Owner:{" "}
                          {
                            // Handle both string and object formats for owner
                            typeof lead.owner === "string"
                              ? lead.owner
                              : lead.owner?.name || "Unassigned"
                          }{" "}
                          - {new Date(lead.createdAt).toLocaleDateString()}
                        </div>
                      ))}
                    {duplicate.leads && duplicate.leads.length > 3 && (
                      <p className="text-xs text-gray-400">
                        +{duplicate.leads.length - 3} more...
                      </p>
                    )}
                  </p>

                  <Link
                    href={`/dashboard/leads?search=${encodeURIComponent(
                      duplicate.email
                    )}`}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 text-xs"
                    >
                      View All
                    </Button>
                  </Link>
                </div>
              ))}

              {duplicateLeads.length === 0 && (
                <p className="text-gray-500 text-center py-8">
                  No duplicate leads found
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Users</span>
                <Badge>{systemStats.totalUsers}</Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm">Total Leads</span>
                <Badge>{systemStats.totalLeads}</Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm">Pending Review</span>
                <Badge variant="outline">{systemStats.pendingReview}</Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm">Pending Verification</span>
                <Badge variant="outline">
                  {systemStats.pendingVerification}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
