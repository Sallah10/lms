// lib/email.ts - UPDATE FOR MULTIPLE RECIPIENTS
import { resend } from "./resend";

export async function sendDeletionNotificationEmail(
  leadName: string,
  leadEmail: string,
  deleterName: string,
  deleterEmail: string,
  reason: string,
  assignedTo: string
): Promise<boolean> {
  try {
    // Get multiple recipients from environment variable
    const recipientEmails = process.env.DELETION_NOTIFICATION_EMAILS?.split(
      ","
    ) || [process.env.CTO_EMAIL || "cto@yourcompany.com"];

    // Remove any empty strings and trim whitespace
    const cleanRecipients = recipientEmails
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

    if (cleanRecipients.length === 0) {
      console.warn("No email recipients configured for deletion notifications");
      return false;
    }

    const { error } = await resend.emails.send({
      //   from: "LMS System <system@yourdomain.com>",
      from: "LMS System <onboarding@resend.dev>",
      to: cleanRecipients, // ✅ NOW SENDS TO MULTIPLE RECIPIENTS
      subject: `🚨 Lead Deleted: ${leadName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">
            🚨 Lead Deletion Alert
          </h2>
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626; margin: 20px 0;">
            <h3 style="color: #dc2626; margin-top: 0;">Deleted Lead Details</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #fecaca; font-weight: bold; width: 120px;">Lead Name:</td>
                <td style="padding: 8px; border-bottom: 1px solid #fecaca;">${leadName}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #fecaca; font-weight: bold;">Lead Email:</td>
                <td style="padding: 8px; border-bottom: 1px solid #fecaca;">${leadEmail}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #fecaca; font-weight: bold;">Assigned To:</td>
                <td style="padding: 8px; border-bottom: 1px solid #fecaca;">${assignedTo}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #fecaca; font-weight: bold;">Deleted By:</td>
                <td style="padding: 8px; border-bottom: 1px solid #fecaca;">${deleterName} (${deleterEmail})</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #fecaca; font-weight: bold;">Deletion Time:</td>
                <td style="padding: 8px; border-bottom: 1px solid #fecaca;">${new Date().toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; vertical-align: top;">Reason:</td>
                <td style="padding: 8px;">${reason}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; border-left: 4px solid #0369a1; margin: 20px 0;">
            <h4 style="color: #0369a1; margin-top: 0;">📋 Action Items</h4>
            <ul style="margin: 0; padding-left: 20px;">
              <li>This lead has been soft deleted and can be restored from archives</li>
              <li>Review the deletion reason for compliance</li>
              <li>Contact ${deleterName} if additional context is needed</li>
            </ul>
          </div>

          <p style="color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 20px;">
            This is an automated notification from your Lead Management System. 
            Please do not reply to this email.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Deletion email error:", error);
      return false;
    }

    // console.log(`Deletion notification sent to: ${cleanRecipients.join(", ")}`);
    return true;
  } catch (error) {
    console.error("Email sending failed:", error);
    return false;
  }
}
