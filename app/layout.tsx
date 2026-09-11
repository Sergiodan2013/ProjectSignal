import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import "./sales.css";
import "./entity.css";

const sans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400","500","600","700"], variable: "--font-sans", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400","500","600"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "ProjectSignal — Project-to-Sales Intelligence",
  description: "Resolve construction signals into qualified projects, stakeholder routes and sales actions.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${sans.variable} ${mono.variable}`}>{children}</body></html>;
}
