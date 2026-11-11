import React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/app/providers";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/shared/AppShell";

const fontStack =
  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export const metadata: Metadata = {
  title: "Intelligent Pattern Discovery",
  description: "Explainable AI Analytics Engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body style={{ fontFamily: fontStack }} className="bg-background text-foreground min-h-screen flex">
        <TooltipProvider>
          <Providers>
            <AppShell>
              {children}
            </AppShell>
          </Providers>
        </TooltipProvider>
      </body>
    </html>
  );
}
