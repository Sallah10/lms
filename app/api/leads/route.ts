// // app/api/leads/route.ts
// import { NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma';
// import { getServerSession } from '@/lib/server-session';
// import { v4 as uuidv4 } from 'uuid';

// export async function GET(req: Request) {
//   // support query params ?status=...&page=1&limit=20
//   const url = new URL(req.url);
//   const status = url.searchParams.get('status') ?? undefined;
//   const page = Number(url.searchParams.get('page') ?? '1');
//   const limit = Number(url.searchParams.get('limit') ?? '20');
//   const skip = (page - 1) * limit;

//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   const where: any = {};
//   if (status) where.status = status;

//   const [leads, total] = await Promise.all([
//     prisma.lead.findMany({
//       where,
//       include: { createdBy: { select: { id: true, name: true, email: true } }, assignee: { select: { id: true, name: true } } },
//       orderBy: { updatedAt: 'desc' },
//       skip,
//       take: limit,
//     }),
//     prisma.lead.count({ where }),
//   ]);

//   return NextResponse.json({ leads, total, page, limit });
// }

// export async function POST(req: Request) {
//   try {
//     const session = await getServerSession();
//     const user = session?.user;
//     if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

//     const body = await req.json();
//     const { name, email, phone, address, category, customFields } = body;
//     if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

//     // generate code (simple, change to your pattern)
//     const code = `LD-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${uuidv4().slice(0,6)}`;

//     const lead = await prisma.lead.create({
//       data: {
//         code,
//         name,
//         email,
//         phone,
//         address,
//         category,
//         customFields,
//         createdById: user.id,
//         status: 'NEW',
//       },
//     });

//     await prisma.changeLog.create({
//       data: {
//         leadId: lead.id,
//         field: 'status',
//         oldValue: null,
//         newValue: 'NEW',
//         authorId: user.id,
//       },
//     });

//     return NextResponse.json({ ok: true, lead });
//   } catch (err) {
//     console.error(err);
//     return NextResponse.json({ error: 'server error' }, { status: 500 });
//   }
// }
// app/api/leads/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q") || undefined;
    const status = url.searchParams.get("status") || undefined;
    const priority = url.searchParams.get("priority") || undefined;
    const limit = Math.min(Number(url.searchParams.get("limit") || "50"), 1000);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
      ];
    }
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        owner: { select: { id: true, name: true } },
        stage: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ leads });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}
