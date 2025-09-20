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

// ... imports and validateApiKey function ...

export async function GET(req: Request) {
  const authError = validateApiKey(req);
  if (authError) return authError;

  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    const userEmail = url.searchParams.get("userEmail"); // <- NEW PARAMETER

    if (!userId && !userEmail) {
      return NextResponse.json(
        { error: "User ID or User Email is required" },
        { status: 400 }
      );
    }

    // 1. Try to find the user in the Internal System's DB
    let internalUser = null;
    if (userId) {
      internalUser = await prisma.user.findUnique({
        where: { id: userId },
      });
    }

    // 2. FALLBACK: If user not found by ID, try to find by email (if provided)
    if (!internalUser && userEmail) {
      internalUser = await prisma.user.findUnique({
        where: { email: userEmail },
      });
      console.log("Resolved user by email in GET endpoint:", internalUser?.id);
    }

    // 3. If still no user found, return empty array or error
    if (!internalUser) {
      // You can choose to return an error or just an empty list.
      // Returning an empty list is often safer for the UI.
      console.warn(
        `No internal user found for ID:${userId} or Email:${userEmail}. Returning empty leads.`
      );
      return NextResponse.json({ leads: [] });
    }

    // 4. Fetch leads for the found user ID
    const leads = await prisma.lead.findMany({
      where: { ownerId: internalUser.id }, // Use the INTERNAL user's ID
      include: {
        owner: { select: { id: true, name: true, email: true } },
        status: { select: { id: true, name: true } },
        stage: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(
      `Found ${leads.length} leads for internal user ${internalUser.id}`
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

  console.log("External lead API called");

  try {
    const body = await req.json();
    console.log("Incoming body:", body);

    // DESTRUCTURE salesUserEmail FROM THE BODY
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

    // 2. Basic validation
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
      if (salesUser) {
        console.log("Resolved sales user by email =>", salesUser.id);
      }
    }

    if (!salesUser) {
      return NextResponse.json(
        { error: "Invalid sales user ID (no matching SALES user)" },
        { status: 400 }
      );
    }

    // 4. Find default stages/statuses
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

    // 5. Create the lead in the internal database
    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone: phone || "",
        source: source || "External Portal",
        notes: notes || "",
        address: address || "", // ADDED ADDRESS FIELD
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
