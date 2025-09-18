/* eslint-disable @typescript-eslint/no-unused-vars */
// app/dashboard/review/page.tsx (CLIENT-SIDE VERSION)
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { RejectionModal } from "@/components/RejectionModal";
import { reviewToasts, showToast } from "@/lib/toast";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  service: string | null;
  createdAt: string;
  owner: { name: string | null } | null;
  status: { name: string } | null;
}

export default function ReviewPage() {
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
      const response = await fetch("/api/leads/review");
      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads);
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (leadId: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "APPROVE" }),
      });

      if (response.ok) {
        // Remove from UI immediately
        setLeads(leads.filter((lead) => lead.id !== leadId));
        // Show success message
        // alert("Lead approved successfully!");
        leads.map((lead) => reviewToasts.approved(lead.name));
      }
    } catch (error) {
      console.error("Error approving lead:", error);
      // alert("Failed to approve lead");
      showToast.error("Failed to approve lead");
    }
  };

  const handleReject = async (leadId: string, notes: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REJECT", notes }),
      });

      if (response.ok) {
        // Remove from UI immediately
        setLeads(leads.filter((lead) => lead.id !== leadId));
        setRejectingLead(null);
        setRejectionNotes("");
        // Show success message
        alert("Lead rejected successfully!");
      }
    } catch (error) {
      console.error("Error rejecting lead:", error);
      alert("Failed to reject lead");
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
                <p className="text-2xl font-bold">{leads.length}</p>
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
          {leads.length === 0 ? (
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
                          <Button
                            onClick={() => handleApprove(lead.id)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => setRejectingLead(lead)}
                            variant="destructive"
                            size="sm"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
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

      {/* Rejection Modal */}
      <RejectionModal
        open={!!rejectingLead}
        onClose={() => setRejectingLead(null)}
        onConfirm={(notes: string) => {
          if (rejectingLead) {
            handleReject(rejectingLead.id, notes);
          }
        }}
        leadName={rejectingLead?.name || ""}
      />
    </div>
  );
}
