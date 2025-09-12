// app/api/activity-logs/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get("leadId");
    const userId = searchParams.get("userId");
    const limit = Math.min(Number(searchParams.get("limit") || "10"), 100);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (leadId) where.leadId = leadId;
    if (userId) where.userId = userId;

    const logs = await prisma.activityLog.findMany({
      where,
      include: {
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Activity logs error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
