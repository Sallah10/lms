// app/(dashboard)/leads/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function LeadPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true } },
      stage: { select: { id: true, name: true } },
    },
  });

  if (!lead) return <div className="p-6">Lead not found</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{lead.name}</h1>
          <p className="text-sm text-gray-500">
            {lead.email} • {lead.phone}
          </p>
        </div>
        <div>
          <Link
            href={`/dashboard/leads/${lead.id}/edit`}
            className="px-3 py-2 bg-blue-600 text-white rounded"
          >
            Edit
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded shadow p-4">
          <h3 className="font-medium">Details</h3>
          <div className="mt-2 text-sm">
            <div>
              <strong>Status:</strong> {lead.status}
            </div>
            <div>
              <strong>Stage:</strong> {lead.stage?.name ?? "-"}
            </div>
            <div>
              <strong>Assigned to:</strong> {lead.owner?.name ?? "-"}
            </div>
            <div>
              <strong>Created:</strong>{" "}
              {new Date(lead.createdAt).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="bg-white rounded shadow p-4">
          <h3 className="font-medium">Activity & Notes</h3>
          <div className="mt-2 text-sm text-gray-500">
            Activity/notes will appear here (implement later).
          </div>
        </div>
      </div>
    </div>
  );
}
