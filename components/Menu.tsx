"use client";

import { useRef } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { DoodleName } from "@/lib/doodles";
import type { ProjectImage } from "@/lib/projects";
import { Doodle } from "./Doodle";
import { Rule } from "./Rule";
import { Signature } from "./Signature";

gsap.registerPlugin(useGSAP);

type MenuItem = {
  href: string;
  label: string;
  doodle: DoodleName;
  offset: number;
  tilt: number;
  peek?: ProjectImage;
};

const ITEMS: MenuItem[] = [
  {
    href: "/editorial",
    label: "Editorial",
    doodle: "pentagram",
    offset: 0,
    tilt: -2,
    peek: { src: "/images/projects/vienna-state-ballet-vogue-portugal/01.jpg", width: 850, height: 1062 },
  },
  {
    href: "/costume-design",
    label: "Costume Design",
    doodle: "devil",
    offset: 0.35,
    tilt: 1.5,
    peek: { src: "/images/projects/fan-letter-short-film/01.jpg", width: 200, height: 113 },
  },
  {
    href: "/red-carpet",
    label: "Red Carpet",
    doodle: "hearts",
    offset: 1,
    tilt: -1,
    peek: { src: "/images/projects/red-carpet-personal-appearances/01.jpg", width: 850, height: 549 },
  },
  {
    href: "/bio",
    label: "Bio",
    doodle: "monogram",
    offset: 0.45,
    tilt: 2.5,
    peek: { src: "/bio/michael-miller.jpg", width: 850, height: 1063 },
  },
];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

type MenuProps = {
  open: boolean;
};

export function Menu({ open }: MenuProps) {
  const root = useRef<HTMLDivElement>(null);
  const hasOpened = useRef(false);
  const pathname = usePathname();

  useGSAP(
    () => {
      const scope = root.current;
      if (!scope || (!open && !hasOpened.current)) return;

      const panel = scope.querySelector(".o-menu");

      if (!open) {
        gsap
          .timeline()
          .to(".o-menu__reveal", { opacity: 0, filter: "blur(10px)", duration: 0.35, ease: "power1.in" })
          .to(panel, { opacity: 0, duration: 0.45, ease: "power2.inOut" }, "-=0.1")
          .set(panel, { visibility: "hidden" });
        return;
      }

      const timeline = gsap
        .timeline()
        .set(panel, { visibility: "visible" })
        .fromTo(panel, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power2.out" });

      hasOpened.current = true;
      timeline
        .fromTo(
          ".a-rule path",
          { strokeDashoffset: 1 },
          { strokeDashoffset: 0, duration: 0.9, ease: "power2.out", stagger: 0.08 },
          "-=0.2",
        )
        .fromTo(
          ".o-menu__reveal",
          { opacity: 0, filter: "blur(15px)" },
          { opacity: 1, filter: "blur(0px)", duration: 0.6, ease: "power1.out", stagger: 0.05 },
          "<",
        );
    },
    { dependencies: [open], scope: root },
  );

  return (
    <div ref={root}>
      <div id="o-menu" className="o-menu" role="dialog" aria-modal="true" aria-label="Menu" aria-hidden={!open} inert={!open}>
        <nav className="o-menu__wrapper">
          <Rule seed={0} />
          <ul className="o-menu__items">
            {ITEMS.map(({ href, label, doodle, offset, tilt, peek }, index) => (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={pathname === href ? "page" : undefined}
                  className="a-display o-menu__item o-menu__reveal"
                  style={{ "--offset": offset, "--tilt": `${tilt}deg` } as CSSProperties}
                >
                  <span className="o-menu__label">
                    <span className="a-hand o-menu__index">{pad(index + 1)}</span>
                    {label}
                    <span className={`o-menu__extras${offset > 0.6 ? " -before" : ""}`}>
                      <Doodle name={doodle} className={`o-menu__doodle -${doodle}`} />
                      {peek && (
                        <Image className="o-menu__peek" src={peek.src} alt="" width={peek.width} height={peek.height} sizes="160px" />
                      )}
                    </span>
                  </span>
                </Link>
                <Rule seed={index + 1} />
              </li>
            ))}
          </ul>
        </nav>

        <Signature className="o-menu__footer o-menu__reveal" />
      </div>

    </div>
  );
}
