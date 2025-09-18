// lms-internal/src/app/api/external/leads/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const EXPECTED_API_KEY = process.env.INTERNAL_API_KEY;

function validateApiKey(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (apiKey !== EXPECTED_API_KEY) {
    return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
  }
  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = validateApiKey(req);
  if (authError) return authError;

  try {
    const leadId = params.id;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const userEmail = searchParams.get("userEmail");

    if (!userId && !userEmail) {
      return NextResponse.json(
        { error: "User ID or User Email is required" },
        { status: 400 }
      );
    }

    // First, find the internal user
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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Now fetch the specific lead, ensuring it belongs to this user
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        ownerId: internalUser.id,
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        status: { select: { id: true, name: true } },
        stage: { select: { id: true, name: true } },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ lead });
  } catch (error) {
    console.error("External Lead API GET Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = validateApiKey(req);
  if (authError) return authError;

  try {
    const leadId = params.id;
    const body = await req.json();
    const {
      phone,
      address,
      service,
      notes,
      priority,
      nextFollowUp,
      userId,
      userEmail,
    } = body;

    // First, find the internal user to verify ownership
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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify that the lead exists and belongs to this user
    const existingLead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        ownerId: internalUser.id,
      },
    });

    if (!existingLead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Update only the allowed fields
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        phone: phone !== undefined ? phone : existingLead.phone,
        address: address !== undefined ? address : existingLead.address,
        service: service !== undefined ? service : existingLead.service,
        notes: notes !== undefined ? notes : existingLead.notes,
        priority: priority !== undefined ? priority : existingLead.priority,
        nextFollowUp:
          nextFollowUp !== undefined
            ? new Date(nextFollowUp)
            : existingLead.nextFollowUp,
      },
    });

    return NextResponse.json({
      success: true,
      lead: updatedLead,
    });
  } catch (error) {
    console.error("External Lead API PATCH Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
