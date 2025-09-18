import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Only PDM and ADMIN can access review leads
    if (session.user.role !== "PDM" && session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Get NEW status leads
    const newStatus = await prisma.leadStatusModel.findFirst({
      where: { name: "NEW" },
    });

    if (!newStatus) {
      return new NextResponse("NEW status not found", { status: 500 });
    }

    // Leads needing review
    const leadsToReview = await prisma.lead.findMany({
      where: { statusId: newStatus.id },
      include: {
        owner: { select: { name: true } },
        status: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ leads: leadsToReview });
  } catch (error) {
    console.error("Error fetching review leads:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
