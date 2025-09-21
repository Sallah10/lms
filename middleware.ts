// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Role } from "@prisma/client";

// 1. Define which routes are protected and their required roles
const roleBasedRoutes: Record<string, Role[]> = {
  "/dashboard": [Role.ADMIN, Role.SALES, Role.PDM, Role.CUSTOMER_CARE], // All authenticated users
  "/dashboard/leads": [Role.ADMIN, Role.SALES, Role.PDM, Role.CUSTOMER_CARE],
  "/dashboard/my-leads": [Role.ADMIN, Role.SALES],
  "/dashboard/review": [Role.ADMIN, Role.PDM],
  "/dashboard/verification": [Role.ADMIN, Role.CUSTOMER_CARE],
  "/dashboard/users": [Role.ADMIN], // ADMIN ONLY
  "/dashboard/analytics": [Role.ADMIN, Role.PDM],
  "/dashboard/settings": [Role.ADMIN], // ADMIN ONLY
  "/api/leads": [Role.ADMIN, Role.SALES, Role.PDM, Role.CUSTOMER_CARE], // Protect APIs too!
  "/api/users": [Role.ADMIN], // ADMIN ONLY API
};
export function middleware() {
  const response = NextResponse.next();

  // Allow requests from sales portal domain
  response.headers.set(
    "Access-Control-Allow-Origin",
    "https://lms-sales-portal.vercel.app"
  );
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  return response;
}

export default withAuth(
  function middleware(req: NextRequest) {
    // Get the token from the request using withAuth's context
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const token = (req as any).auth?.token;
    const pathname = req.nextUrl.pathname;

    if (pathname.includes("/api/auth/") || pathname === "/login") {
      return NextResponse.next();
    }

    // 2. Check if the user is trying to access a role-based route
    for (const [route, allowedRoles] of Object.entries(roleBasedRoutes)) {
      if (pathname.startsWith(route)) {
        // 3. Check if the user's role is allowed to access this route
        if (token?.role && !allowedRoles.includes(token.role as Role)) {
          // 4. If not allowed, redirect to dashboard (or an unauthorized page)
          // In the middleware, change the redirect line:
          const unauthorizedUrl = new URL("/unauthorized", req.url);
          return NextResponse.redirect(unauthorizedUrl);
        }
        break; // Stop checking once we found a matching route
      }
    }

    // 5. If all checks pass, allow the request
    return NextResponse.next();
  },
  {
    callbacks: {
      // 6. This callback controls which pages are protected by withAuth
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        if (pathname.includes("/api/auth/") || pathname === "/login") {
          return true;
        }

        // 7. Check if the current path is in our roleBasedRoutes
        const isProtectedRoute = Object.keys(roleBasedRoutes).some((route) =>
          pathname.startsWith(route)
        );

        // 8. If it's a protected route, the user must be authenticated
        if (isProtectedRoute) {
          return !!token;
        }

        // 9. If it's not a protected route, allow access (e.g., login page, public pages)
        return true;
      },
    },
  }
);

// 10. Specify which routes to protect (matching the ones in roleBasedRoutes)
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/leads/:path*",
    "/api/users/:path*",
    "/api/auth/:path*",
    "/api/dashboard/:path*",
    "/api/register/:path*",
    "/api/contact",
    // Add other API routes here as you create them
  ],
};
