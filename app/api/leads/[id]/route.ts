import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const { id } = params;
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        stage: { select: { id: true, name: true } },
        status: { select: { id: true, name: true } },
      },
    });
    if (!lead)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ lead });
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const lead = await prisma.lead.findUnique({
      where: { id: params.id },
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
      where: { id: params.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Lead deletion error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
