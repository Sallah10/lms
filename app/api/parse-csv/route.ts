// app/api/leads/import/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { parse } from "csv-parse/sync";

type CsvRecord = Record<string, string> & {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  service?: string;
  source?: string;
  notes?: string;
  priority?: string;
  nextFollowUp?: string;
  assets?: string;
};

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
  assets?: string;
  salesRepId: string;
}

function normalizeCsvRecord(record: Record<string, string>): CsvRecord {
  const normalized: Record<string, string> = {};
  const unknownFields: string[] = [];

  for (const [key, value] of Object.entries(record)) {
    const lowerKey = key.toLowerCase().trim();

    // Map various column names to standard fields - ORDER MATTERS!
    // Check for specific column names FIRST, then general keywords

    // NAME/COMPANY MAPPING - Check specific names first
    if (
      lowerKey === "partners name" ||
      lowerKey === "company name" ||
      lowerKey === "business name" ||
      lowerKey.includes("partner name") ||
      (lowerKey.includes("name") && !lowerKey.includes("address"))
    ) {
      normalized.name = value;
    }
    // EMAIL MAPPING
    else if (
      lowerKey === "email address" ||
      lowerKey === "email" ||
      lowerKey.includes("mail")
    ) {
      normalized.email = value;
    }
    // ADDRESS MAPPING - Be specific about address fields
    else if (
      lowerKey === "business address" ||
      lowerKey === "address" ||
      lowerKey === "physical address" ||
      (lowerKey.includes("address") && !lowerKey.includes("name"))
    ) {
      normalized.address = value;
    }
    // PHONE MAPPING
    else if (
      lowerKey === "phone number" ||
      lowerKey === "phone" ||
      lowerKey.includes("tel") ||
      lowerKey.includes("mobile") ||
      lowerKey.includes("contact")
    ) {
      normalized.phone = value;
    }
    // SERVICE MAPPING
    else if (
      lowerKey === "service type" ||
      lowerKey === "service" ||
      lowerKey.includes("product") ||
      lowerKey.includes("module") ||
      lowerKey.includes("industry") ||
      lowerKey.includes("category")
    ) {
      normalized.service = value;
    }
    // SOURCE MAPPING
    else if (
      lowerKey === "lead source" ||
      lowerKey === "source" ||
      lowerKey.includes("origin") ||
      lowerKey.includes("referral") ||
      lowerKey.includes("campaign")
    ) {
      normalized.source = value;
    }
    // NOTES MAPPING
    else if (
      lowerKey === "additional notes" ||
      lowerKey === "notes" ||
      lowerKey.includes("comment") ||
      lowerKey.includes("remark") ||
      lowerKey.includes("description")
    ) {
      normalized.notes = value;
    }
    // PRIORITY MAPPING
    else if (
      lowerKey === "priority level" ||
      lowerKey === "priority" ||
      lowerKey.includes("urgent")
    ) {
      normalized.priority = value;
    }
    // NEXT FOLLOW-UP MAPPING
    else if (
      lowerKey === "next follow-up date" ||
      lowerKey === "next follow-up" ||
      lowerKey.includes("follow") ||
      (lowerKey.includes("next") && lowerKey.includes("date"))
    ) {
      normalized.nextFollowUp = value;
    }
    // ASSETS MAPPING
    else if (
      lowerKey === "assets" ||
      lowerKey === "assets/equipment" ||
      lowerKey.includes("equipment") ||
      lowerKey.includes("vehicle") ||
      lowerKey.includes("fleet") ||
      lowerKey.includes("inventory")
    ) {
      normalized.assets = value;
    } else {
      // For unknown fields, collect them to add later with proper tagging
      if (value && value.trim() !== "") {
        unknownFields.push(`${key}: ${value}`);
      }
    }
  }

  // Add unknown fields to notes with proper tagging and spacing
  if (unknownFields.length > 0) {
    const unknownFieldsSection = `\n\n--- Added Information: ---\n${unknownFields.join("\n")}`;

    if (normalized.notes) {
      // If there are existing notes, append the unknown fields section
      normalized.notes += unknownFieldsSection;
    } else {
      // If no existing notes, create notes with just the unknown fields
      normalized.notes = unknownFieldsSection;
    }
  }

  return normalized as CsvRecord;
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

    console.log("Raw CSV records:", records); // DEBUG: See what's being parsed

    // Validate required fields in each record
    const validLeads: ValidLead[] = [];
    const errors: string[] = [];
    const duplicates: Array<{
      email: string;
      name: string;
      existingOwner: string;
    }> = [];

    for (let i = 0; i < records.length; i++) {
      const rawRecord = records[i];
      const rowNumber = i + 2; // +2 because of header row and 0-based index

      console.log(`Row ${rowNumber} raw:`, rawRecord); // DEBUG: See raw record

      const record = normalizeCsvRecord(rawRecord);

      console.log(`Row ${rowNumber} normalized:`, record); // DEBUG: See normalized record

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
      }

      validLeads.push({
        name: record.name || "",
        email: record.email || "",
        phone: record.phone || "",
        address: record.address || "",
        service: record.service || "",
        source: record.source || "CSV Import",
        notes: record.notes || "",
        priority: record.priority || "MEDIUM",
        nextFollowUp: record.nextFollowUp,
        assets: record.assets || "",
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
        console.log("Creating lead with data:", leadData); // DEBUG: See final data
        const createdLead = await prisma.lead.create({
          data: {
            name: leadData.name,
            email: leadData.email,
            phone: leadData.phone,
            address: leadData.address,
            service: leadData.service,
            source: leadData.source,
            notes: leadData.notes,
            assets: leadData.assets,
            priority: leadData.priority as "HIGH" | "MEDIUM" | "LOW",
            nextFollowUp: leadData.nextFollowUp
              ? new Date(leadData.nextFollowUp)
              : null,
            ownerId: salesRepId,
            stageId: newStage.id,
            statusId: newStatus.id,
          },
        });
        await prisma.activityLog.create({
          data: {
            action: "LEAD_CREATED",
            details: `Lead created via CSV import`,
            userId: salesRepId,
            leadId: createdLead.id, // THIS IS CRUCIAL!
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
