import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function GET(req: Request) {
  try {
    // 1. Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const url = new URL(req.url);
    const q = url.searchParams.get("q") || undefined;
    const status = url.searchParams.get("status") || undefined;
    const priority = url.searchParams.get("priority") || undefined;
    const limit = Math.min(Number(url.searchParams.get("limit") || "50"), 1000);

    // 2. Build the WHERE clause based on user role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    // SALES users can only see their own leads
    if (session.user.role === Role.SALES) {
      where.ownerId = session.user.id;
    }
    // ADMIN, PDM, CUSTOMER_CARE see all leads (no extra filter)

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
      ];
    }
    if (status) where.status = status;
    if (priority) where.priority = priority;

    // 3. Fetch the leads with the appropriate filter
    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        owner: { select: { id: true, name: true } },
        stage: { select: { id: true, name: true } },
        status: { select: { id: true, name: true } }, // Include status relation
      },
    });

    return NextResponse.json({ leads });
  } catch (error) {
    console.error("Leads API Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // 1. Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Optional: Authorize based on role (Only SALES and ADMIN can create leads)
    if (session.user.role !== Role.SALES && session.user.role !== Role.ADMIN) {
      return new NextResponse("Forbidden: Insufficient permissions", {
        status: 403,
      });
    }

    const body = await req.json();
    const { name, email, phone, source, notes } = body;

    // Basic validation
    if (!name || !email) {
      return new NextResponse("Name and email are required", { status: 400 });
    }

    // 3. Find the default "NEW" stage and status for the lead
    const [newStage, newStatus] = await Promise.all([
      prisma.leadStage.findFirst({ where: { name: "NEW" } }),
      prisma.leadStatusModel.findFirst({ where: { name: "NEW" } }),
    ]);

    if (!newStage || !newStatus) {
      return new NextResponse("Default lead stage or status not configured", {
        status: 500,
      });
    }

    // 4. Create the lead, assigned to the currently logged-in user
    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone,
        source: source || "",
        notes: notes || "",
        priority: "MEDIUM",
        ownerId: session.user.id, // THE CRITICAL LINE: Assign lead to the creator
        stageId: newStage.id,
        statusId: newStatus.id,
      },
      include: {
        owner: { select: { name: true } },
        stage: { select: { name: true } },
        status: { select: { name: true } },
      },
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error("Lead Creation Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
