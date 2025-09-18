// app/api/users/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== Role.ADMIN) {
      return new NextResponse("Forbidden: Admins only", { status: 403 });
    }

    const body = await req.json();
    const { userId, isActive } = body;

    if (!userId || typeof isActive !== "boolean") {
      return new NextResponse("User ID and isActive are required", { status: 400 });
    }

    // Prevent self-deactivation
    if (userId === session.user.id && !isActive) {
      return new NextResponse("Cannot deactivate your own account", { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("User update error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}


export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Middleware should catch this, but this is a final backup
    if (!session || session.user.role !== Role.ADMIN) {
      return new NextResponse("Forbidden: Admins only", { status: 403 });
    }

    const users = await prisma.user.findMany({
       where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: { leads: true }, // Count the leads for each user
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Format the data to include leadCount
    const usersWithLeadCount = users.map((user) => ({
      ...user,
      leadCount: user._count.leads,
    }));

    return NextResponse.json(usersWithLeadCount);
  } catch (error) {
    console.error("Users API Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== Role.ADMIN) {
      return new NextResponse("Forbidden: Admins only", { status: 403 });
    }

    const body = await req.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password || !role) {
      return new NextResponse("All fields are required", { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return new NextResponse("User already exists", { status: 409 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role as Role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("User Creation Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
