// /* eslint-disable @typescript-eslint/no-explicit-any */
// // app/api/leads/[id]/route.ts
// import { NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma';
// import { getServerSession } from '@/lib/server-session';

// export async function GET(req: Request, { params }: { params: { id: string } }) {
//   const { id } = params;
//   const lead = await prisma.lead.findUnique({
//     where: { id },
//     include: { changeLogs: { orderBy: { createdAt: 'desc' }, include: { author: { select: { id: true, name: true } } } ,}, createdBy: true, assignee: true },
//   });
//   if (!lead) return NextResponse.json({ error: 'not found' }, { status: 404 });
//   return NextResponse.json({ lead });
// }

// export async function PATCH(req: Request, { params }: { params: { id: string } }) {
//   const session = await getServerSession();
//   const user = session?.user;
//   if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

//   const { id } = params;
//   const body = await req.json();

//   const lead = await prisma.lead.findUnique({ where: { id } });
//   if (!lead) return NextResponse.json({ error: 'not found' }, { status: 404 });

//   // business rule: only allow editing when status is NEW or PDM can edit until they verify
//   if (lead.status !== 'NEW' && user.role !== 'ADMIN' && user.role !== 'PDM') {
//     // only Admin or PDM can edit non-NEW leads
//     return NextResponse.json({ error: 'editing not allowed at this stage' }, { status: 403 });
//   }

//   // you may want to restrict Sales to only editing their own leads
//   if (user.role === 'SALES' && lead.createdById !== user.id) {
//     return NextResponse.json({ error: 'cannot edit others leads' }, { status: 403 });
//   }

//   // allowed fields to update
//   const updatable: any = {};
//   const fields = ['name', 'email', 'phone', 'address', 'category', 'customFields', 'assigneeId'];
//   for (const f of fields) {
//     if (body[f] !== undefined) updatable[f] = body[f];
//   }

//   const updated = await prisma.lead.update({
//     where: { id },
//     data: updatable,
//   });

//   // create change logs for significant fields (simplified)
//   for (const f of Object.keys(updatable)) {
//     await prisma.changeLog.create({
//       data: {
//         leadId: id,
//         field: f,
//         oldValue: (lead as any)[f] ? String((lead as any)[f]) : null,
//         newValue: updatable[f] ? String(updatable[f]) : null,
//         authorId: user.id,
//       },
//     });
//   }

//   return NextResponse.json({ ok: true, lead: updated });
// }

// export async function DELETE(req: Request, { params }: { params: { id: string } }) {
//   const session = await getServerSession();
//   const user = session?.user;
//   if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

//   // only ADMIN can delete (policy)
//   if (user.role !== 'ADMIN') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

//   const { id } = params;
//   await prisma.lead.delete({ where: { id } });
//   return NextResponse.json({ ok: true });
// }
// app/api/leads/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        stage: { select: { id: true, name: true } },
      },
    });
    if (!lead)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ lead });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch lead" },
      { status: 500 }
    );
  }
}
