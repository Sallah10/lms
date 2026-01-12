/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(dashboard)/_components/EnhancedLeadsTable.tsx (WITH PAGINATION)
"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  Trash2,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { DeleteModal } from "@/components/DeleteModal";
import { showToast } from "@/lib/toast";
import { toast } from "sonner";
import { DateRangeFilter } from "./DateFilter";

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
  status: Status;
  nextFollowUp?: string | null;
  createdAt: string;
  owner?: Owner | null;
  ownerId?: string;
}

interface LeadsResponse {
  leads: Lead[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
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
  assignedFilter?: string;
  showActions?: boolean;
  showBulkActions?: boolean;
  fetchFunction?: () => Promise<LeadsResponse>;
  queryKey?: string[];
  refreshKey?: number;
}

export default function EnhancedLeadsTable({
  searchTerm = "",
  statusFilter = "all",
  priorityFilter = "all",
  assignedFilter = "all",
  showActions = true,
  showBulkActions = true,
  fetchFunction = fetchLeads,
  queryKey = ["leads"],
  refreshKey = 0,
}: EnhancedLeadsTableProps) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const searchParams = useSearchParams();
  const urlPriority = searchParams.get("priority");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [dateRange, setDateRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({
    start: null,
    end: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  const fetchLeadsWithFilters = async () => {
    try {
      const url = new URL("/api/leads", window.location.origin);

      const isMyLeadsMode = !!fetchFunction && queryKey.includes("my-leads");

      if (isMyLeadsMode) {
        url.searchParams.append("myLeads", "true");
      }

      if (dateRange.start) {
        url.searchParams.append("startDate", dateRange.start.toISOString());
      }
      if (dateRange.end) {
        url.searchParams.append("endDate", dateRange.end.toISOString());
      }

      // Add pagination
      url.searchParams.append("page", currentPage.toString());
      url.searchParams.append("limit", itemsPerPage.toString());

      // filters
      if (searchTerm) url.searchParams.append("q", searchTerm);
      if (statusFilter !== "all")
        url.searchParams.append("status", statusFilter);
      if (priorityFilter !== "all")
        url.searchParams.append("priority", priorityFilter);

      const response = await fetch(url.toString());
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      throw new Error("Failed to fetch leads");
    } catch (error) {
      console.error("Error fetching leads:", error);
      throw error;
    }
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      ...queryKey,
      refreshKey,
      searchTerm,
      statusFilter,
      priorityFilter,
      dateRange,
      currentPage,
      itemsPerPage,
    ],
    queryFn: fetchLeadsWithFilters,
  });

  useEffect(() => {
    if (refreshKey) {
      refetch();
    }
  }, [refreshKey, refetch]);

  useEffect(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [searchTerm, statusFilter, priorityFilter, dateRange]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Optional: Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
        queryClient.invalidateQueries({ queryKey: queryKey });
        setSelectedLeads([]);
        toast.success(`Status updated for ${selectedLeads.length} leads!`);
      } else {
        const error = await res.text();
        toast.error(`Failed to update: ${error}`);
      }
    } catch (error) {
      console.error("Bulk update error:", error);
      toast.error("An error occurred during the bulk update.");
    }
  };

  const handleDeleteLead = async (reason: string) => {
    if (!leadToDelete) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/leads/${leadToDelete.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      });

      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: queryKey });
        showToast.success(`Lead "${leadToDelete.name}" archived successfully!`);
        setDeleteModalOpen(false);
      } else {
        const error = await res.text();
        throw new Error(error || "Delete failed");
      }
    } catch (error) {
      console.error("Delete error:", error);
      showToast.error("Failed to delete lead");
    } finally {
      setIsDeleting(false);
      setLeadToDelete(null);
    }
  };

  const openDeleteModal = (leadId: string, leadName: string) => {
    setLeadToDelete({ id: leadId, name: leadName });
    setDeleteModalOpen(true);
  };

  const toggleSelectAll = () => {
    setSelectedLeads(
      selectedLeads.length === processedLeads.length
        ? []
        : processedLeads.map((l: Lead) => l.id)
    );
  };

  const toggleSelectLead = (leadId: string) => {
    setSelectedLeads((prev) =>
      prev.includes(leadId)
        ? prev.filter((id) => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleBulkExport = async () => {
    if (selectedLeads.length === 0) {
      toast.error("Please select at least one lead to export");
      return;
    }

    setIsExporting(true);
    try {
      const response = await fetch("/api/leads/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds: selectedLeads }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;

        const contentDisposition = response.headers.get("content-disposition");
        const filename = contentDisposition
          ? contentDisposition.split("filename=")[1].replace(/"/g, "")
          : `leads_export_${new Date().toISOString().split("T")[0]}.csv`;

        a.download = filename;
        document.body.appendChild(a);
        a.click();

        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.success(`Exported ${selectedLeads.length} leads successfully`);
        setSelectedLeads([]);
      } else {
        throw new Error(await response.text());
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export leads");
    } finally {
      setIsExporting(false);
    }
  };

  const processedLeads = useMemo(() => {
    if (!data?.leads) return [];

    const filtered = data.leads.filter((lead: Lead) => {
      const matchesSearch =
        searchTerm === "" ||
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.phone &&
          lead.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.address &&
          lead.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.service &&
          lead.service.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" || lead.status.name === statusFilter;
      const matchesPriority =
        priorityFilter === "all" ||
        lead.priority === priorityFilter ||
        (urlPriority && lead.priority === urlPriority);

      const matchesAssigned =
        assignedFilter === "all" ||
        (assignedFilter === "unassigned" && !lead.owner?.id) ||
        (assignedFilter === "me" && lead.owner?.id === session?.user?.id) ||
        (assignedFilter !== "all" &&
          assignedFilter !== "unassigned" &&
          assignedFilter !== "me" &&
          lead.owner?.id === assignedFilter);

      return (
        matchesSearch && matchesStatus && matchesPriority && matchesAssigned
      );
    });

    filtered.sort((a: Lead, b: Lead) => {
      let aValue: any = a[sortField as keyof Lead];
      let bValue: any = b[sortField as keyof Lead];

      if (sortField === "owner") {
        aValue = a.owner?.name || "";
        bValue = b.owner?.name || "";
      }

      if (sortField === "createdAt" || sortField === "nextFollowUp") {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }

      if (aValue == null) aValue = "";
      if (bValue == null) bValue = "";

      if (typeof aValue !== "number" && typeof bValue !== "number") {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }

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
    assignedFilter,
    sortField,
    sortDirection,
    session?.user?.id,
    urlPriority,
  ]);

  // Generate pagination buttons
  const generatePaginationButtons = () => {
    if (!data?.pagination) return [];

    const { currentPage: apiCurrentPage, totalPages } = data.pagination;
    const buttons = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(
      1,
      apiCurrentPage - Math.floor(maxVisiblePages / 2)
    );
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(i);
    }

    return buttons;
  };

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
      <div className="bg-white p-4 rounded-lg shadow">
        <DateRangeFilter
          onDateRangeChange={(range) => {
            setDateRange(range);
          }}
        />
      </div>

      {/* Bulk Actions Bar */}
      {showBulkActions && selectedLeads.length > 0 && (
        <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
          <span className="text-sm text-blue-800">
            {selectedLeads.length} lead(s) selected
          </span>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Bulk Actions (Change Status)
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
            <Button
              onClick={handleBulkExport}
              variant="outline"
              size="sm"
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export Selected ({selectedLeads.length})
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              {showBulkActions && (
                <th className="p-3 w-12">
                  <Checkbox
                    checked={
                      selectedLeads.length === processedLeads.length &&
                      processedLeads.length > 0
                    }
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
              )}
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
                onClick={() => handleSort("owner")}
              >
                <div className="flex items-center">
                  Sales Rep
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                  {sortField === "owner" &&
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
              {showActions && (
                <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="w-full">
            {processedLeads.map((lead: Lead) => (
              <tr key={lead.id} className="border-b hover:bg-gray-50">
                {showBulkActions && (
                  <td className="p-3">
                    <Checkbox
                      checked={selectedLeads.includes(lead.id)}
                      onCheckedChange={() => toggleSelectLead(lead.id)}
                    />
                  </td>
                )}
                <td className="p-3">
                  <div className="font-medium">{lead.name}</div>
                </td>
                <td className="p-3">
                  <div className="flex items-center text-xs">
                    <Mail className="h-3 w-3 mr-1 text-gray-400" />
                    {lead.email}
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Phone className="h-3 w-3 mr-1 text-gray-400 " />
                    {lead.phone || "N/A"}
                  </div>
                </td>
                <td className="p-3 text-xs">{lead.service || "N/A"}</td>
                <td className="p-3 text-sm">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="truncate max-w-[120px] block">
                          {lead.address || "N/A"}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs break-words">{lead.address}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </td>
                <td className="p-3 text-xs">
                  <Badge variant="outline">{lead.source || "N/A"}</Badge>
                </td>
                <td className="p-3 text-xs">
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
                <td className="p-3 text-xs">
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
                                      : "bg-gray-100 text-gray-800"
                    }
                  >
                    {lead.status.name}
                  </Badge>
                </td>
                <td className="p-3 text-sm">
                  {lead.owner?.name || "Unassigned"}
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
                {showActions && (
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/leads/${lead.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      {session?.user?.role === "ADMIN" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteModal(lead.id, lead.name)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </td>
                )}
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

      {/* Pagination Controls */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex flex-col md:flex-row items-center justify-between border-t pt-4 gap-4">
          <div className="text-sm text-gray-700">
            Showing{" "}
            <span className="font-medium">
              {Math.min(data.pagination.itemsPerPage, data.leads.length)}
            </span>{" "}
            of <span className="font-medium">{data.pagination.totalItems}</span>{" "}
            leads
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(data.pagination.currentPage - 1)}
              disabled={data.pagination.currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {generatePaginationButtons().map((pageNum) => (
              <Button
                key={pageNum}
                variant={
                  data.pagination.currentPage === pageNum
                    ? "default"
                    : "outline"
                }
                size="sm"
                onClick={() => handlePageChange(pageNum)}
              >
                {pageNum}
              </Button>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(data.pagination.currentPage + 1)}
              disabled={
                data.pagination.currentPage === data.pagination.totalPages
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModalOpen && leadToDelete && (
        <DeleteModal
          open={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setLeadToDelete(null);
          }}
          onConfirm={handleDeleteLead}
          title="Archive Lead"
          description="This lead will be moved to archives. The CTO will be notified of this action with the reason provided."
          itemName={leadToDelete.name}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}
