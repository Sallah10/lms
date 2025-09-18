// lms-internal/src/app/api/external/leads/bulk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

const EXPECTED_API_KEY = process.env.INTERNAL_API_KEY;

function validateApiKey(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (apiKey !== EXPECTED_API_KEY) {
    return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
  }
  return null;
}

export async function POST(req: NextRequest) {
  const authError = validateApiKey(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { leads, salesRepId, salesUserEmail } = body;

    if (!leads || !Array.isArray(leads)) {
      return NextResponse.json(
        { error: "Leads array is required" },
        { status: 400 }
      );
    }

    let salesUser = null;
    if (salesRepId) {
      salesUser = await prisma.user.findFirst({
        where: {
          id: salesRepId,
          role: Role.SALES,
        },
      });
    }

    if (!salesUser && salesUserEmail) {
      salesUser = await prisma.user.findFirst({
        where: {
          email: salesUserEmail,
          role: Role.SALES,
        },
      });
    }

    if (!salesUser) {
      return NextResponse.json(
        { error: "Invalid sales user (no matching SALES user found)" },
        { status: 400 }
      );
    }

    if (!salesUser) {
      return NextResponse.json(
        { error: "Invalid sales user" },
        { status: 400 }
      );
    }

    // Find default stages/statuses
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

    // Create leads in bulk
    const createdLeads = await Promise.all(
      leads.map(async (leadData) => {
        return prisma.lead.create({
          data: {
            name: leadData.name,
            email: leadData.email,
            phone: leadData.phone || "",
            source: leadData.source || "Bulk Upload",
            notes: leadData.notes || "",
            address: leadData.address || "",
            priority: "MEDIUM",
            ownerId: salesUser.id,
            stageId: newStage.id,
            statusId: newStatus.id,
          },
        });
      })
    );

    return NextResponse.json({
      success: true,
      count: createdLeads.length,
      leads: createdLeads,
    });
  } catch (error) {
    console.error("Bulk lead creation error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
