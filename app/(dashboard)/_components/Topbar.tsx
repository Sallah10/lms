"use client";

import { signOut } from "next-auth/react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function Topbar({ user }: { user: any }) {
  return (
    <header className="flex items-center justify-between border-b bg-white p-4">
      {" "}
      {/* Add margin for sidebar */}
      <div>
        <h1 className="text-lg font-semibold">Welcome, {user?.name}</h1>
        <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
      >
        Sign Out
      </button>
    </header>
  );
}
