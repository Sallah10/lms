"use client";
import { ThemeProvider } from 'next-themes';
import { SessionProvider } from "next-auth/react";
import { ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="light">
          <QueryClientProvider client={queryClient}>
              {children}
              <Toaster richColors position="top-right" />
          </QueryClientProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
