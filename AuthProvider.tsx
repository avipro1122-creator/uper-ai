/**
 * UperAI · Auth Provider
 * components/AuthProvider.tsx
 *
 * Wraps the app in NextAuth SessionProvider.
 * Required for useSession() to work in client components.
 */

"use client";

import { SessionProvider } from "next-auth/react";
import { Session } from "next-auth";

interface AuthProviderProps {
  children: React.ReactNode;
  session?: Session | null;
}

export default function AuthProvider({ children, session }: AuthProviderProps) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
