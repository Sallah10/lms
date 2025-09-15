import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs"; // Make sure you have bcryptjs installed

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Create Users
  const adminPassword = await bcrypt.hash("Admin123!", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@example.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  const salesRep1 = await prisma.user.upsert({
    where: { email: "sales1@example.com" },
    update: {},
    create: {
      name: "Sales Rep 1",
      email: "sales1@example.com",
      password: await bcrypt.hash("password123", 10),
      role: "SALES",
    },
  });

  const salesRep2 = await prisma.user.upsert({
    where: { email: "sales2@example.com" },
    update: {},
    create: {
      name: "Sales Rep 2",
      email: "sales2@example.com",
      password: await bcrypt.hash("password123", 10),
      role: "SALES",
    },
  });

  // 2. Create Lead Stages & Statuses
  const stages = [
    "NEW",
    "CONTACTED",
    "QUALIFIED",
    "REVIEWED",
    "VALIDATED",
    "CLOSED",
  ];
  const statuses = [
    "NEW",
    "REVIEWED",
    "VERIFIED",
    "INVALID",
    "REJECTED",
    "PROPOSAL_SENT",
    "PROPOSAL_CONFIRMED",
    "AGREED",
    "NOT_INTERESTED",
    "CONVERTED",
  ];

  // Use Promise.all for parallel creation for better performance
  await Promise.all([
    ...stages.map((name) =>
      prisma.leadStage.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    ),
    ...statuses.map((name) =>
      prisma.leadStatusModel.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    ),
  ]);

  // 3. Fetch the IDs we need for relationships
  const leadStageNew = await prisma.leadStage.findFirstOrThrow({
    where: { name: "NEW" },
  });
  const leadStatusNew = await prisma.leadStatusModel.findFirstOrThrow({
    where: { name: "NEW" },
  });
  const leadStatusProposal = await prisma.leadStatusModel.findFirstOrThrow({
    where: { name: "PROPOSAL_SENT" },
  });

  // 4. Create Sample Leads
  await prisma.lead.createMany({
    data: [
      {
        name: "John Doe",
        email: "john@example.com",
        phone: "1234567890",
        statusId: leadStatusNew.id,
        ownerId: salesRep1.id, // Assign to a sales rep, not admin
        stageId: leadStageNew.id,
        source: "Website",
        notes: "Interested in premium package",
        priority: "HIGH",
      },
      {
        name: "Jane Smith",
        email: "jane@example.com",
        phone: "0987654321",
        statusId: leadStatusProposal.id,
        ownerId: salesRep2.id, // Assign to a sales rep, not admin
        stageId: leadStageNew.id,
        source: "Referral",
        notes: "Follow up next week",
        priority: "MEDIUM",
      },
      {
        name: "Acme Corp",
        email: "contact@acme.com",
        phone: "5551234567",
        statusId: leadStatusNew.id,
        ownerId: salesRep1.id,
        stageId: leadStageNew.id,
        source: "Cold Call",
        notes: "Large potential deal",
        priority: "LOW",
      },
    ],
    skipDuplicates: true,
  });

  // 5. Create a sample invite
  await prisma.invite.upsert({
    where: { token: "sample-invite-token-123" },
    update: {},
    create: {
      email: "newuser@example.com",
      token: "sample-invite-token-123",
      status: "PENDING",
      invitedById: admin.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
  });

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
