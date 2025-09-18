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

    // Only CUSTOMER_CARE and ADMIN can access verification leads
    if (
      session.user.role !== "CUSTOMER_CARE" &&
      session.user.role !== "ADMIN"
    ) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Get REVIEWED status leads
    const reviewedStatus = await prisma.leadStatusModel.findFirst({
      where: { name: "REVIEWED" },
    });

    if (!reviewedStatus) {
      return new NextResponse("REVIEWED status not found", { status: 500 });
    }

    // Leads needing verification
    const leadsToVerify = await prisma.lead.findMany({
      where: { statusId: reviewedStatus.id },
      include: {
        owner: { select: { name: true } },
        status: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ leads: leadsToVerify });
  } catch (error) {
    console.error("Error fetching verification leads:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
