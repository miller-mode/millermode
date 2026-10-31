import type { Metadata, Viewport } from "next";
import { Caveat, Schibsted_Grotesk } from "next/font/google";
import localFont from "next/font/local";
import { site } from "@/lib/site";
import "./globals.css";

const grotesk = Schibsted_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const hand = localFont({
  src: "./fonts/MMHand.woff2",
  variable: "--font-hand",
  display: "swap",
  declarations: [{ prop: "size-adjust", value: "130%" }],
});

const handFallback = Caveat({
  variable: "--font-hand-fallback",
  subsets: ["latin"],
  weight: ["500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://millermode.com"),
  title: {
    default: `${site.name} — ${site.fullName}, ${site.role}`,
    template: `%s — ${site.fullName}, ${site.role}`,
  },
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
    <html lang="en" className={`${grotesk.variable} ${hand.variable} ${handFallback.variable}`}>
      <body>{children}</body>
    </html>
  );
}
