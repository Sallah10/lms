// app/api/user/password/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return new NextResponse("Current and new password are required", {
        status: 400,
      });
    }

    if (newPassword.length < 6) {
      return new NextResponse("Password must be at least 6 characters", {
        status: 400,
      });
    }

    // Get user with password hash
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      return new NextResponse("Current password is incorrect", { status: 400 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    return new NextResponse("Password updated successfully", { status: 200 });
  } catch (error) {
    console.error("Password update error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
