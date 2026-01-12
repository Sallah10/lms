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
  ownerId: string;
  stageId: string;
  statusId: string;
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
    const unknownFieldsSection = `\n\n--- UNKNOWN FIELDS ---\n${unknownFields.join("\n")}`;

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

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new NextResponse("No file uploaded", { status: 400 });
    }

    // Read and parse the CSV file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let records: Record<string, string>[];
    try {
      records = parse(buffer.toString(), {
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

    if (records.length === 0) {
      return new NextResponse("CSV file is empty", { status: 400 });
    }

    console.log("Raw CSV records:", records);

    // Get default stage and status for new leads
    const [defaultStage, defaultStatus, defaultOwner] = await Promise.all([
      prisma.leadStage.findFirst({ where: { name: "NEW" } }),
      prisma.leadStatusModel.findFirst({ where: { name: "NEW" } }),
      prisma.user.findFirst({ where: { role: Role.SALES } }),
    ]);

    if (!defaultStage || !defaultStatus || !defaultOwner) {
      return new NextResponse(
        "Default stage, status, or owner not configured",
        { status: 500 }
      );
    }

    // Process and validate each record
    const leadsToCreate: ValidLead[] = [];
    const errors: string[] = [];

    for (let i = 0; i < records.length; i++) {
      const rawRecord = records[i];
      const rowNumber = i + 2;

      console.log(`Row ${rowNumber} raw:`, rawRecord);

      try {
        const record = normalizeCsvRecord(rawRecord);

        console.log(`Row ${rowNumber} normalized:`, record);

        // Basic validation
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
          errors.push(
            `Row ${rowNumber}: Invalid email format '${record.email}'`
          );
          continue;
        }

        // Validate priority
        const validatePriority = (
          priority?: string
        ): "LOW" | "MEDIUM" | "HIGH" => {
          const upperPriority = priority?.toUpperCase();
          if (
            upperPriority === "HIGH" ||
            upperPriority === "MEDIUM" ||
            upperPriority === "LOW"
          ) {
            return upperPriority as "LOW" | "MEDIUM" | "HIGH";
          }
          return "MEDIUM";
        };

        // Parse date safely
        const parseDate = (dateString?: string) => {
          if (!dateString) return null;
          try {
            const date = new Date(dateString);
            return isNaN(date.getTime()) ? null : date;
          } catch {
            return null;
          }
        };

        const leadData: ValidLead = {
          name: record.name || "",
          email: record.email || "",
          phone: record.phone || "",
          address: record.address || "",
          service: record.service || "",
          source: record.source || "CSV Import",
          notes: record.notes || "",
          assets: record.assets || "",
          priority: validatePriority(record.priority),
          nextFollowUp:
            parseDate(record.nextFollowUp)?.toISOString() || undefined,
          ownerId: defaultOwner.id,
          stageId: defaultStage.id,
          statusId: defaultStatus.id,
        };

        leadsToCreate.push(leadData);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        errors.push(
          `Row ${rowNumber}: Error processing record - ${errorMessage}`
        );
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
        prisma.lead.create({
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
            ownerId: leadData.ownerId,
            stageId: leadData.stageId,
            statusId: leadData.statusId,
          },
        })
      )
    );

    // Create activity logs
    await Promise.all(
      createdLeads.map(async (lead) => {
        return prisma.activityLog.create({
          data: {
            action: "LEAD_CREATED",
            details: `Lead created via CSV import`,
            userId: session.user.id,
            leadId: lead.id,
          },
        });
      })
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
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
