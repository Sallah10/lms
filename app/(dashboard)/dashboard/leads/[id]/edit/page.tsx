// app/dashboard/leads/[id]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  service?: string;
  source?: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: { id: string; name: string };
  notes?: string;
  nextFollowUp?: string;
}

interface LeadStatus {
  id: string;
  name: string;
}

// { params }: { params: { id: string } }
export default function EditLeadPage() {
  const router = useRouter();
  const params = useParams(); // Get the params object using the hook
  const leadId = params.id as string;
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lead, setLead] = useState<Lead | null>(null);
  const [statuses, setStatuses] = useState<LeadStatus[]>([]);

  useEffect(() => {
    if (!leadId) return;
    const fetchLead = async () => {
      try {
        const response = await fetch(`/api/leads/${leadId}`);
        const data = await response.json();
        if (response.ok) {
          setLead(data.lead);
          setStatuses(data.statuses);
        } else {
          console.error("Failed to fetch lead data:", data.error);
        }
      } catch (error) {
        console.error("Error fetching lead:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLead();
  }, [leadId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead),
      });

      if (response.ok) {
        router.push(`/dashboard/leads/${leadId}`);
        router.refresh();
      } else {
        throw new Error("Failed to update lead");
      }
    } catch (error) {
      console.error("Update error:", error);
      alert("Failed to update lead. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!lead) {
    return (
      <div className="p-6">
        <p>Lead not found</p>
        <Link href="/dashboard/leads">
          <Button>Back to Leads</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/leads/${params.id}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Lead
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold">Edit Lead</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lead Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Company Name</label>
                <Input
                  value={lead.name}
                  onChange={(e) => setLead({ ...lead, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={lead.email}
                  onChange={(e) => setLead({ ...lead, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input
                  value={lead.phone || ""}
                  onChange={(e) => setLead({ ...lead, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Address</label>
                <Input
                  value={lead.address || ""}
                  onChange={(e) =>
                    setLead({ ...lead, address: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Service</label>
                <Input
                  value={lead.service || ""}
                  onChange={(e) =>
                    setLead({ ...lead, service: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Source</label>
                <Input
                  value={lead.source || ""}
                  onChange={(e) => setLead({ ...lead, source: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={lead.priority}
                  onValueChange={(value: "LOW" | "MEDIUM" | "HIGH") =>
                    setLead({ ...lead, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={lead.status.id}
                  onValueChange={(value: string) => {
                    const selectedStatus = statuses.find((s) => s.id === value);
                    if (selectedStatus) {
                      setLead({ ...lead, status: selectedStatus });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.id} value={status.id}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={lead.notes || ""}
                onChange={(e) => setLead({ ...lead, notes: e.target.value })}
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Link href={`/dashboard/leads/${params.id}`}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
