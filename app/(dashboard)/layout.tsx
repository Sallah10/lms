import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "./_components/Sidebar";
import Topbar from "./_components/Topbar";
import { ReactQueryProvider } from "@/providers/ReactQueryProvider";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navigation Bar */}
        <Topbar user={session.user} />

        {/* Page Content */}
        <main className="flex-1 p-6  overflow-y-auto">
          <ReactQueryProvider>{children}</ReactQueryProvider>
        </main>
      </div>
    </div>
  );
}
