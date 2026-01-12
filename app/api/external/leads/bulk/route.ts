// lms-internal/src/app/api/external/leads/bulk/route.ts - FIXED VERSION
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

    //  Helper function to parse dates safely
    const parseDate = (dateString?: string) => {
      if (!dateString) return null;
      try {
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? null : date;
      } catch {
        return null;
      }
    };

    // ⭐ Helper function to validate priority
    const validatePriority = (priority?: string): "LOW" | "MEDIUM" | "HIGH" => {
      const upperPriority = priority?.toUpperCase();
      if (
        upperPriority === "HIGH" ||
        upperPriority === "MEDIUM" ||
        upperPriority === "LOW"
      ) {
        return upperPriority as "LOW" | "MEDIUM" | "HIGH";
      }
      return "MEDIUM"; // Default fallback
    };

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
            service: leadData.service || "",
            assets: leadData.assets || "",
            priority: validatePriority(leadData.priority),
            nextFollowUp: parseDate(leadData.nextFollowUp),
            ownerId: salesUser.id,
            stageId: newStage.id,
            statusId: newStatus.id,
          },
        });
      })
    );

    //OPTIONAL: Create activity logs for tracking
    await Promise.all(
      createdLeads.map(async (lead) => {
        return prisma.activityLog.create({
          data: {
            action: "LEAD_CREATED",
            details: `Lead "${lead.name}" created via CSV bulk upload`,
            newValue: lead.name,
            leadId: lead.id,
            userId: salesUser.id,
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
