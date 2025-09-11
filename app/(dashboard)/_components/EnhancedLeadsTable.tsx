/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Eye,
  Phone,
  Mail,
  Calendar,
  MoreHorizontal,
  ArrowUpDown,
} from "lucide-react";

interface Owner {
  id: string;
  name: string;
}

interface Status {
  id: string;
  name: string;
}

interface Lead {
  id: string;
  name: string;

  address: string;
  email: string;
  phone?: string | null;
  service?: string | null;
  source?: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
  // status: "NEW" | "REVIEWED" | "VERIFIED" | "REJECTED";
  // status:
  //   | "NEW"
  //   | "REVIEWED"
  //   | "VERIFIED"
  //   | "REJECTED"
  //   | "PROPOSAL_SENT"
  //   | "PROPOSAL_CONFIRMED"
  //   | "AGREED"
  //   | "AWAITING_ONBOARDING"
  //   | "ONBOARDING"
  //   | "ONBOARDED";
  status: Status;
  nextFollowUp?: string | null;
  createdAt: string;
  owner?: Owner | null;
}

interface LeadsResponse {
  leads: Lead[];
}

async function fetchLeads(): Promise<LeadsResponse> {
  const res = await fetch("/api/leads");
  if (!res.ok) throw new Error("Failed to fetch leads");
  return res.json();
}

interface EnhancedLeadsTableProps {
  searchTerm?: string;
  statusFilter?: string;
  priorityFilter?: string;
}

export default function EnhancedLeadsTable({
  searchTerm = "",
  statusFilter = "all",
  priorityFilter = "all",
}: EnhancedLeadsTableProps) {
  const queryClient = useQueryClient();
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const { data, isLoading, error } = useQuery({
    queryKey: ["leads"],
    queryFn: fetchLeads,
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch("/api/leads/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds: selectedLeads, status: newStatus }),
      });

      if (res.ok) {
        // SUCCESS: Invalidate the query to refetch fresh data
        queryClient.invalidateQueries({ queryKey: ["leads"] });
        setSelectedLeads([]);
        alert(`Status updated successfully for ${selectedLeads.length} leads!`);
      } else {
        const error = await res.text();
        alert(`Failed to update: ${error}`);
      }
    } catch (error) {
      console.error("Bulk update error:", error);
      alert("An error occurred during the bulk update.");
    }
  };

  const toggleSelectAll = () => {
    setSelectedLeads(
      selectedLeads.length === processedLeads.length
        ? []
        : processedLeads.map((l) => l.id)
    );
  };

  const toggleSelectLead = (leadId: string) => {
    setSelectedLeads((prev) =>
      prev.includes(leadId)
        ? prev.filter((id) => id !== leadId)
        : [...prev, leadId]
    );
  };

  const processedLeads = useMemo(() => {
    if (!data?.leads) return [];

    const filtered = data.leads.filter((lead) => {
      const matchesSearch =
        searchTerm === "" ||
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.phone &&
          lead.phone.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" || lead.status.name === statusFilter;
      const matchesPriority =
        priorityFilter === "all" || lead.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      // Get values for sorting - use type assertion to handle different types
      let aValue: any = a[sortField as keyof typeof a];
      let bValue: any = b[sortField as keyof typeof b];

      // Handle nested fields
      if (sortField === "owner") {
        aValue = a.owner?.name || "";
        bValue = b.owner?.name || "";
      }

      // Handle date fields - convert to timestamps for comparison
      if (sortField === "createdAt" || sortField === "nextFollowUp") {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }

      // Handle null/undefined values
      if (aValue == null) aValue = "";
      if (bValue == null) bValue = "";

      // Convert to string for consistent comparison if not numbers
      if (typeof aValue !== "number" && typeof bValue !== "number") {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }

      // Perform comparison
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [
    data,
    searchTerm,
    statusFilter,
    priorityFilter,
    sortField,
    sortDirection,
  ]);

  if (isLoading)
    return <div className="flex justify-center p-8">Loading leads...</div>;
  if (error)
    return (
      <div className="flex justify-center p-8 text-red-600">
        Error loading leads
      </div>
    );

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {selectedLeads.length > 0 && (
        <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
          <span className="text-sm text-blue-800">
            {selectedLeads.length} lead(s) selected
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Bulk Actions
                <MoreHorizontal className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() => handleBulkStatusChange("REVIEWED")}
              >
                Mark as Reviewed
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleBulkStatusChange("VERIFIED")}
              >
                Mark as Verified
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleBulkStatusChange("REJECTED")}
              >
                Mark as Rejected
              </DropdownMenuItem>
              {/* CORE STATUS OPTIONS */}
              <DropdownMenuItem
                onClick={() => handleBulkStatusChange("PROPOSAL_SENT")}
              >
                Mark as Proposal Sent
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleBulkStatusChange("PROPOSAL_CONFIRMED")}
              >
                Mark as Proposal Confirmed
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleBulkStatusChange("AGREED")}
              >
                Mark as Agreed
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleBulkStatusChange("ONBOARDING")}
              >
                Mark as Onboarding
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleBulkStatusChange("ONBOARDED")}
              >
                Mark as Onboarded
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-3 w-12">
                <Checkbox
                  checked={
                    selectedLeads.length === processedLeads.length &&
                    processedLeads.length > 0
                  }
                  onCheckedChange={toggleSelectAll}
                />
              </th>
              <th
                className="p-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center">
                  Partner
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                  {sortField === "name" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </div>
              </th>
              <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">
                Contact
              </th>
              <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">
                Service
              </th>
              <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">
                Address
              </th>
              <th
                className="p-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("source")}
              >
                <div className="flex items-center">
                  Source
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                  {sortField === "source" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </div>
              </th>
              {/* address */}
              {/* <th
                className="p-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("address")}
              >
                <div className="flex items-center">
                  Address
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                  {sortField === "address" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </div>
              </th>
              address end here , trying to test sth */}
              <th
                className="p-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("priority")}
              >
                <div className="flex items-center">
                  Priority
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                  {sortField === "priority" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </div>
              </th>
              <th
                className="p-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center">
                  Status
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                  {sortField === "status" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </div>
              </th>
              <th
                className="p-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("nextFollowUp")}
              >
                <div className="flex items-center">
                  Follow-up
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                  {sortField === "nextFollowUp" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </div>
              </th>
              <th
                className="p-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("createdAt")}
              >
                <div className="flex items-center">
                  Created
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                  {sortField === "createdAt" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </div>
              </th>
              <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {processedLeads.map((lead) => (
              <tr key={lead.id} className="border-b hover:bg-gray-50">
                <td className="p-3">
                  <Checkbox
                    checked={selectedLeads.includes(lead.id)}
                    onCheckedChange={() => toggleSelectLead(lead.id)}
                  />
                </td>
                <td className="p-3">
                  <div className="font-medium">{lead.name}</div>
                  <div className="text-sm text-gray-500">{lead.address}</div>
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
                <td className="p-3 text-sm">{lead.service || "N/A"}</td>
                <td className="p-3 text-sm">{lead.address || "N/A"}</td>
                <td className="p-3">
                  <Badge variant="outline">{lead.source || "N/A"}</Badge>
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
                        : lead.status.name === "PROPOSAL_SENT"
                        ? "bg-orange-100 text-orange-800"
                        : lead.status.name === "PROPOSAL_CONFIRMED"
                        ? "bg-indigo-100 text-indigo-800"
                        : lead.status.name === "AGREED"
                        ? "bg-teal-100 text-teal-800"
                        : lead.status.name === "ONBOARDING"
                        ? "bg-cyan-100 text-cyan-800"
                        : "bg-gray-100 text-gray-800" // ONBOARDED or others
                    }
                  >
                    {lead.status.name}
                  </Badge>
                </td>
                <td className="p-3 text-sm">
                  {lead.nextFollowUp ? (
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                      {new Date(lead.nextFollowUp).toLocaleDateString()}
                    </div>
                  ) : (
                    "N/A"
                  )}
                </td>
                <td className="p-3 text-sm">
                  {new Date(lead.createdAt).toLocaleDateString()}
                </td>
                <td className="p-3">
                  <Link href={`/dashboard/leads/${lead.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {processedLeads.length === 0 && (
          <div className="text-center p-8 text-gray-500">
            No leads found.{" "}
            <Link
              href="/dashboard/leads/new"
              className="text-blue-600 hover:underline"
            >
              Create one?
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
