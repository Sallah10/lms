import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Eye,
  Clock,
} from "lucide-react";
import { approveLead, rejectLead } from "./actions";

export default async function ReviewPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Only PDM and ADMIN can access this page
  if (session.user.role !== "PDM" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Get status "NEW"
  const newStatus = await prisma.leadStatusModel.findFirst({
    where: { name: "NEW" },
  });
  if (!newStatus) throw new Error("NEW status not found");

  // Leads needing review
  const leadsToReview = await prisma.lead.findMany({
    where: { statusId: newStatus.id },
    include: {
      owner: { select: { name: true } },
      status: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

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
          <h1 className="text-2xl font-semibold">Lead Review</h1>
          <p className="text-gray-600">
            Review and approve new leads submitted by sales team
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Leads Pending Review
                </p>
                <p className="text-2xl font-bold">{leadsToReview.length}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leads Awaiting Review</CardTitle>
        </CardHeader>
        <CardContent>
          {leadsToReview.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">
                All caught up!
              </h3>
              <p className="text-gray-600">No leads pending review.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Company
                    </th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Contact
                    </th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Submitted By
                    </th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Submitted On
                    </th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leadsToReview.map((lead) => (
                    <tr key={lead.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="font-medium">{lead.name}</div>
                        <div className="text-sm text-gray-500">
                          {lead.service || "No service specified"}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center text-sm">
                          <Mail className="h-3 w-3 mr-1 text-gray-400" />
                          {lead.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Phone className="h-3 w-3 mr-1 text-gray-400" />
                          {lead.phone || "N/A"}
                        </div>
                      </td>
                      <td className="p-3 text-sm">
                        {lead.owner?.name || "Unassigned"}
                      </td>
                      <td className="p-3 text-sm">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Link href={`/dashboard/leads/${lead.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </Link>
                          <form action={approveLead.bind(null, lead.id)}>
                            <Button
                              type="submit"
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          </form>
                          <form action={rejectLead.bind(null, lead.id)}>
                            <Button
                              type="submit"
                              variant="destructive"
                              size="sm"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
