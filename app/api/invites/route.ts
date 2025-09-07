import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { getServerSession } from '@/lib/server-session';

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    const caller = session?.user;

    if (!caller) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    if (caller.role !== 'ADMIN' && caller.role !== 'PDM') {
      // only ADMIN or PDM (if you want) can invite — adjust to policy
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { email } = body;
    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

    const invite = await prisma.inviteToken.create({
      data: {
        email,
        token,
        expiresAt,
        createdBy: caller.id,
      },
    });

    // TODO: send email via SendGrid with link: /auth/register?token=...
    return NextResponse.json({ ok: true, token: invite.token });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
