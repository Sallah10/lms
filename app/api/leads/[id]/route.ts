import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { sendDeletionNotificationEmail } from "@/lib/email";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const { id } = await params;
    const [lead, statuses] = await Promise.all([
      prisma.lead.findUnique({
        where: { id },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          stage: { select: { id: true, name: true } },
          status: { select: { id: true, name: true } },
        },
      }),
      prisma.leadStatusModel.findMany({
        orderBy: { name: "asc" },
      }),
    ]);

    if (!lead)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ lead, statuses });
  } catch (err) {
    console.error("Lead fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch lead" },
      { status: 500 }
    );
  }
}

// export async function DELETE(
//   req: Request,
//   { params }: { params: Promise<{ id: string }> }
// ) {
//   try {
//     const session = await getServerSession(authOptions);
//     if (!session) {
//       return new NextResponse("Unauthorized", { status: 401 });
//     }

//     const { id } = await params;

//     const lead = await prisma.lead.findUnique({
//       where: { id },
//     });

//     if (!lead) {
//       return new NextResponse("Lead not found", { status: 404 });
//     }

//     // Check permissions: Admin or lead owner can delete
//     const canDelete =
//       session.user.role === Role.ADMIN || lead.ownerId === session.user.id;

//     if (!canDelete) {
//       return new NextResponse("Forbidden", { status: 403 });
//     }

//     await prisma.lead.delete({
//       where: { id },
//     });

//     return new NextResponse(null, { status: 204 });
//   } catch (error) {
//     console.error("Lead deletion error:", error);
//     return new NextResponse("Internal Server Error", { status: 500 });
//   }
// }

// UPDATED DELETE METHOD for soft delete instead of hard delete
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const { reason } = await req.json(); // Get reason from request body

    if (!reason) {
      return new NextResponse("Deletion reason is required", { status: 400 });
    }

    const leadToDelete = await prisma.lead.findUnique({
      where: { id },
      include: {
        owner: { select: { name: true, email: true } },
      },
    });

    if (!leadToDelete) {
      return new NextResponse("Lead not found", { status: 404 });
    }

    // SOFT DELETE: Update instead of delete
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedById: session.user.id,
        deleteReason: reason,
      },
    });

    // Create audit log
    await prisma.deletionAudit.create({
      data: {
        leadId: id,
        leadName: updatedLead.name,
        leadEmail: updatedLead.email,
        deletedById: session.user.id,
        deletedByName: session.user.name || "Unknown",
        deleteReason: reason,
      },
    });

    try {
      const emailSent = await sendDeletionNotificationEmail(
        leadToDelete.name,
        leadToDelete.email,
        session.user.name || "Unknown",
        session.user.email || "Unknown",
        reason,
        leadToDelete.owner?.name || "Unassigned"
      );

      if (!emailSent) {
        console.warn("Deletion email notification failed to send");
        // Still proceed with the deletion, just log the warning
      }
    } catch (emailError) {
      console.error("Email notification failed:", emailError);
      // Don't fail the request if email fails
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Lead deletion error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Await the body to get the updated data
    const body = await req.json();

    const { id } = await params;

    // BLOCK direct status changes to invalid/rejected
    if (body.statusId) {
      const newStatus = await prisma.leadStatusModel.findUnique({
        where: { id: body.statusId },
      });

      if (newStatus?.name === "INVALID" || newStatus?.name === "REJECTED") {
        return new NextResponse(
          "Cannot directly change to INVALID or REJECTED status. Use the appropriate review process.",
          { status: 400 }
        );
      }
    }

    // Find the lead to check ownership and existence
    const leadToUpdate = await prisma.lead.findUnique({
      where: { id },
    });

    if (!leadToUpdate) {
      return new NextResponse("Lead not found", { status: 404 });
    }

    // Check permissions: Admin or lead owner can update
    const canUpdate =
      session.user.role === Role.ADMIN ||
      leadToUpdate.ownerId === session.user.id;

    if (!canUpdate) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Update the lead in the database
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        address: body.address,
        service: body.service,
        source: body.source,
        priority: body.priority,
        assets: body.assets || "", // New field
        // Use the statusId from the body to update the status relationship
        statusId: body.statusId,
        notes: body.notes,
        nextFollowUp: body.nextFollowUp,
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        stage: { select: { id: true, name: true } },
        status: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ lead: updatedLead });
  } catch (error) {
    console.error("Lead update error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
