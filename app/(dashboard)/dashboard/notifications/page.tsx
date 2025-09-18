import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Bell,
  User,
  Building,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  // Fetch recent activity logs with related data
  const activityLogs = await prisma.activityLog.findMany({
    include: {
      user: { select: { name: true, email: true } },
      lead: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50, // Last 50 activities
  });

  // Fetch system alerts (duplicates, errors, etc.)
  const duplicateLeads = await prisma.lead.groupBy({
    by: ["email", "name"],
    having: {
      email: { _count: { gt: 1 } },
    },
    orderBy: {
      _count: { email: "desc" },
    },
  });

  // Get detailed info for duplicate leads
  const duplicateLeadDetails = await Promise.all(
    duplicateLeads.map(async (group) => {
      const leads = await prisma.lead.findMany({
        where: { email: group.email },
        include: { owner: { select: { name: true } } },
      });
      return {
        email: group.email,
        name: group.name,
        count: leads.length,
        leads: leads.map((lead) => ({
          id: lead.id,
          name: lead.name,
          owner: lead.owner?.name,
          createdAt: lead.createdAt,
        })),
      };
    })
  );

  const getIconForAction = (action: string) => {
    if (action.includes("CREATE"))
      return <Building className="h-4 w-4 text-blue-500" />;
    if (action.includes("APPROVE") || action.includes("VERIFY"))
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (action.includes("REJECT") || action.includes("INVALID"))
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    return <Bell className="h-4 w-4 text-gray-500" />;
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Logs */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activityLogs.map((log) => (
                <div
                  key={log.id}
                  className="border-l-4 border-blue-500 pl-4 py-2"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getIconForAction(log.action)}
                        <span className="font-medium">{log.action}</span>
                        <Badge variant="outline" className="text-xs">
                          {log.user.name}
                        </Badge>
                      </div>

                      {log.lead && (
                        <p className="text-sm text-gray-600 mb-1">
                          Lead: {log.lead.name} ({log.lead.email})
                        </p>
                      )}

                      {log.details && (
                        <p className="text-sm text-gray-700">{log.details}</p>
                      )}

                      {log.oldValue && log.newValue && (
                        <p className="text-sm text-gray-600">
                          Changed from{" "}
                          <span className="font-medium">{log.oldValue}</span> to{" "}
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
              ))}

              {activityLogs.length === 0 && (
                <p className="text-gray-500 text-center py-8">
                  No activity yet
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
              {duplicateLeadDetails.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {duplicateLeadDetails.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {duplicateLeadDetails.map((duplicate, index) => (
                <div
                  key={index}
                  className="border-l-4 border-orange-500 pl-4 py-2"
                >
                  <h4 className="font-medium text-sm">
                    {duplicate.name || duplicate.email}
                  </h4>
                  <p className="text-xs text-gray-600 mb-2">
                    {duplicate.count} duplicate entries
                  </p>

                  <div className="space-y-1">
                    {duplicate.leads.slice(0, 3).map((lead) => (
                      <div key={lead.id} className="text-xs text-gray-500">
                        • {lead.owner || "Unassigned"} -{" "}
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </div>
                    ))}
                    {duplicate.leads.length > 3 && (
                      <p className="text-xs text-gray-400">
                        +{duplicate.leads.length - 3} more...
                      </p>
                    )}
                  </div>

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

              {duplicateLeadDetails.length === 0 && (
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
                <Badge>
                  {await prisma.user.count({ where: { isActive: true } })}
                </Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm">Total Leads</span>
                <Badge>{await prisma.lead.count()}</Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm">Pending Review</span>
                <Badge variant="outline">
                  {await prisma.lead.count({
                    where: { status: { name: "NEW" } },
                  })}
                </Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm">Pending Verification</span>
                <Badge variant="outline">
                  {await prisma.lead.count({
                    where: { status: { name: "REVIEWED" } },
                  })}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
