// app/api/auth/debug/route.ts
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  return Response.json({
    session: session
      ? {
          user: {
            id: session.user.id,
            email: session.user.email,
            role: session.user.role,
          },
          expires: session.expires,
        }
      : null,
    authOptions: {
      hasCredentials: true,
      hasGoogle: authOptions.providers.some((p) => p.id === "google"),
    },
    env: {
      nextauthUrl: process.env.NEXTAUTH_URL,
      nextauthSecret: process.env.NEXTAUTH_SECRET ? "Set" : "Missing",
      nodeEnv: process.env.NODE_ENV,
    },
  });
}
