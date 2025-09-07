"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateLeadPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    source: "",
    notes: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setIsLoading(false);

    if (res.ok) {
      router.push("/dashboard/leads");
      router.refresh(); // Refresh the page to show the new lead
    } else {
      const error = await res.text();
      alert(`Failed to create lead: ${error}`);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Create New Lead</h1>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 bg-white p-6 rounded-lg shadow"
      >
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Name *
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="John Doe"
            value={form.name}
            onChange={handleChange}
            className="border border-gray-300 rounded p-2 w-full"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="john@example.com"
            value={form.email}
            onChange={handleChange}
            className="border border-gray-300 rounded p-2 w-full"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-1">
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            placeholder="+1234567890"
            value={form.phone}
            onChange={handleChange}
            className="border border-gray-300 rounded p-2 w-full"
          />
        </div>

        <div>
          <label htmlFor="source" className="block text-sm font-medium mb-1">
            Source
          </label>
          <input
            id="source"
            name="source"
            placeholder="Website, Referral, etc."
            value={form.source}
            onChange={handleChange}
            className="border border-gray-300 rounded p-2 w-full"
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="Any initial notes..."
            value={form.notes}
            onChange={handleChange}
            className="border border-gray-300 rounded p-2 w-full"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? "Creating..." : "Create Lead"}
        </button>
      </form>
    </div>
  );
}
