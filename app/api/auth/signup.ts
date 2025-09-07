// pages/api/auth/signup.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });


const { token, password, name } = req.body;
if (!token || !password) return res.status(400).json({ error: 'Missing token or password' });


const invite = await prisma.invite.findUnique({ where: { token } });
if (!invite) return res.status(400).json({ error: 'Invalid invite token' });
if (invite.status !== 'PENDING') return res.status(400).json({ error: 'Invite already used or invalid' });
if (invite.expiresAt && invite.expiresAt < new Date()) return res.status(400).json({ error: 'Invite expired' });


// Prevent creating duplicate users
const existing = await prisma.user.findUnique({ where: { email: invite.email } });
if (existing) return res.status(400).json({ error: 'User already exists' });


const hashed = await bcrypt.hash(password, 10);


const user = await prisma.user.create({
data: {
email: invite.email,
name: name ?? invite.email.split('@')[0],
password: hashed,
role: invite.role,
},
});


await prisma.invite.update({ where: { token }, data: { status: 'ACCEPTED' } });


return res.status(201).json({ ok: true, user: { id: user.id, email: user.email, role: user.role } });
}