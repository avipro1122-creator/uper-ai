/**
 * UperAI · Middleware
 * middleware.ts  (root of project, next to package.json)
 *
 * Protects routes behind Google login.
 * Public routes: / (homepage search), /login, /api/auth/*
 * Protected routes: /dashboard, /portfolio, /screener
 */

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Optional: add role-based logic here
    return NextResponse.next();
  },
  {
    callbacks: {
      // Return true = allow access, false = redirect to /login
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Always allow public routes
        const publicPaths = ["/", "/login", "/api/auth"];
        if (publicPaths.some((p) => pathname.startsWith(p))) {
          return true;
        }

        // Everything else requires a session
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

// Only run middleware on these paths
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg).*)",
  ],
};
