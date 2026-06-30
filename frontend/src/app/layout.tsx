import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProviders } from "@/providers/app-providers";

export const metadata: Metadata = {
  title: "Jaga",
  description: "Investigational TB triage research prototype. Does not diagnose or rule out TB.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Allow user zoom to 200% (accessibility, §5.1); do not lock scale.
  maximumScale: 5,
  themeColor: "#024F46",
};

/**
 * Root layout. Default language is English (design §10); a one-tap toggle to
 * Bahasa Indonesia is provided by the language switcher and never loses step
 * or values. lang is a placeholder default until the locale store drives it.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
