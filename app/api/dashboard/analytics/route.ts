// app/api/dashboard/analytics/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    //  totals
    const totalLeads = await prisma.lead.count();

    // Get status IDs first
    const proposalSentStatus = await prisma.leadStatusModel.findUnique({
      where: { name: "PROPOSAL_SENT" },
    });
    const onboardedStatus = await prisma.leadStatusModel.findUnique({
      where: { name: "ONBOARDED" },
    });

    const proposalsSent = proposalSentStatus
      ? await prisma.lead.count({ where: { statusId: proposalSentStatus.id } })
      : 0;
    const onboarded = onboardedStatus
      ? await prisma.lead.count({ where: { statusId: onboardedStatus.id } })
      : 0;

    // Leads grouped by stage
    const stages = await prisma.leadStage.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        _count: { select: { leads: true } },
      },
    });

    const stageData = stages.map((s) => ({
      name: s.name,
      count: s._count.leads,
    }));

    // Status distribution
    const statusGroup = await prisma.lead.groupBy({
      by: ["statusId"],
      _count: { _all: true },
    });

    const statusData = await Promise.all(
      statusGroup.map(async (g) => {
        const status = await prisma.leadStatusModel.findUnique({
          where: { id: g.statusId },
        });
        return { name: status?.name ?? "Unknown", count: g._count._all };
      })
    );

    // Priority distribution
    const priorityGroup = await prisma.lead.groupBy({
      by: ["priority"],
      _count: { _all: true },
    });
    const priorityData = priorityGroup.map((p) => ({
      priority: p.priority,
      count: p._count._all, // _count is always defined in Prisma output
    }));

    // Team performance (number of leads per owner)
    const teamGroup = await prisma.lead.groupBy({
      by: ["ownerId"],
      _count: { _all: true },
    });

    const ownerIds = teamGroup.map((g) => g.ownerId);
    const owners = ownerIds.length
      ? await prisma.user.findMany({
          where: { id: { in: ownerIds } },
          select: { id: true, name: true },
        })
      : [];

    const teamPerformance = teamGroup.map((g) => ({
      ownerId: g.ownerId,
      name: owners.find((o) => o.id === g.ownerId)?.name ?? "Unknown",
      leads: g._count._all,
    }));

    // Follow-ups today
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const followUpToday = await prisma.followUp.count({
      where: { date: { gte: start, lte: end } },
    });

    // Recent leads (latest 10) with owner & stage
    const recentLeads = await prisma.lead.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        priority: true,
        createdAt: true,
        status: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
        stage: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      totalLeads,
      proposalsSent,
      onboarded,
      stageData,
      statusData,
      priorityData,
      teamPerformance,
      followUpToday,
      recentLeads,
    });
  } catch (err) {
    console.error("Analytics API error", err);
    return NextResponse.json(
      { error: "Failed to compute analytics" },
      { status: 500 }
    );
  }
}
