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
    const myLeads = url.searchParams.get("myLeads") === "true";
    const includeService = url.searchParams.get("includeService") === "true";
    const q = url.searchParams.get("q") || undefined;
    const status = url.searchParams.get("status") || undefined;
    const priority = url.searchParams.get("priority") || undefined;
    const limit = Math.min(Number(url.searchParams.get("limit") || "50"), 1000);
    const assigned = url.searchParams.get("assigned") || undefined;

    // 2. Build the WHERE clause based on user role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    // If myLeads=true or user is SALES, only show their own leads
    if (myLeads) {
      where.ownerId = session.user.id;
    }

    // Otherwise, apply normal role-based filtering
    else if (session.user.role === "SALES") {
      where.ownerId = session.user.id;
    }

    // SALES users can only see their own leads
    if (session.user.role === Role.SALES) {
      where.ownerId = session.user.id;
    }
    // ADMIN, PDM, CUSTOMER_CARE see all leads (no extra filter)

    if (assigned === "unassigned") {
      where.ownerId = null;
    } else if (assigned === "me") {
      where.ownerId = session.user.id;
    } else if (assigned && assigned !== "all") {
      where.ownerId = assigned; // Specific user ID
    }

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
        ...(includeService && { select: { service: true } }),
      },
    });

    return NextResponse.json({ leads });
  } catch (error) {
    console.error("Leads API Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// export async function POST(req: Request) {
//   try {
//     // 1. Check if user is authenticated
//     const session = await getServerSession(authOptions);
//     if (!session) {
//       return new NextResponse("Unauthorized", { status: 401 });
//     }

//     // 2. Optional: Authorize based on role (Only SALES and ADMIN can create leads)
//     if (session.user.role !== Role.SALES && session.user.role !== Role.ADMIN) {
//       return new NextResponse("Forbidden: Insufficient permissions", {
//         status: 403,
//       });
//     }

//     const body = await req.json();
//     const { name, email, phone, source, notes } = body;

//     // Basic validation
//     if (!name || !email) {
//       return new NextResponse("Name and email are required", { status: 400 });
//     }

//     // 3. Find the default "NEW" stage and status for the lead
//     const [newStage, newStatus] = await Promise.all([
//       prisma.leadStage.findFirst({ where: { name: "NEW" } }),
//       prisma.leadStatusModel.findFirst({ where: { name: "NEW" } }),
//     ]);

//     if (!newStage || !newStatus) {
//       return new NextResponse("Default lead stage or status not configured", {
//         status: 500,
//       });
//     }

//     // 4. Create the lead, assigned to the currently logged-in user
//     const lead = await prisma.lead.create({
//       data: {
//         name,
//         email,
//         phone,
//         source: source || "",
//         notes: notes || "",
//         priority: "MEDIUM",
//         ownerId: session.user.id, // THE CRITICAL LINE: Assign lead to the creator
//         stageId: newStage.id,
//         statusId: newStatus.id,
//       },
//       include: {
//         owner: { select: { name: true } },
//         stage: { select: { name: true } },
//         status: { select: { name: true } },
//       },
//     });

//     await prisma.activityLog.create({
//       data: {
//         action: "LEAD_CREATED",
//         details: `Lead "${lead.name}" created`,
//         newValue: lead.name,
//         leadId: lead.id,
//         userId: session.user.id,
//       },
//     });

//     return NextResponse.json(lead, { status: 201 });
//   } catch (error) {
//     console.error("Lead Creation Error:", error);
//     return new NextResponse("Internal Server Error", { status: 500 });
//   }
// }
export async function POST(req: Request) {
  try {
    // For external API calls, check for API key instead of session
    const apiKey = req.headers.get("x-api-key");
    const isExternalRequest = apiKey === process.env.INTERNAL_API_KEY;

    if (!isExternalRequest) {
      // For internal requests, check session
      const session = await getServerSession(authOptions);
      if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
      }

      if (
        session.user.role !== Role.SALES &&
        session.user.role !== Role.ADMIN
      ) {
        return new NextResponse("Forbidden: Insufficient permissions", {
          status: 403,
        });
      }
    }

    const body = await req.json();
    const {
      name,
      email,
      phone,
      source,
      notes,
      address,
      service,
      priority,
      salesUserId,
      salesUserEmail,
    } = body;

    // Validate required fields
    if (!name || !email) {
      return new NextResponse("Name and email are required", { status: 400 });
    }

    // Get default stage and status
    const [defaultStage, defaultStatus] = await Promise.all([
      prisma.leadStage.findFirst({ where: { name: "NEW" } }),
      prisma.leadStatusModel.findFirst({ where: { name: "NEW" } }),
    ]);

    if (!defaultStage || !defaultStatus) {
      return new NextResponse("Default stage or status not configured", {
        status: 500,
      });
    }

    // Validate priority
    const validPriority = ["HIGH", "MEDIUM", "LOW"].includes(priority)
      ? priority
      : "MEDIUM";

    // Use provided salesUserId or fallback to authenticated user
    const ownerId =
      salesUserId || (await getServerSession(authOptions))?.user?.id;

    if (!ownerId) {
      return new NextResponse("Owner ID is required", { status: 400 });
    }

    // Create the lead
    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone: phone || "",
        source: source || "",
        notes: notes || "",
        address: address || "",
        service: service || "",
        priority: validPriority as "HIGH" | "MEDIUM" | "LOW",
        ownerId,
        stageId: defaultStage.id,
        statusId: defaultStatus.id,
      },
      include: {
        owner: { select: { name: true, email: true } },
        status: { select: { name: true } },
      },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        action: "LEAD_CREATED",
        details: `Lead "${name}" created${
          isExternalRequest ? " via sales portal" : ""
        }`,
        newValue: name,
        leadId: lead.id,
        userId: ownerId,
      },
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error("Lead creation error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
