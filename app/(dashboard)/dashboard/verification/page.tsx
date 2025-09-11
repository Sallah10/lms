// app/dashboard/verification/page.tsx - FIXED VERSION
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Eye,
  Clock,
} from "lucide-react";

export default async function VerificationPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Only CUSTOMER_CARE and ADMIN can access this page
  if (session.user.role !== "CUSTOMER_CARE" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Get the status IDs we need for filtering and updating
  const [reviewedStatus, verifiedStatus, invalidStatus] = await Promise.all([
    prisma.leadStatusModel.findFirst({ where: { name: "REVIEWED" } }),
    prisma.leadStatusModel.findFirst({ where: { name: "VERIFIED" } }),
    prisma.leadStatusModel.findFirst({ where: { name: "INVALID" } }),
  ]);

  if (!reviewedStatus || !verifiedStatus || !invalidStatus) {
    throw new Error("Required lead statuses not found in database");
  }

  // Fetch leads that need verification (status = REVIEWED)
  const leadsToVerify = await prisma.lead.findMany({
    where: {
      statusId: reviewedStatus.id,
    },
    include: {
      owner: { select: { name: true } },
      status: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const handleAction = async (
    leadId: string,
    action: "verify" | "invalidate"
  ) => {
    "use server";

    // Determine the new status ID based on the action
    const newStatusId =
      action === "verify" ? verifiedStatus.id : invalidStatus.id;
    const newStatusName = action === "verify" ? "VERIFIED" : "INVALID";

    await prisma.lead.update({
      where: { id: leadId },
      data: {
        statusId: newStatusId,
        inputedStatus: newStatusName,
      },
    });

    // Add activity log
    await prisma.activityLog.create({
      data: {
        action: "STATUS_CHANGE",
        details: `Lead ${
          action === "verify" ? "verified" : "marked as invalid"
        }`,
        oldValue: "REVIEWED",
        newValue: newStatusName,
        leadId: leadId,
        userId: session.user.id,
      },
    });
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
          <h1 className="text-2xl font-semibold">Lead Verification</h1>
          <p className="text-gray-600">
            Verify contact information and lead authenticity
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
                  Leads Pending Verification
                </p>
                <p className="text-2xl font-bold">{leadsToVerify.length}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leads Awaiting Verification</CardTitle>
        </CardHeader>
        <CardContent>
          {leadsToVerify.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">
                All caught up!
              </h3>
              <p className="text-gray-600">No leads pending verification.</p>
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
                      Status
                    </th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Priority
                    </th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leadsToVerify.map((lead) => (
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
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          {lead.status?.name || "REVIEWED"}
                        </span>
                      </td>
                      <td className="p-3">
                        <Badge
                          className={
                            lead.priority === "HIGH"
                              ? "bg-red-100 text-red-800"
                              : lead.priority === "MEDIUM"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }
                        >
                          {lead.priority}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Link href={`/dashboard/leads/${lead.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </Link>
                          <form action={() => handleAction(lead.id, "verify")}>
                            <Button
                              type="submit"
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Verify
                            </Button>
                          </form>
                          <form
                            action={() => handleAction(lead.id, "invalidate")}
                          >
                            <Button
                              type="submit"
                              variant="destructive"
                              size="sm"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Invalid
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
