import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gray-100"
      suppressHydrationWarning
    >
      <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-lg">
        {children}
      </div>
    </div>
  );
}
