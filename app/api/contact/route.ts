// app/api/contact/route.ts
import { NextResponse } from "next/server";
import { resend } from "@/lib/resend";
import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";
import { authOptions as aOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(aOptions);
    const body = await req.json();
    const { name, email, subject, message } = body;

    // Basic validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    // Send email to support team data,
    const { error } = await resend.emails.send({
      from: "LMS Contact Form <muhammedbello030@gmail.com>",
      to: process.env.SUPPORT_EMAIL || "muhammedbello030@gmail.com",
      replyTo: email,
      subject: `Contact Form: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2>New Contact Form Submission</h2>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
            <p><strong>From:</strong> ${name} (${email})</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <div style="background-color: white; padding: 15px; border-radius: 4px; border-left: 4px solid #007bff;">
              ${message.replace(/\n/g, "<br>")}
            </div>
          </div>
          <p style="color: #6c757d; font-size: 14px; margin-top: 20px;">
            Sent from LMS Contact Form • ${new Date().toLocaleString()}
            ${session ? `<br>User: ${session.user.email} (${session.user.role})` : ""}
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Email sending failed:", error);
      return NextResponse.json(
        { error: "Failed to send message. Please try again." },
        { status: 500 }
      );
    }

    // Send confirmation email to user
    await resend.emails.send({
      from: "Support Team <support@yourdomain.com>",
      to: email,
      subject: "We received your message!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2>Thank you for contacting us!</h2>
          <p>Hello ${name},</p>
          <p>We've received your message and our team will get back to you within 24 hours.</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Your message:</strong></p>
            <p>${message}</p>
          </div>
          <p>If you have urgent inquiries, please call our support line.</p>
          <p>Best regards,<br>Support Team</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: "Message sent successfully!",
    });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again later." },
      { status: 500 }
    );
  }
}
