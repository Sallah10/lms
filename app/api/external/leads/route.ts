// app/api/external/leads/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

// This is the secret key that will be shared between the Internal System and the External Portal
const EXPECTED_API_KEY = process.env.INTERNAL_API_KEY;

export async function POST(req: Request) {
  // 1. Check the API Key from the request header
  const apiKey = req.headers.get("x-api-key");

  if (apiKey !== EXPECTED_API_KEY) {
    return new NextResponse("Invalid API Key", { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, email, phone, source, notes, salesUserId } = body;

    // 2. Basic validation
    if (!name || !email || !salesUserId) {
      return new NextResponse("Name, email, and salesUserId are required", {
        status: 400,
      });
    }

    // 3. Verify the salesUserId exists and is a SALES user
    const salesUser = await prisma.user.findUnique({
      where: { id: salesUserId, role: Role.SALES },
    });

    if (!salesUser) {
      return new NextResponse("Invalid sales user ID", { status: 400 });
    }

    // 4. Find default stages/statuses
    const [newStage, newStatus] = await Promise.all([
      prisma.leadStage.findFirst({ where: { name: "NEW" } }),
      prisma.leadStatusModel.findFirst({ where: { name: "NEW" } }),
    ]);

    if (!newStage || !newStatus) {
      return new NextResponse("Default lead stage or status not configured", {
        status: 500,
      });
    }

    // 5. Create the lead in the internal database, assigned to the provided sales user
    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone: phone || "",
        source: source || "External Portal",
        notes: notes || "",
        priority: "MEDIUM",
        ownerId: salesUserId, // Assign to the sales user from the portal
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
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
