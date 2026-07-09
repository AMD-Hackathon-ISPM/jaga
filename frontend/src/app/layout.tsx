import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { AppProviders } from "@/providers/app-providers";
import { cn } from "@/lib/utils";

// Figtree is the single UI typeface for body and headings. Ioskeley carries numerics.
const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-sans",
  display: "swap",
});

const ioskeley = localFont({
  src: "../../public/fonts/IoskeleyMono-Regular.woff2",
  variable: "--font-mono",
  display: "swap",
  weight: "400",
  style: "normal",
});

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
  themeColor: "#007A87",
};

/**
 * Root layout. Default language is English (design §10); a one-tap toggle to
 * Bahasa Indonesia is provided by the language switcher and never loses step
 * or values. lang is a placeholder default until the locale store drives it.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn(figtree.variable, ioskeley.variable)}>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
