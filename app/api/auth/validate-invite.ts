// pages/api/auth/validate-invite.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
const token = String(req.query.token || '');
if (!token) return res.status(400).json({ ok: false, error: 'Missing token' });


const invite = await prisma.invite.findUnique({ where: { token } });
if (!invite) return res.status(404).json({ ok: false, error: 'Invite not found' });
if (invite.status !== 'PENDING') return res.status(400).json({ ok: false, error: 'Invite used or invalid' });
if (invite.expiresAt && invite.expiresAt < new Date()) return res.status(400).json({ ok: false, error: 'Invite expired' });


return res.status(200).json({ ok: true, invite: { email: invite.email, role: invite.role } });
}