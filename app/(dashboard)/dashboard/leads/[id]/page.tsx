// app/dashboard/leads/[id]/page.tsx
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
  Edit,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  Globe,
  FileText,
  AlertCircle,
} from "lucide-react";
import { DeleteLeadButton } from "@/app/(dashboard)/_components/DeleteLeadButton";
import { ActivityLogs } from "@/components/ActivityLogs";

interface PageProps {
  params: { id: string };
}

export default async function LeadDetailPage({ params }: PageProps) {
  const { id: leadId } = await params;

  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      stage: { select: { name: true } },
      status: { select: { name: true } },
    },
  });

  if (!lead) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Lead Not Found</h1>
        <p className="text-gray-600 mb-4">
          The requested lead could not be found.
        </p>
        <Link href="/dashboard/leads">
          <Button>Back to Leads</Button>
        </Link>
      </div>
    );
  }

  // Check if user has permission to edit/delete
  const canEdit =
    session.user.role === "ADMIN" ||
    session.user.role === "PDM" ||
    (session.user.role === "SALES" && lead.ownerId === session.user.id);

  return (
    <div className="px-6 py-2 space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <Link href="/dashboard/leads">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Leads
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">{lead.name}</h1>
            <p className="text-gray-600">Lead Details & Activity</p>
          </div>
        </div>

        {canEdit && (
          <div className="flex gap-2">
            <Link href={`/dashboard/leads/${leadId}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit Lead
              </Button>
            </Link>
            <DeleteLeadButton leadId={leadId} leadName={lead.name} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Lead Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <Building className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Company Name
                    </p>
                    <p className="text-sm text-gray-900">{lead.name}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Email</p>
                    <p className="text-sm text-gray-900">{lead.email}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Phone</p>
                    <p className="text-sm text-gray-900">
                      {lead.phone || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Address</p>
                    <p className="text-sm text-gray-900">
                      {lead.address || "N/A"}
                    </p>
                  </div>
                </div>

                {lead.service && (
                  <div className="flex items-start space-x-3">
                    <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Service
                      </p>
                      <p className="text-sm text-gray-900">{lead.service}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start space-x-3">
                  <Globe className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Source</p>
                    <p className="text-sm text-gray-900">
                      {lead.source || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {lead.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-900 bg-gray-50 p-4 rounded-md">
                  {lead.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Status & Metadata */}
        <div className="space-y-6">
          {/* Status & Priority */}
          <Card>
            <CardHeader>
              <CardTitle>Status & Priority</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Status</p>
                <Badge
                  className={
                    lead.status.name === "NEW"
                      ? "bg-blue-100 text-blue-800"
                      : lead.status.name === "REVIEWED"
                      ? "bg-purple-100 text-purple-800"
                      : lead.status.name === "VERIFIED"
                      ? "bg-green-100 text-green-800"
                      : lead.status.name === "REJECTED"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                  }
                >
                  {lead.status.name}
                </Badge>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Priority
                </p>
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
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Stage</p>
                <p className="text-sm text-gray-900">
                  {lead.stage?.name || "N/A"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Assigned To</span>
                <span className="text-gray-900">
                  {lead.owner?.name || "Unassigned"}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Created</span>
                <span className="text-gray-900">
                  {new Date(lead.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Last Updated</span>
                <span className="text-gray-900">
                  {new Date(lead.updatedAt).toLocaleDateString()}
                </span>
              </div>

              {lead.nextFollowUp && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Next Follow-up</span>
                  <span className="text-gray-900">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    {new Date(lead.nextFollowUp).toLocaleDateString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <Card className="md:w-[400px]">
          <CardHeader>
            <CardTitle>Activity History</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityLogs leadId={leadId} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
