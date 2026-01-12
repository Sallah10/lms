// app/dashboard/leads/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileText,
  AlertCircle,
  Building,
  Layers,
} from "lucide-react";
import { showToast } from "@/lib/toast";

// Available services/modules
const AVAILABLE_SERVICES = [
  "Chat with a doctor",
  "Chat with a lawyer",
  "Open Market",
  "Pharmacies",
  "Logistics",
  "Store",
  "Gadgets and Accessories",
  "Foods & Drinks",
];

export default function NewLeadPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    service: "",
    source: "",
    priority: "MEDIUM",
    notes: "",
    assets: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        showToast.success("Lead created successfully!");
        router.push("/dashboard/leads");
        router.refresh();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to create lead");
      }
    } catch (error) {
      console.error("Error creating lead:", error);
      showToast.error(
        error instanceof Error ? error.message : "Failed to create lead"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setForm({ ...form, [name]: value });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
        <Link href="/dashboard/leads" className="self-start md:self-auto">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leads
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Create New Lead</h1>
          <p className="text-gray-600">Add a new partner lead to the system</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Basic Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <Building className="h-4 w-4 mr-2" />
                    Company/Partner Name *
                  </label>
                  <Input
                    name="name"
                    required
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter company or partner name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <Mail className="h-4 w-4 mr-2" />
                    Email Address *
                  </label>
                  <Input
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="email@company.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <Phone className="h-4 w-4 mr-2" />
                    Phone Number *
                  </label>
                  <Input
                    name="phone"
                    required
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <MapPin className="h-4 w-4 mr-2" />
                    Address *
                  </label>
                  <Input
                    name="address"
                    required
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Full business address"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium mb-4  text-gray-700">
                    <Layers className="h-4 w-4 mr-2" />
                    Assets
                  </label>
                  <Textarea
                    name="assets"
                    value={form.assets}
                    onChange={handleChange}
                    placeholder="List any assets or equipment included..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <MapPin className="h-4 w-4 mr-2" />
                    Source
                  </label>
                  <Input
                    name="source"
                    value={form.source}
                    onChange={handleChange}
                    placeholder="How did you find this lead?"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notes Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <Textarea
                    name="notes"
                    rows={4}
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Additional information about this lead..."
                    className="resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Metadata */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Lead Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Service/Module *
                  </label>
                  <Select
                    value={form.service}
                    onValueChange={(value) =>
                      handleSelectChange("service", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_SERVICES.map((service) => (
                        <SelectItem key={service} value={service}>
                          {service}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Priority *
                  </label>
                  <Select
                    value={form.priority}
                    onValueChange={(value) =>
                      handleSelectChange("priority", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/dashboard/leads")}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      "Create Lead"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
