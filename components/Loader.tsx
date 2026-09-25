"use client";

import { useRef } from "react";
import type { RefObject } from "react";
import gsap from "gsap";
import { useMountEffect } from "@/hooks/useMountEffect";
import { Doodle } from "./Doodle";

const DRAW_SECONDS = 2.6;
const DRAW_RATE = 100 / DRAW_SECONDS;
const WAITING_CEILING = 99;

type LoaderProps = {
  progress: RefObject<number>;
  ready: RefObject<boolean>;
  onReveal: () => void;
};

function pad(value: number) {
  return String(value).padStart(3, "0");
}

export function Loader({ progress, ready, onReveal }: LoaderProps) {
  const root = useRef<HTMLDivElement>(null);

  useMountEffect(() => {
    const scope = root.current;
    const counter = scope?.querySelector(".a-loader__count");
    if (!scope || !counter) return;

    let drawn = 0;
    let exit: gsap.core.Timeline | null = null;

    function render() {
      const value = Math.floor(drawn);
      scope!.style.setProperty("--progress", `${drawn}%`);
      scope!.setAttribute("aria-valuenow", String(value));
      counter!.textContent = pad(value);
    }

    function finish() {
      return gsap
        .timeline()
        .to(scope!.querySelector(".a-loader__content"), {
          opacity: 0,
          scale: 0.94,
          filter: "blur(12px)",
          duration: 0.6,
          ease: "power2.in",
          delay: 0.35,
        })
        .to(scope!, { opacity: 0, duration: 0.5, ease: "power2.inOut" }, "-=0.15")
        .set(scope!, { display: "none" })
        .call(onReveal);
    }

    function tick(_time: number, deltaMs: number) {
      const target = ready.current ? 100 : Math.min(progress.current, WAITING_CEILING);
      drawn = Math.max(drawn, Math.min(target, drawn + (DRAW_RATE * deltaMs) / 1000));
      render();

      if (drawn < 100) return;
      gsap.ticker.remove(tick);
      exit = finish();
    }

    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      exit?.kill();
    };
  });

  return (
    <div ref={root} className="a-loader" role="progressbar" aria-label="Loading" aria-valuenow={0} aria-valuemin={0} aria-valuemax={100}>
      <div className="a-loader__content">
        <Doodle name="monogram" className="a-loader__doodle" />
        <p className="a-hand a-loader__count">000</p>
      </div>
    </div>
  );
}
