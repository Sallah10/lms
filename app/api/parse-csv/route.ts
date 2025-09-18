import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parse } from "csv-parse/sync";
import { Role } from "@prisma/client";

interface CsvRecord {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  service?: string;
  source?: string;
  notes?: string;
  priority?: string;
  nextFollowUp?: string;
}

interface ValidLead {
  name: string;
  email: string;
  phone: string;
  address: string;
  service: string;
  source: string;
  notes: string;
  priority: string;
  nextFollowUp?: string;
  salesRepId: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const salesRepId = session.user.id;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check file type
    if (!file.name.toLowerCase().endsWith(".csv")) {
      return NextResponse.json(
        { error: "Only CSV files are supported" },
        { status: 400 }
      );
    }

    // Read and parse the CSV file
    const fileBuffer = await file.arrayBuffer();
    const fileContent = Buffer.from(fileBuffer).toString("utf-8");

    let records: CsvRecord[];
    try {
      records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_quotes: true,
        relax_column_count: true,
      });
    } catch (parseError) {
      console.error("CSV parse error:", parseError);
      return NextResponse.json(
        { error: "Invalid CSV format. Please check your file structure." },
        { status: 400 }
      );
    }

    // Validate records
    if (!records || records.length === 0) {
      return NextResponse.json(
        { error: "CSV file is empty or contains no data" },
        { status: 400 }
      );
    }

    // Validate required fields in each record
    const validLeads: ValidLead[] = [];
    const errors: string[] = [];
    const duplicates: Array<{
      email: string;
      name: string;
      existingOwner: string;
    }> = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNumber = i + 2; // +2 because of header row and 0-based index

      // Check required fields
      if (!record.name) {
        errors.push(`Row ${rowNumber}: Missing required field 'name'`);
        continue;
      }

      if (!record.email) {
        errors.push(`Row ${rowNumber}: Missing required field 'email'`);
        continue;
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(record.email)) {
        errors.push(`Row ${rowNumber}: Invalid email format '${record.email}'`);
        continue;
      }

      // Check for duplicates
      const existingLead = await prisma.lead.findFirst({
        where: { email: record.email },
        include: { owner: { select: { name: true } } },
      });

      if (existingLead) {
        duplicates.push({
          email: record.email,
          name: existingLead.name,
          existingOwner: existingLead.owner?.name || "Unassigned",
        });
        // Continue processing but we'll report the duplicate
      }

      validLeads.push({
        name: record.name,
        email: record.email,
        phone: record.phone || "",
        address: record.address || "",
        service: record.service || "",
        source: record.source || "CSV Import",
        notes: record.notes || "",
        priority: record.priority || "MEDIUM",
        nextFollowUp: record.nextFollowUp,
        salesRepId: salesRepId,
      });
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Found ${errors.length} validation error(s)`,
          details: errors,
          validCount: validLeads.length,
          totalCount: records.length,
          duplicatesCount: duplicates.length,
          duplicates: duplicates.slice(0, 10),
        },
        { status: 400 }
      );
    }

    // Import leads in bulk
    let importedCount = 0;
    const importErrors: string[] = [];

    // Find default stages/statuses
    const [newStage, newStatus] = await Promise.all([
      prisma.leadStage.findFirst({ where: { name: "NEW" } }),
      prisma.leadStatusModel.findFirst({ where: { name: "NEW" } }),
    ]);

    if (!newStage || !newStatus) {
      return NextResponse.json(
        { error: "Default lead stage or status not configured" },
        { status: 500 }
      );
    }

    for (const leadData of validLeads) {
      try {
        await prisma.lead.create({
          data: {
            name: leadData.name,
            email: leadData.email,
            phone: leadData.phone,
            address: leadData.address,
            service: leadData.service,
            source: leadData.source,
            notes: leadData.notes,
            priority: leadData.priority as "HIGH" | "MEDIUM" | "LOW",
            nextFollowUp: leadData.nextFollowUp
              ? new Date(leadData.nextFollowUp)
              : null,
            ownerId: salesRepId,
            stageId: newStage.id,
            statusId: newStatus.id,
          },
        });
        importedCount++;
      } catch (error) {
        console.error(`Error importing lead ${leadData.email}:`, error);
        importErrors.push(
          `Failed to import ${leadData.email}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    // Create activity log for bulk import
    if (importedCount > 0) {
      await prisma.activityLog.create({
        data: {
          action: "BULK_LEAD_IMPORT",
          details: `Imported ${importedCount} leads from CSV file`,
          userId: salesRepId,
        },
      });
    }

    if (importErrors.length > 0) {
      return NextResponse.json({
        success: false,
        message: `Imported ${importedCount} leads with ${importErrors.length} errors`,
        importedCount,
        errorCount: importErrors.length,
        duplicatesCount: duplicates.length,
        duplicates: duplicates.slice(0, 10),
        errors: importErrors,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Leads imported successfully",
      importedCount,
      errorCount: 0,
      duplicatesCount: duplicates.length,
      duplicates: duplicates.slice(0, 10),
    });
  } catch (error) {
    console.error("Bulk upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process CSV file",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
