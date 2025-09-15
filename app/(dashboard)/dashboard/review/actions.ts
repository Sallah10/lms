"use server";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export async function approveLead(leadId: string) {
  return handleAction(leadId, "approve");
}

export async function rejectLead(leadId: string) {
  return handleAction(leadId, "reject");
}

async function handleAction(leadId: string, action: "approve" | "reject") {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  const [reviewedStatus, rejectedStatus] = await Promise.all([
    prisma.leadStatusModel.findFirst({ where: { name: "REVIEWED" } }),
    prisma.leadStatusModel.findFirst({ where: { name: "REJECTED" } }),
  ]);

  if (!reviewedStatus || !rejectedStatus) {
    throw new Error("Statuses missing");
  }

  const newStatusId =
    action === "approve" ? reviewedStatus.id : rejectedStatus.id;

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      statusId: newStatusId,
      inputedStatus: action === "approve" ? "REVIEWED" : "REJECTED",
    },
  });

  await prisma.activityLog.create({
    data: {
      action: "STATUS_CHANGE",
      details: `Lead ${
        action === "approve" ? "approved" : "rejected"
      } in review`,
      oldValue: "NEW",
      newValue: action === "approve" ? "REVIEWED" : "REJECTED",
      leadId,
      userId: session.user.id,
    },
  });
}
