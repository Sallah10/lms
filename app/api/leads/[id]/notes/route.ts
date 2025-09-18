// app/api/leads/[id]/notes/route.ts (Internal System)
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const leadId = params.id;
    const { notes, userId } = await req.json();

    // Verify the user has access to this lead
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { ownerId: true },
    });

    if (!lead) {
      return new NextResponse("Lead not found", { status: 404 });
    }

    // Only allow owner or admin to update notes
    if (lead.ownerId !== session.user.id && session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Update the notes
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: { notes: notes || "" },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        action: "NOTES_UPDATED",
        details: "Lead notes updated",
        leadId: leadId,
        userId: userId || session.user.id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error updating notes:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
