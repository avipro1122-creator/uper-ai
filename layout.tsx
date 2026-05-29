/**
 * UperAI · Root Layout
 * app/layout.tsx
 */

import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "UperAI — Pro Investor Terminal",
  description:
    "AI-powered stock fundamentals for Indian retail investors. Find the signal in the noise.",
  metadataBase: new URL("https://uperai.in"),
  openGraph: {
    title: "UperAI — Pro Investor Terminal",
    description: "AI-powered stock analysis for Indian markets. No jargon.",
    url: "https://uperai.in",
    siteName: "UperAI",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "UperAI — Pro Investor Terminal",
    description: "AI-powered stock analysis for Indian markets.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
