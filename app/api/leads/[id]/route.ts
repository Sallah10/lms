import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

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

    const lead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      return new NextResponse("Lead not found", { status: 404 });
    }

    // Check permissions: Admin or lead owner can delete
    const canDelete =
      session.user.role === Role.ADMIN || lead.ownerId === session.user.id;

    if (!canDelete) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    await prisma.lead.delete({
      where: { id },
    });

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
