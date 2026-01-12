// app/dashboard/verification/page.tsx (COMPLETE FIXED VERSION)
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Eye,
  Clock,
  Search,
} from "lucide-react";
import { RejectionModal } from "@/components/RejectionModal";
import { reviewToasts, showToast } from "@/lib/toast";

// 👉 INTERFACE: Define what a Lead looks like
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
  // 👉 STATE VARIABLES
  const [leads, setLeads] = useState<Lead[]>([]); // All leads from API
  const [loading, setLoading] = useState(true); // Loading state
  const [rejectingLead, setRejectingLead] = useState<Lead | null>(null); // Lead being rejected
  const [searchTerm, setSearchTerm] = useState(""); // Search input value

  // 👉 EFFECT: Fetch leads when component loads
  useEffect(() => {
    fetchLeads();
  }, []); // Empty array = runs once on mount

  // 👉 FUNCTION: Fetch leads from API
  const fetchLeads = async () => {
    try {
      const response = await fetch("/api/leads/verification");
      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads); // Store leads in state
      }
    } catch (error) {
      console.error("Error fetching verification leads:", error);
      showToast.error("Failed to load leads");
    } finally {
      setLoading(false); // Stop loading
    }
  };

  // 👉 USE MEMO: Filter leads based on search term
  // This replaces the old filterLeads function + useEffect
  const filteredLeads = useMemo(() => {
    // If no search term, return all leads
    if (!searchTerm.trim()) {
      return leads;
    }

    const searchLower = searchTerm.toLowerCase();

    // Filter leads based on search criteria
    return leads.filter((lead) => {
      return (
        // Search by name
        lead.name.toLowerCase().includes(searchLower) ||
        // Search by email
        lead.email.toLowerCase().includes(searchLower) ||
        // Search by service (if exists)
        (lead.service && lead.service.toLowerCase().includes(searchLower)) ||
        // Search by phone (if exists)
        (lead.phone && lead.phone.includes(searchTerm)) ||
        // Search by owner name (if exists)
        (lead.owner?.name &&
          lead.owner.name.toLowerCase().includes(searchLower)) ||
        // Search by priority
        lead.priority.toLowerCase().includes(searchLower)
      );
    });
  }, [leads, searchTerm]); // Re-run when leads or searchTerm changes

  // 👉 FUNCTION: Verify a lead
  const handleVerify = async (leadId: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}/verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "VERIFY" }),
      });

      if (response.ok) {
        const leadName = leads.find((lead) => lead.id === leadId)?.name;
        // Remove verified lead from state
        setLeads(leads.filter((lead) => lead.id !== leadId));
        // Show success message
        reviewToasts.verified(leadName || "Lead");
        showToast.success(`Lead "${leadName}" verified successfully!`);
      }
    } catch (error) {
      console.error("Error verifying lead:", error);
      showToast.error("Failed to verify lead");
    }
  };

  // 👉 FUNCTION: Mark a lead as invalid
  const handleInvalidate = async (leadId: string, notes: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}/verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "INVALIDATE", notes }),
      });

      if (response.ok) {
        // Remove invalidated lead from state
        setLeads(leads.filter((lead) => lead.id !== leadId));
        // Close modal
        setRejectingLead(null);
        // Show success message
        showToast.success("Lead marked as invalid successfully!");
      }
    } catch (error) {
      console.error("Error invalidating lead:", error);
      showToast.error("Failed to mark lead as invalid");
    }
  };

  // 👉 LOADING STATE
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* 👉 HEADER SECTION */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">Lead Verification</h1>
          <p className="text-gray-600">
            Verify contact information and lead authenticity
          </p>
        </div>
      </div>

      {/* 👉 STATS & SEARCH SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Stats Card */}
        <Card className="md:col-span-3">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Leads Pending Verification
                </p>
                <p className="text-2xl font-bold">{leads.length}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {filteredLeads.length} match search
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        {/* Search Card */}
        <Card>
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 👉 LEADS TABLE SECTION */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Leads Awaiting Verification</CardTitle>
          {searchTerm && (
            <p className="text-sm text-gray-600">
              Showing {filteredLeads.length} of {leads.length} leads
            </p>
          )}
        </CardHeader>
        <CardContent>
          {/* 👉 EMPTY STATE */}
          {filteredLeads.length === 0 ? (
            <div className="text-center py-12">
              {leads.length === 0 ? (
                // No leads at all
                <>
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">
                    All caught up!
                  </h3>
                  <p className="text-gray-600">
                    No leads pending verification.
                  </p>
                </>
              ) : (
                // No matches for search
                <>
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">
                    No matching leads
                  </h3>
                  <p className="text-gray-600">Try a different search term</p>
                </>
              )}
            </div>
          ) : (
            // 👉 TABLE WITH LEADS
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
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="border-b hover:bg-gray-50">
                      {/* Company Name & Service */}
                      <td className="p-3">
                        <div className="font-medium">{lead.name}</div>
                        <div className="text-sm text-gray-500">
                          {lead.service || "No service specified"}
                        </div>
                      </td>

                      {/* Contact Info */}
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

                      {/* Submitted By */}
                      <td className="p-3 text-sm">
                        {lead.owner?.name || "Unassigned"}
                      </td>

                      {/* Status Badge */}
                      <td className="p-3 text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          {lead.status?.name || "REVIEWED"}
                        </span>
                      </td>

                      {/* Priority Badge */}
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

                      {/* Action Buttons */}
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {/* View Button */}
                          <Link href={`/dashboard/leads/${lead.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </Link>

                          {/* Verify Button */}
                          <Button
                            onClick={() => handleVerify(lead.id)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Verify
                          </Button>

                          {/* Invalid Button */}
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

      {/* 👉 REJECTION/INVALIDATION MODAL */}
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
