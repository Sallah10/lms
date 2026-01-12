// app/api/leads/bulk/route.ts - FIXED VERSION
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { createActivityLog } from "@/lib/activityLog";

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Only PDM, ADMIN, and CUSTOMER_CARE can perform bulk actions
    // const allowedRoles = [Role.PDM, Role.ADMIN, Role.CUSTOMER_CARE];
    // if (!allowedRoles.includes(session.user.role)) {
    //   return new NextResponse("Forbidden", { status: 403 });
    // }
    const userRole = session.user.role as Role;
    const isAllowed =
      userRole === Role.PDM ||
      userRole === Role.ADMIN ||
      userRole === Role.CUSTOMER_CARE;

    if (!isAllowed) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const { leadIds, status } = body;

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return new NextResponse("Lead IDs are required", { status: 400 });
    }

    if (!status) {
      return new NextResponse("Status is required", { status: 400 });
    }

    // Validate status values
    const allowedStatuses = [
      "REVIEWED",
      "VERIFIED",
      "REJECTED",
      "INVALID",
      "PROPOSAL_SENT",
      "PROPOSAL_CONFIRMED",
      "AGREED",
      "AWAITING_ONBOARDING",
      "ONBOARDING",
      "ONBOARDED",
    ];

    if (!allowedStatuses.includes(status)) {
      return new NextResponse("Invalid status value", { status: 400 });
    }

    // Get the status ID for the requested status name
    const statusRecord = await prisma.leadStatusModel.findFirst({
      where: { name: status },
    });

    if (!statusRecord) {
      return new NextResponse("Status not found in database", { status: 400 });
    }

    // Update all leads in the database - use statusId instead of status
    const updateResult = await prisma.lead.updateMany({
      where: {
        id: { in: leadIds },
      },
      data: {
        statusId: statusRecord.id,
        inputedStatus: status, //  update the text field if needed
      },
    });

    // Create activity logs for each updated lead
    for (const leadId of leadIds) {
      await createActivityLog({
        action: "STATUS_CHANGE",
        details: `Bulk status update by ${session.user.name} (${session.user.role})`,
        newValue: status,
        leadId: leadId,
        userId: session.user.id,
      });
    }
    return NextResponse.json({
      success: true,
      message: `Successfully updated ${updateResult.count} lead(s)`,
      count: updateResult.count,
    });
  } catch (error) {
    console.error("Bulk update error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
