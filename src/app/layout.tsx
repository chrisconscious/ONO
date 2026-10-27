import type { Metadata } from "next";

import "./globals.css";
import { IBM_Plex_Sans } from "next/font/google";
import { cn } from "@/lib/utils";

const ibmPlexSans = IBM_Plex_Sans({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: {
    default: "ONO",
    template: "%s · ONO",
  },
  description: "Multi-tenant business operations platform.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn("font-sans", ibmPlexSans.variable)}>
      <body>{children}</body>
    </html>
  );
}
