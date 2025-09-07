// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

declare global {
  // Avoid multiple instances in dev
   
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    log: ['query', 'error'],
  });

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export default prisma;
