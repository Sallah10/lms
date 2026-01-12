// app/api/external/leads/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
// After successfully creating a lead, add:
import { salesActivityLogs } from "@/lib/activityLog";

const EXPECTED_API_KEY = process.env.INTERNAL_API_KEY;

function validateApiKey(req: Request) {
  const apiKey = req.headers.get("x-api-key");
  if (apiKey !== EXPECTED_API_KEY) {
    return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
  }
  return null;
}

export async function GET(req: Request) {
  const authError = validateApiKey(req);
  if (authError) return authError;

  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    const userEmail = url.searchParams.get("userEmail");

    if (!userId && !userEmail) {
      return NextResponse.json(
        { error: "User ID or User Email is required" },
        { status: 400 }
      );
    }

    // find the user in the Internal System's DB
    let internalUser = null;
    if (userId) {
      internalUser = await prisma.user.findUnique({
        where: { id: userId },
      });
    }

    if (!internalUser && userEmail) {
      internalUser = await prisma.user.findUnique({
        where: { email: userEmail },
      });
    }

    if (!internalUser) {
      console.warn(
        `No internal user found for ID:${userId} or Email:${userEmail}. Returning empty leads.`
      );
      return NextResponse.json({ leads: [] });
    }

    // ✅ FIXED: Include all necessary fields
    const leads = await prisma.lead.findMany({
      where: { ownerId: internalUser.id },
      select: {
        // ✅ EXPLICITLY SELECT ALL FIELDS
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        service: true, // ✅ ADD THIS
        source: true,
        priority: true, // ✅ ADD THIS
        assets: true, // ✅ ADD THIS
        nextFollowUp: true, // ✅ ADD THIS
        createdAt: true,
        // Include relations
        owner: { select: { id: true, name: true, email: true } },
        status: { select: { id: true, name: true } },
        stage: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // ✅ ADD DEBUG LOGGING
    console.log(
      "🔍 External Leads API Response - First lead:",
      leads[0]
        ? {
            id: leads[0].id,
            name: leads[0].name,
            service: leads[0].service,
            assets: leads[0].assets,
            nextFollowUp: leads[0].nextFollowUp,
            priority: leads[0].priority,
          }
        : "No leads found"
    );

    return NextResponse.json({ leads });
  } catch (error) {
    console.error("External Lead API GET Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const apiKey = req.headers.get("x-api-key");

  if (apiKey !== EXPECTED_API_KEY) {
    return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
  }

  try {
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
      assets,
      salesUserId,
      salesUserEmail,
    } = body;

    //  validation
    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    if (!salesUserId && !salesUserEmail) {
      return NextResponse.json(
        { error: "Either salesUserId or salesUserEmail is required" },
        { status: 400 }
      );
    }

    let salesUser = await prisma.user.findUnique({
      where: { id: salesUserId },
    });

    // Ensure role is SALES
    if (salesUser && salesUser.role !== Role.SALES) {
      salesUser = null;
    }

    // FALLBACK: If not found by ID, try email lookup (if provided)
    if (!salesUser && salesUserEmail) {
      salesUser = await prisma.user.findFirst({
        where: { email: salesUserEmail, role: Role.SALES },
      });
    }

    if (!salesUser) {
      return NextResponse.json(
        { error: "Invalid sales user ID (no matching SALES user)" },
        { status: 400 }
      );
    }

    //Find default stages/statuses
    const [newStage, newStatus] = await Promise.all([
      prisma.leadStage.findFirst({ where: { name: "NEW" } }),
      prisma.leadStatusModel.findFirst({ where: { name: "NEW" } }),
    ]);

    if (!newStage || !newStatus) {
      return NextResponse.json(
        { error: "Default lead stage or status not configured" },
        { status: 500 }
      );
    }

    //  Create the lead in the internal database
    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone: phone || "",
        source: source || "External Portal",
        notes: notes || "",
        address: address || "",
        priority: priority || "MEDIUM",
        service: service || "",
        assets: assets || "",
        ownerId: salesUser.id, // Use the resolved user's ID
        stageId: newStage.id,
        statusId: newStatus.id,
      },
    });

    await salesActivityLogs.leadCreated(lead.id, lead.name, salesUser.id);

    return NextResponse.json(
      { success: true, leadId: lead.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("External Lead API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
