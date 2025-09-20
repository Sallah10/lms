// lib/activityLog.ts
import { prisma } from "@/lib/prisma";

export async function createActivityLog({
  action,
  details,
  oldValue,
  newValue,
  leadId,
  userId,
}: {
  action: string;
  details?: string;
  oldValue?: string;
  newValue?: string;
  leadId?: string;
  userId: string;
}) {
  return prisma.activityLog.create({
    data: {
      action,
      details: details || null,
      oldValue: oldValue || null,
      newValue: newValue || null,
      leadId: leadId || null,
      userId,
    },
  });
}

// Specific log functions for common actions
export const leadActivityLogs = {
  created: (leadId: string, leadName: string, userId: string) =>
    createActivityLog({
      action: "LEAD_CREATED",
      details: `Lead "${leadName}" created`,
      leadId,
      userId,
    }),

  statusChange: (
    leadId: string,
    leadName: string,
    oldStatus: string,
    newStatus: string,
    userId: string,
    notes?: string
  ) =>
    createActivityLog({
      action: "LEAD_STATUS_CHANGE",
      details: notes
        ? `Status changed: ${notes}`
        : `Status changed for "${leadName}"`,
      oldValue: oldStatus,
      newValue: newStatus,
      leadId,
      userId,
    }),

  updated: (leadId: string, leadName: string, userId: string, field: string) =>
    createActivityLog({
      action: "LEAD_UPDATED",
      details: `Updated ${field} for "${leadName}"`,
      leadId,
      userId,
    }),

  deleted: (leadId: string, leadName: string, userId: string) =>
    createActivityLog({
      action: "LEAD_DELETED",
      details: `Lead "${leadName}" deleted`,
      leadId,
      userId,
    }),
};

// lib/activityLog.ts - ADD THESE NEW FUNCTIONS
export const salesActivityLogs = {
  leadCreated: (leadId: string, leadName: string, userId: string) =>
    createActivityLog({
      action: "SALES_LEAD_CREATED",
      details: `New lead "${leadName}" submitted`,
      leadId,
      userId,
    }),

  leadUpdated: (
    leadId: string,
    leadName: string,
    userId: string,
    field: string
  ) =>
    createActivityLog({
      action: "SALES_LEAD_UPDATED",
      details: `Updated ${field} for "${leadName}"`,
      leadId,
      userId,
    }),

  bulkImport: (userId: string, count: number, fileName: string) =>
    createActivityLog({
      action: "SALES_BULK_IMPORT",
      details: `Imported ${count} leads from ${fileName}`,
      userId,
    }),
};

export const pdmActivityLogs = {
  leadApproved: (leadId: string, leadName: string, userId: string) =>
    createActivityLog({
      action: "PDM_LEAD_APPROVED",
      details: `Approved lead "${leadName}"`,
      leadId,
      userId,
    }),

  leadRejected: (
    leadId: string,
    leadName: string,
    userId: string,
    reason: string
  ) =>
    createActivityLog({
      action: "PDM_LEAD_REJECTED",
      details: `Rejected lead "${leadName}": ${reason}`,
      leadId,
      userId,
    }),
};

export const customerCareActivityLogs = {
  leadVerified: (leadId: string, leadName: string, userId: string) =>
    createActivityLog({
      action: "CARE_LEAD_VERIFIED",
      details: `Verified lead "${leadName}"`,
      leadId,
      userId,
    }),

  leadInvalidated: (
    leadId: string,
    leadName: string,
    userId: string,
    reason: string
  ) =>
    createActivityLog({
      action: "CARE_LEAD_INVALIDATED",
      details: `Marked lead "${leadName}" as invalid: ${reason}`,
      leadId,
      userId,
    }),
};

export const adminActivityLogs = {
  userCreated: (adminId: string, userName: string, targetUserEmail: string) =>
    createActivityLog({
      action: "ADMIN_USER_CREATED",
      details: `Created user ${userName} (${targetUserEmail})`,
      userId: adminId,
    }),

  userDeactivated: (
    adminId: string,
    userName: string,
    targetUserEmail: string
  ) =>
    createActivityLog({
      action: "ADMIN_USER_DEACTIVATED",
      details: `Deactivated user ${userName} (${targetUserEmail})`,
      userId: adminId,
    }),

  systemAction: (adminId: string, action: string, details: string) =>
    createActivityLog({
      action: `ADMIN_${action}`,
      details,
      userId: adminId,
    }),
};
