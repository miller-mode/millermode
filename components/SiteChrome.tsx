"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useMountEffect } from "@/hooks/useMountEffect";
import { Header } from "./Header";
import { Menu } from "./Menu";

export function SiteChrome({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useMountEffect(() => {
    document.documentElement.classList.add("-initialized", "-page");
    return () => document.documentElement.classList.remove("-page");
  });

  return (
    <main className="t-page">
      <Header menuOpen={menuOpen} onLogo={() => router.push("/")} onToggle={() => setMenuOpen(!menuOpen)} />
      <Menu open={menuOpen} />
      {children}
    </main>
  );
}
