import type { Metadata } from "next";
import { Geist, Geist_Mono, Sora } from "next/font/google";
import { DisclosureBanner } from "@/components/disclosure-banner";
import { SiteNav } from "@/components/site-nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// A bolder, more expressive geometric sans for headings only — body copy
// stays on Geist for readability (WCAG 2.2 AA, CLAUDE.md accessibility).
const sora = Sora({
  variable: "--font-heading-sora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "InsureWise",
  description:
    "An educational, decision-support tool for car and home insurance.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${sora.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <DisclosureBanner />
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
