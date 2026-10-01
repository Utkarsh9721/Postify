// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ParticlesInit } from "@/components/ParticlesInit";
import { Providers } from "./providers";
import { ScrollToTop } from "@/components/ScrollToTop";   // ← new

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Postify",
  description: "Connect, share, and engage.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <ScrollToTop />                                {/* ← new */}
          <ParticlesInit>{children}</ParticlesInit>
        </Providers>
      </body>
    </html>
  );
}