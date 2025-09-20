import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { leadActivityLogs } from "@/lib/activityLog";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: leadId } = await params;

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Only CUSTOMER_CARE and ADMIN can verify leads
    if (
      session.user.role !== "CUSTOMER_CARE" &&
      session.user.role !== "ADMIN"
    ) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await request.json();
    const { action, notes } = body;

    // Find the lead
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        status: true, // Include current status
      },
    });

    if (!lead) {
      return new NextResponse("Lead not found", { status: 404 });
    }

    // Store the OLD status for logging
    const oldStatus = lead.status.name;

    // Find statuses
    const [reviewedStatus, verifiedStatus, invalidStatus] = await Promise.all([
      prisma.leadStatusModel.findFirst({ where: { name: "REVIEWED" } }),
      prisma.leadStatusModel.findFirst({ where: { name: "VERIFIED" } }),
      prisma.leadStatusModel.findFirst({ where: { name: "INVALID" } }),
    ]);

    if (!reviewedStatus || !verifiedStatus || !invalidStatus) {
      return new NextResponse("Status configuration error", { status: 500 });
    }

    let newStatusId: string;
    let inputedStatus: string;
    let actionType: string;

    if (action === "VERIFY") {
      newStatusId = verifiedStatus.id;
      inputedStatus = "VERIFIED";
      actionType = "VERIFIED";
    } else if (action === "INVALIDATE") {
      newStatusId = invalidStatus.id;
      inputedStatus = "INVALID";
      actionType = "INVALIDATED";
    } else {
      return new NextResponse("Invalid action", { status: 400 });
    }

    // Update the lead
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        statusId: newStatusId,
        inputedStatus,
        notes: notes
          ? `${lead.notes || ""}\n\nVerification Notes: ${notes}`.trim()
          : lead.notes,
      },
      include: {
        status: true, // Include new status
      },
    });

    // ✅ ADD ACTIVITY LOG HERE
    await leadActivityLogs.statusChange(
      leadId,
      lead.name,
      oldStatus, // Old status
      updatedLead.status.name, // New status
      session.user.id,
      action === "INVALIDATE"
        ? `Invalidation reason: ${notes}`
        : "Lead verified"
    );

    // Create activity log
    await prisma.activityLog.create({
      data: {
        action: `LEAD_${actionType}`,
        details:
          action === "INVALIDATE" ? `Invalidation notes: ${notes}` : null,
        oldValue: lead.statusId,
        newValue: newStatusId,
        leadId: lead.id,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true, lead: updatedLead });
  } catch (error) {
    console.error("Verification action error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
