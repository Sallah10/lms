// app/dashboard/notifications/page.tsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import NotificationsClient from "./NotificationsClient";

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  // Fetch activity logs
  const activityLogs = await prisma.activityLog.findMany({
    where: {
      // ✅ Include all important actions including deletions
      OR: [
        { action: "LEAD_DELETED" },
        { action: "LEAD_ARCHIVED" },
        { action: "LEAD_CREATED" },
        { action: "LEAD_UPDATED" },
        { action: "STATUS_CHANGE" },
        { action: "BULK_LEAD_IMPORT" },
        // Add any other actions you want to track
      ],
    },
    include: {
      user: { select: { name: true, email: true } },
      lead: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  console.log("📊 Activity logs fetched:", activityLogs.length);
  activityLogs.forEach((log) => {
    console.log(`- ${log.action}: ${log.details}`);
  });

  // Fetch duplicate leads
  const duplicateLeads = await prisma.lead.groupBy({
    by: ["email"],
    having: {
      email: { _count: { gt: 1 } },
    },
    orderBy: {
      _count: { email: "desc" },
    },
  });

  // Get detailed info for duplicate leads
  const duplicateLeadDetails = await Promise.all(
    duplicateLeads.map(async (group) => {
      const leads = await prisma.lead.findMany({
        where: { email: group.email },
        include: { owner: { select: { name: true } } },
      });
      return {
        email: group.email,
        name: leads[0]?.name || group.email,
        count: leads.length,
        leads: leads.map((lead) => ({
          id: lead.id,
          name: lead.name,
          owner: lead.owner ? { name: lead.owner.name } : null,
          // owner: lead.owner?.name || 'Unassigned',
          createdAt: lead.createdAt,
        })),
      };
    })
  );

  // Get system stats
  const systemStats = {
    totalUsers: await prisma.user.count({ where: { isActive: true } }),
    totalLeads: await prisma.lead.count(),
    pendingReview: await prisma.lead.count({
      where: { status: { name: "NEW" } },
    }),
    pendingVerification: await prisma.lead.count({
      where: { status: { name: "REVIEWED" } },
    }),
  };

  return (
    <NotificationsClient
      initialActivities={activityLogs}
      duplicateLeads={duplicateLeadDetails}
      systemStats={systemStats}
    />
  );
}
