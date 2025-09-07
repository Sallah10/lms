import { DefaultSession, DefaultJWT } from "next-auth";
import { Role } from "@prisma/client";

// A helpful tip is to create a User type that contains the data we'll need in the session.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      name?: string | null;
      email?: string | null;
    } & DefaultSession["user"];
  }

  interface JWT extends DefaultJWT {
    id: string;
    role: Role;
  }
}