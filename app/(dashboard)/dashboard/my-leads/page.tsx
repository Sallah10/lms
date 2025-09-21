// app/dashboard/my-leads/page.tsx (Internal System)
"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
// import { useQueryClient } from "@tanstack/react-query"; // ADD THIS IMPORT
import EnhancedLeadsTable from "@/app/(dashboard)/_components/EnhancedLeadsTable";
import { Download, Plus, ArrowLeft, User, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

export default function MyLeadsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  // const queryClient = useQueryClient();
  const [refreshKey, setRefreshKey] = useState(0);

  // Custom fetch function for user's own leads
  async function fetchMyLeads() {
    const res = await fetch("/api/leads?myLeads=true");
    if (!res.ok) throw new Error("Failed to fetch your leads");
    return res.json();
  }

  // const handleRefresh = () => {
  //   queryClient.invalidateQueries({ queryKey: ["my-leads"] });
  // };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (priorityFilter !== "all") params.append("priority", priorityFilter);
      if (searchTerm) params.append("search", searchTerm);
      params.append("myLeads", "true");

      const url = `/api/leads/export?${params.toString()}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `my-leads-export-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export leads. Please try again.");
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1); // This will trigger EnhancedLeadsTable to refetch
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <Link href="/dashboard" className="self-start md:self-auto">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">My Assigned Leads</h1>
            <p className="text-sm text-muted-foreground">
              View and manage leads assigned to you
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2  md:grid-cols-3 gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export My Leads
          </Button>
          <Link href="/dashboard/leads/new">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create New
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-700">
                Your Lead Portfolio
              </p>
              <p className="text-2xl font-bold text-blue-900">
                {/* Count will be shown in the table */}
                My Assigned Leads
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters Card */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
          <Input
            placeholder="Search your leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="NEW">New</SelectItem>
              <SelectItem value="REVIEWED">Reviewed</SelectItem>
              <SelectItem value="VERIFIED">Verified</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="PROPOSAL_SENT">Proposal Sent</SelectItem>
              <SelectItem value="PROPOSAL_CONFIRMED">
                Proposal Confirmed
              </SelectItem>
              <SelectItem value="AGREED">Agreed</SelectItem>
              <SelectItem value="ONBOARDING">Onboarding</SelectItem>
              <SelectItem value="ONBOARDED">Onboarded</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Enhanced Leads Table - Only shows user's leads */}
      <EnhancedLeadsTable
        key={refreshKey}
        refreshKey={refreshKey}
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        fetchFunction={fetchMyLeads}
        queryKey={["my-leads"]}
        showActions={true}
        showBulkActions={false} // No bulk actions for personal view
      />
    </div>
  );
}
