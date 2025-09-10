// app/api/external/leads/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

const EXPECTED_API_KEY = process.env.INTERNAL_API_KEY;

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
        priority: "MEDIUM",
        ownerId: salesUser.id, // Use the resolved user's ID
        stageId: newStage.id,
        statusId: newStatus.id,
      },
    });

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
