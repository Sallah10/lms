import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
const session = await getServerSession(req, res, authOptions as any);
if (!session || (session.user as any).role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });


if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });


const { email, role, expiresInDays } = req.body;
if (!email) return res.status(400).json({ error: 'Missing email' });


const token = randomUUID();
const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // default 7 days


const invite = await prisma.invite.create({
data: {
email,
token,
role: role ?? 'USER',
invitedById: session.user.id as string,
expiresAt,
},
});


// Build invite link (use NEXT_PUBLIC_BASE_URL or fallback to relative) - recommend setting NEXT_PUBLIC_BASE_URL
const base = process.env.NEXT_PUBLIC_BASE_URL ?? `${req.headers.host}`;
const link = `${base.replace(/\/$/, '')}/signup?token=${invite.token}`;


return res.status(201).json({ ok: true, invite: { id: invite.id, email: invite.email, link } });
}