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
    const includeService = url.searchParams.get("includeService") === "true";

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

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Only allow ADMIN, PDM, CUSTOMER_CARE to export
    const allowedRoles = ["ADMIN", "PDM", "CUSTOMER_CARE"] as const;
    if (
      !allowedRoles.includes(
        session.user.role as "ADMIN" | "PDM" | "CUSTOMER_CARE"
      )
    ) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { leadIds, format = "csv" } = await req.json();

    if (!leadIds || !Array.isArray(leadIds)) {
      return new NextResponse("Lead IDs are required", { status: 400 });
    }

    // Get selected leads with related data
    const leads = await prisma.lead.findMany({
      where: {
        id: { in: leadIds },
        isDeleted: false,
      },
      include: {
        owner: { select: { name: true, email: true } },
        status: { select: { name: true } },
        stage: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    if (leads.length === 0) {
      return new NextResponse("No leads found", { status: 404 });
    }

    // Convert to CSV
    const csvHeaders =
      "Name,Email,Phone,Service,Source,Priority,Status,Stage,Owner,Created At,Address,Assets,Notes\n";

    const csvRows = leads
      .map((lead) => {
        const escapeCsv = (str: string | null | undefined) => {
          if (!str) return "";
          return `"${str.replace(/"/g, '""')}"`;
        };

        return [
          escapeCsv(lead.name),
          escapeCsv(lead.email),
          escapeCsv(lead.phone),
          escapeCsv(lead.service),
          escapeCsv(lead.source),
          escapeCsv(lead.priority),
          escapeCsv(lead.status?.name),
          escapeCsv(lead.stage?.name),
          escapeCsv(lead.owner?.name),
          lead.createdAt.toISOString(),
          escapeCsv(lead.address),
          escapeCsv(lead.assets),
          escapeCsv(lead.notes),
        ].join(",");
      })
      .join("\n");

    const csvData = csvHeaders + csvRows;

    // Create filename with timestamp
    const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const filename = `leads_export_${timestamp}.csv`;

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
