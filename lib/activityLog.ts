// lib/activityLog.ts
import { prisma } from "./prisma";

export async function createActivityLog(
  leadId: string,
  userId: string,
  action: string,
  details?: string,
  oldValue?: string,
  newValue?: string
) {
  try {
    await prisma.activityLog.create({
      data: {
        action,
        details,
        oldValue,
        newValue,
        leadId,
        userId,
      },
    });
  } catch (error) {
    console.error("Failed to create activity log:", error);
  }
}

export async function getActivityLogs(leadId: string) {
  try {
    return await prisma.activityLog.findMany({
      where: { leadId },
      include: {
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Failed to fetch activity logs:", error);
    return [];
  }
}
