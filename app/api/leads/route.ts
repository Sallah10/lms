import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

// export async function GET(req: Request) {
//   try {
//     //  Check if user is authenticated
//     const session = await getServerSession(authOptions);
//     if (!session) {
//       return new NextResponse("Unauthorized", { status: 401 });
//     }

//     const url = new URL(req.url);

//     const startDate = url.searchParams.get("startDate");
//     const endDate = url.searchParams.get("endDate");
//     const page = parseInt(url.searchParams.get("page") || "1");
//     const limit = Math.min(
//       parseInt(url.searchParams.get("limit") || "20"),
//       100
//     );
//     const skip = (page - 1) * limit;

//     console.log("API received - startDate:", startDate, "endDate:", endDate);

//     const myLeads = url.searchParams.get("myLeads") === "true";
//     // const includeService = url.searchParams.get("includeService") === "true";
//     const q = url.searchParams.get("q") || undefined;
//     const status = url.searchParams.get("status") || undefined;
//     const priority = url.searchParams.get("priority") || undefined;
//     // const limit = Math.min(Number(url.searchParams.get("limit") || "50"), 1000);
//     const assigned = url.searchParams.get("assigned") || undefined;

//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     const where: any = {
//       isDeleted: false,
//     };

//     if (session.user.role === Role.SALES) {
//       where.ownerId = session.user.id;
//     }

//     if (startDate && endDate) {
//       const start = new Date(startDate);
//       const end = new Date(endDate);
//       end.setHours(23, 59, 59, 999);

//       where.createdAt = {
//         gte: start,
//         lte: end,
//       };
//     }

//     if (myLeads) {
//       where.ownerId = session.user.id;
//     }

//     if (!myLeads) {
//       if (assigned === "unassigned") {
//         where.ownerId = null;
//       } else if (assigned === "me") {
//         where.ownerId = session.user.id;
//       } else if (assigned && assigned !== "all") {
//         where.ownerId = assigned;
//       }
//     } else if (session.user.role === "SALES") {
//       where.ownerId = session.user.id;
//     }

//     if (session.user.role === Role.SALES) {
//       where.ownerId = session.user.id;
//     }

//     if (q) {
//       where.OR = [
//         { name: { contains: q, mode: "insensitive" } },
//         { email: { contains: q, mode: "insensitive" } },
//         { phone: { contains: q } },
//         { address: { contains: q, mode: "insensitive" } },
//         { service: { contains: q, mode: "insensitive" } },
//       ];
//     }
//     if (status) {
//       where.status = {
//         name: status,
//       };
//     }

//     if (priority) where.priority = priority;

//     console.log("Final where clause:", JSON.stringify(where, null, 2));

//     // Fetch the leads with the appropriate filter
//     // const leads = await prisma.lead.findMany({
//     //   where,
//     //   orderBy: { createdAt: "desc" },
//     //   take: limit,
//     //   include: {
//     //     owner: { select: { id: true, name: true } },
//     //     stage: { select: { id: true, name: true } },
//     //     status: { select: { id: true, name: true } }, // Include status relation
//     //     ...(includeService && { select: { service: true } }),
//     //   },
//     // });

//     // Fetch the leads with the appropriate filter
//     // const leads = await prisma.lead.findMany({
//     //   where,
//     //   orderBy: { createdAt: "desc" },
//     //   take: limit,
//     //   select: {
//     //     // EXPLICITLY SELECT ALL FIELDS YOU NEED
//     //     id: true,
//     //     name: true,
//     //     email: true,
//     //     phone: true,
//     //     address: true,
//     //     service: true, // ADD THIS
//     //     source: true,
//     //     priority: true,
//     //     assets: true, // ADD THIS
//     //     nextFollowUp: true, // ADD THIS
//     //     createdAt: true,
//     //     // Include relations
//     //     owner: { select: { id: true, name: true } },
//     //     stage: { select: { id: true, name: true } },
//     //     status: { select: { id: true, name: true } },
//     //     // ...(includeService && { select: { service: true } }),
//     //   },
//     // });

//     const totalCount = await prisma.lead.count({ where });

//     const leads = await prisma.lead.findMany({
//       where,
//       orderBy: { createdAt: "desc" },
//       skip,
//       take: limit,
//       include: {
//         owner: { select: { id: true, name: true } },
//         stage: { select: { id: true, name: true } },
//         status: { select: { id: true, name: true } },
//       },
//     });

//     // After fetching leads, add:
//     console.log(
//       "🔍 Leads API Response - First lead:",
//       leads[0]
//         ? {
//             id: leads[0].id,
//             name: leads[0].name,
//             service: leads[0].service,
//             assets: leads[0].assets,
//             nextFollowUp: leads[0].nextFollowUp,
//             priority: leads[0].priority,
//             hasService: "service" in leads[0],
//             hasAssets: "assets" in leads[0],
//             hasNextFollowUp: "nextFollowUp" in leads[0],
//           }
//         : "No leads found"
//     );

//     return NextResponse.json({
//       leads,
//       pagination: {
//         currentPage: page,
//         totalPages: Math.ceil(totalCount / limit),
//         totalItems: totalCount,
//         itemsPerPage: limit,
//       },
//     });
//   } catch (error) {
//     console.error("Leads API Error:", error);
//     return new NextResponse("Internal Server Error", { status: 500 });
//   }
// }

// Update your /api/leads GET endpoint to include pagination:
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const url = new URL(req.url);

    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "20"),
      100
    );
    const skip = (page - 1) * limit;

    console.log("API pagination - page:", page, "limit:", limit, "skip:", skip);

    const myLeads = url.searchParams.get("myLeads") === "true";
    const q = url.searchParams.get("q") || undefined;
    const status = url.searchParams.get("status") || undefined;
    const priority = url.searchParams.get("priority") || undefined;
    const assigned = url.searchParams.get("assigned") || undefined;

    const where: Record<string, unknown> = {
      isDeleted: false,
    };

    if (session.user.role === Role.SALES) {
      where.ownerId = session.user.id;
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      where.createdAt = {
        gte: start,
        lte: end,
      };
    }

    if (myLeads) {
      where.ownerId = session.user.id;
    }

    if (!myLeads) {
      if (assigned === "unassigned") {
        where.ownerId = null;
      } else if (assigned === "me") {
        where.ownerId = session.user.id;
      } else if (assigned && assigned !== "all") {
        where.ownerId = assigned;
      }
    } else if (session.user.role === "SALES") {
      where.ownerId = session.user.id;
    }

    if (session.user.role === Role.SALES) {
      where.ownerId = session.user.id;
    }

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { address: { contains: q, mode: "insensitive" } },
        { service: { contains: q, mode: "insensitive" } },
      ];
    }
    if (status) {
      where.status = {
        name: status,
      };
    }

    if (priority) where.priority = priority;

    console.log("Final where clause:", JSON.stringify(where, null, 2));

    // Fetch total count for pagination
    const totalCount = await prisma.lead.count({ where });

    // Fetch paginated leads
    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        owner: { select: { id: true, name: true } },
        stage: { select: { id: true, name: true } },
        status: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      leads,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error("Leads API Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
