import type { Metadata, Viewport } from "next";
import { Caveat, Schibsted_Grotesk } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";

const grotesk = Schibsted_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const hand = Caveat({
  variable: "--font-hand",
  subsets: ["latin"],
  weight: ["500"],
});

export const metadata: Metadata = {
  title: `${site.name} — ${site.fullName}, ${site.role}`,
  description: site.description,
  icons: { icon: "/logo.svg" },
  openGraph: {
    title: `${site.name} — ${site.fullName}, ${site.role}`,
    description: site.description,
    siteName: site.name,
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${grotesk.variable} ${hand.variable}`}>
      <body>{children}</body>
    </html>
  );
}
