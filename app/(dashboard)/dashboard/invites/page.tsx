/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useQuery } from '@tanstack/react-query';

async function fetchInvites() {
  const res = await fetch('/api/invites');
  if (!res.ok) throw new Error('Failed to fetch invites');
  return res.json();
}

export default function InvitesPage() {
  const { data, isLoading } = useQuery({ queryKey: ['invites'], queryFn: fetchInvites });

  if (isLoading) return <p>Loading invites...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Invites</h1>
      <ul className="space-y-2">
        {data?.map((invite: any) => (
          <li key={invite.id} className="border p-3 rounded">
            <p>{invite.email}</p>
            <span className="text-xs bg-gray-200 px-2 py-1 rounded">
              {invite.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
