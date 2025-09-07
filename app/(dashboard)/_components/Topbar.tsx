/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export default function Topbar({ user }: { user: any }) {
  return (
    <header className="flex items-center justify-between border-b bg-white p-4">
      <h1 className="text-lg font-semibold">Welcome, {user?.name}</h1>
      <Button
        variant="outline"
        onClick={() => signOut({ callbackUrl: '/login' })}
      >
        Sign Out
      </Button>
    </header>
  );
}
