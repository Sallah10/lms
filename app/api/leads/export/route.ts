/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/leads/export/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Parser } from "json2csv";
import { Role } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");
    const priorityFilter = searchParams.get("priority");

    const url = new URL(req.url);
    const myLeads = url.searchParams.get("myLeads") === "true";

    // Build the WHERE clause
    const where: any = {};

    // Handle myLeads parameter
    if (myLeads) {
      where.ownerId = session.user.id;
    } else if (session.user.role === "SALES") {
      where.ownerId = session.user.id;
    }

    // Build the WHERE clause based on user role and filters
    const whereClause: any = {};
    const searchTerm = searchParams.get("search");

    // Add search to WHERE clause if provided
    if (searchTerm) {
      whereClause.OR = [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { email: { contains: searchTerm, mode: "insensitive" } },
        { phone: { contains: searchTerm } },
      ];
    }
    // Sales users can only export their own leads
    if (session.user.role === Role.SALES) {
      whereClause.ownerId = session.user.id;
    }

    // Apply status filter if provided
    if (statusFilter && statusFilter !== "all") {
      whereClause.status = statusFilter;
    }

    // Apply priority filter if provided
    if (priorityFilter && priorityFilter !== "all") {
      whereClause.priority = priorityFilter;
    }

    // Fetch leads with related data
    const leads = await prisma.lead.findMany({
      where: whereClause,
      include: {
        owner: { select: { name: true } },
        stage: { select: { name: true } },
        status: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Format data for CSV export
    const csvData = leads.map((lead) => ({
      "Partner Name": lead.name,
      Email: lead.email,
      Phone: lead.phone || "",
      Address: lead.address || "",
      Service: lead.service || "",
      Source: lead.source || "",
      Priority: lead.priority,
      Status: lead.status,
      "Next Follow-up": lead.nextFollowUp
        ? new Date(lead.nextFollowUp).toLocaleDateString()
        : "",
      "Assigned To": lead.owner?.name || "",
      Stage: lead.stage?.name || "",
      "Created Date": new Date(lead.createdAt).toLocaleDateString(),
      Notes: lead.notes || "",
    }));

    // Convert to CSV
    const parser = new Parser();
    const csv = parser.parse(csvData);

    // Return as file download
    const filename = `leads-export-${
      new Date().toISOString().split("T")[0]
    }.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
