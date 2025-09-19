"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import EnhancedLeadsTable from "@/app/(dashboard)/_components/EnhancedLeadsTable";
import { Download, Upload, RefreshCw } from "lucide-react";
import CsvImporter from "@/app/(dashboard)/_components/CsvImporter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showToast } from "@/lib/toast";

export default function LeadsPage() {
  const [showImportModal, setShowImportModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);

  // Export Function for Export files;
  const handleExport = async () => {
    try {
      showToast.loading("Preparing export...");
      // Build query string from current filters (which are in THIS component)
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (priorityFilter !== "all") params.append("priority", priorityFilter);
      if (searchTerm) params.append("search", searchTerm);

      const url = `/api/leads/export?${params.toString()}`;

      // Trigger download
      const response = await fetch(url);
      if (!response.ok) throw new Error("Export failed");

      // Create download link
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `leads-export-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      showToast.dismiss();
      showToast.success("Leads exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export leads. Please try again.");
      showToast.error("Failed to export leads");
    }
  };

  // NEW: Refresh function
  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1); // This will trigger EnhancedLeadsTable to refetch
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Leads</h1>
          <p className="text-sm text-muted-foreground">
            Manage your partner leads and track their status
          </p>
        </div>

        <div className="flex gap-2">
          <div className="flex flex-col gap-2 md:flex-row">
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
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Import CSV
            </Button>
          </div>
          <div className="flex flex-col gap-2 md:flex-row">
            <Button
              variant="outline"
              onClick={handleExport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            {/* <Link href="/dashboard/leads/new">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create New
            </Button>
          </Link> */}
            <Link href="/dashboard/leads/new">
              <Button>Create New Lead</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <Input
            placeholder="Search partners or contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:max-w-sm"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="NEW">New</SelectItem>
              <SelectItem value="REVIEWED">Reviewed</SelectItem>
              <SelectItem value="VERIFIED">Verified</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              {/* CORE STATUS FILTERS */}
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
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Priority" />
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

      {/* Enhanced Leads Table */}
      <EnhancedLeadsTable
        key={refreshKey}
        refreshKey={refreshKey}
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
      />

      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CsvImporter onClose={() => setShowImportModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
