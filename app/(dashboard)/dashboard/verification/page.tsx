"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { RejectionModal } from "@/components/RejectionModal";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  service: string | null;
  priority: string;
  createdAt: string;
  owner: { name: string | null } | null;
  status: { name: string } | null;
}

export default function VerificationPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingLead, setRejectingLead] = useState<Lead | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState("");

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await fetch("/api/leads/verification");
      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads);
      }
    } catch (error) {
      console.error("Error fetching verification leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (leadId: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}/verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "VERIFY" }),
      });

      if (response.ok) {
        // Remove from UI immediately
        setLeads(leads.filter((lead) => lead.id !== leadId));
        // Show success message
        alert("Lead verified successfully!");
      }
    } catch (error) {
      console.error("Error verifying lead:", error);
      alert("Failed to verify lead");
    }
  };

  const handleInvalidate = async (leadId: string, notes: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}/verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "INVALIDATE", notes }),
      });

      if (response.ok) {
        // Remove from UI immediately
        setLeads(leads.filter((lead) => lead.id !== leadId));
        setRejectingLead(null);
        setRejectionNotes("");
        // Show success message
        alert("Lead marked as invalid successfully!");
      }
    } catch (error) {
      console.error("Error invalidating lead:", error);
      alert("Failed to mark lead as invalid");
    }
  };

  if (loading) return <div>Loading...</div>;

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
                <p className="text-2xl font-bold">{leads.length}</p>
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
          {leads.length === 0 ? (
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
                  {leads.map((lead) => (
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
                          <Button
                            onClick={() => handleVerify(lead.id)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Verify
                          </Button>
                          <Button
                            onClick={() => setRejectingLead(lead)}
                            variant="destructive"
                            size="sm"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Invalid
                          </Button>
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

      {/* Rejection/Invalidation Modal */}
      <RejectionModal
        open={!!rejectingLead}
        onClose={() => setRejectingLead(null)}
        onConfirm={(notes) => {
          if (rejectingLead) {
            handleInvalidate(rejectingLead.id, notes);
          }
        }}
        leadName={rejectingLead?.name || ""}
        title="Mark as Invalid"
        description="Please provide reasons for marking this lead as invalid. This feedback will be visible to the sales representative."
        confirmButtonText="Confirm Invalidation"
      />
    </div>
  );
}
