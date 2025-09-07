/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(dashboard)/leads/page.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

async function fetchLeads(
  params: { q?: string; status?: string; priority?: string } = {}
) {
  const url = new URL("/api/leads", location.origin);
  if (params.q) url.searchParams.set("q", params.q);
  if (params.status) url.searchParams.set("status", params.status);
  if (params.priority) url.searchParams.set("priority", params.priority);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch leads");
  return res.json();
}

export default function LeadsPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["leads", q, status, priority],
    queryFn: () => fetchLeads({ q, status, priority }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Leads</h1>
        <Link
          href="/dashboard/leads/new"
          className="px-3 py-2 bg-blue-600 text-white rounded"
        >
          Create New Lead
        </Link>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <div className="flex gap-3 items-center mb-4">
          <input
            placeholder="Search name or email..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="border rounded p-2 w-full"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded p-2"
          >
            <option value="">All status</option>
            <option value="PROPOSAL_SENT">Proposal sent</option>
            <option value="ONBOARDING">Onboarding</option>
            <option value="ONBOARDED">Onboarded</option>
          </select>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="border rounded p-2"
          >
            <option value="">All priority</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
          <button
            onClick={() => refetch()}
            className="px-3 py-2 bg-gray-100 rounded"
          >
            Filter
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <div>Loading...</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="text-xs text-gray-500 text-left">
                <tr>
                  <th className="py-2 pr-6">Partner</th>
                  <th className="py-2 pr-6">Contact</th>
                  <th className="py-2 pr-6">Status</th>
                  <th className="py-2 pr-6">Priority</th>
                  <th className="py-2 pr-6">Sales</th>
                  <th className="py-2 pr-6">Created</th>
                  <th className="py-2 pr-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.leads?.map((l: any) => (
                  <tr
                    key={l.id}
                    className="border-t hover:bg-gray-50  even:bg-gray-50/50"
                  >
                    <td className="py-3 pr-6">
                      <Link
                        href={`/dashboard/leads/${l.id}`}
                        className="text-blue-600 font-medium"
                      >
                        {l.name}
                      </Link>
                    </td>
                    <td className="py-3 pr-6">
                      <div>{l.email}</div>
                      <div className="text-xs text-gray-500">{l.phone}</div>
                    </td>
                    <td className="py-3 pr-6">{l.status?.name ?? "-"}</td>
                    <td className="py-3 pr-6">{l.priority}</td>
                    <td className="py-3 pr-6">{l.owner?.name}</td>
                    <td className="py-3 pr-6">
                      {new Date(l.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-6">
                      <Link
                        href={`/dashboard/leads/${l.id}/edit`}
                        className="text-sm text-blue-600"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data?.leads?.length && (
              <div className="text-center p-8 text-gray-500 border-t">
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
        )}
      </div>
    </div>
  );
}
