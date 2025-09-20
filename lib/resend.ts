// lib/resend.ts - CREATE THIS NEW FILE
import { Resend } from "resend";

// Initialize Resend with your API key
export const resend = new Resend(process.env.RESEND_API_KEY);

// Optional: Test function to verify setup
export async function testResend() {
  try {
    // data -> to be used under with error to console.log data
    const { error } = await resend.emails.send({
      from: "LMS System <system@yourdomain.com>",
      to: "your-email@example.com",
      subject: "Resend Setup Test",
      html: "<p>Resend is working correctly!</p>",
    });

    if (error) {
      console.error("Resend test failed:", error);
      return false;
    }

    // console.log("Resend test successful:", data);
    return true;
  } catch (error) {
    console.error("Resend test error:", error);
    return false;
  }
}
