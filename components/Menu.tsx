"use client";

import { useRef } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { DoodleName } from "@/lib/doodles";
import type { ProjectImage } from "@/lib/projects";
import { site } from "@/lib/site";
import { Doodle } from "./Doodle";

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
    peek: { src: "/projects/vienna-state-ballet-vogue-portugal/01.jpg", width: 850, height: 1062 },
  },
  {
    href: "/costume-design",
    label: "Costume Design",
    doodle: "devil",
    offset: 0.35,
    tilt: 1.5,
    peek: { src: "/projects/fan-letter-short-film/01.jpg", width: 200, height: 113 },
  },
  {
    href: "/red-carpet",
    label: "Red Carpet",
    doodle: "hearts",
    offset: 1,
    tilt: -1,
    peek: { src: "/projects/red-carpet-personal-appearances/01.jpg", width: 850, height: 549 },
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

const RULE_WIDTH = 1000;
const RULE_STEP = 40;

function wobblePath(seed: number) {
  const points = Array.from({ length: RULE_WIDTH / RULE_STEP + 1 }, (_, index) => {
    const x = index * RULE_STEP;
    const y = 6 + Math.sin(index * 0.9 + seed * 2.3) * 1.6 + Math.sin(index * 0.37 + seed) * 2.2;
    return { x, y };
  });

  return points.reduce((path, point, index) => {
    if (index === 0) return `M${point.x} ${point.y.toFixed(2)}`;
    const previous = points[index - 1];
    const midX = (previous.x + point.x) / 2;
    const midY = ((previous.y + point.y) / 2).toFixed(2);
    return `${path} Q${previous.x} ${previous.y.toFixed(2)} ${midX} ${midY}`;
  }, "");
}

function Rule({ seed }: { seed: number }) {
  return (
    <svg className="o-menu__rule" viewBox={`0 0 ${RULE_WIDTH} 12`} preserveAspectRatio="none" aria-hidden="true">
      <path pathLength={1} d={wobblePath(seed)} />
    </svg>
  );
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

type MenuProps = {
  open: boolean;
};

export function Menu({ open }: MenuProps) {
  const root = useRef<HTMLDivElement>(null);
  const hasOpened = useRef(false);

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
          ".o-menu__rule path",
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
                  prefetch={false}
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

        <footer className="o-menu__footer o-menu__reveal">
          <p className="o-menu__signature">
            <Doodle name="xxx" className="o-menu__signatureDoodle" />
            <Doodle name="comma" className="o-menu__signatureComma" />
            <Doodle name="monogram" className="o-menu__signatureDoodle" />
          </p>
          <a className="a-label o-menu__email" href={`mailto:${site.email}`}>
            {site.email}
          </a>
        </footer>
      </div>

    </div>
  );
}
