/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/leads/import/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { parse } from "csv-parse/sync";

// Define the expected CSV record structure
interface CsvRecord {
  "Partner Name"?: string;
  Email?: string;
  Phone?: string;
  Address?: string;
  Service?: string;
  Source?: string;
  Priority?: string;
  Status?: string;
  Notes?: string;
  "Next Follow-up"?: string;
  // Add any other possible CSV columns here
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Only allow ADMIN and PDM to import leads
    if (
      !session ||
      (session.user.role !== Role.ADMIN && session.user.role !== Role.PDM)
    ) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new NextResponse("No file uploaded", { status: 400 });
    }

    // Read and parse the CSV file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const records: CsvRecord[] = parse(buffer.toString(), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as CsvRecord[];

    if (records.length === 0) {
      return new NextResponse("CSV file is empty", { status: 400 });
    }

    // Get default stage and status for new leads
    const [defaultStage, defaultStatus, defaultOwner] = await Promise.all([
      prisma.leadStage.findFirst({ where: { name: "NEW" } }),
      prisma.leadStatusModel.findFirst({ where: { name: "NEW" } }),
      prisma.user.findFirst({ where: { role: Role.SALES } }), // Assign to a sales user
    ]);

    if (!defaultStage || !defaultStatus || !defaultOwner) {
      return new NextResponse(
        "Default stage, status, or owner not configured",
        { status: 500 }
      );
    }

    // Process and validate each record
    const leadsToCreate = [];
    const errors = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      try {
        // Basic validation
        if (!record["Partner Name"] || !record["Email"]) {
          errors.push(
            `Row ${i + 2}: Missing required fields (Partner Name or Email)`
          );
          continue;
        }

        // Map CSV columns to database fields
        const leadData = {
          name: record["Partner Name"] || "",
          email: record["Email"] || "",
          phone: record["Phone"] || "",
          address: record["Address"] || "",
          service: record["Service"] || "",
          source: record["Source"] || "CSV Import",
          priority: (record["Priority"] || "MEDIUM").toUpperCase() as
            | "LOW"
            | "MEDIUM"
            | "HIGH",
          status: record["Status"] || "NEW",
          notes: record["Notes"] || "",
          inputedStatus: record["Status"] || "",
          nextFollowUp: record["Next Follow-up"]
            ? new Date(record["Next Follow-up"])
            : null,
          ownerId: defaultOwner.id, // Assign to default sales user
          stageId: defaultStage.id,
          statusId: defaultStatus.id,
        };

        // Validate priority value
        if (!["LOW", "MEDIUM", "HIGH"].includes(leadData.priority)) {
          leadData.priority = "MEDIUM";
        }

        leadsToCreate.push(leadData);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        errors.push(`Row ${i + 2}: Error processing record - ${errorMessage}`);
      }
    }

    // If too many errors, abort
    if (errors.length > records.length / 2) {
      return NextResponse.json(
        {
          error: "Too many errors in CSV file",
          details: errors,
        },
        { status: 400 }
      );
    }

    // Create leads in database
    const createdLeads = await prisma.$transaction(
      leadsToCreate.map((leadData) =>
        prisma.lead.create({ data: leadData as any })
      )
    );

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${createdLeads.length} leads`,
      importedCount: createdLeads.length,
      errorCount: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Import Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
