"use client";

import { useImperativeHandle, useRef } from "react";
import type { Ref } from "react";
import { useMountEffect } from "@/hooks/useMountEffect";
import { Doodle } from "./Doodle";

const LERP = 0.7;
const SETTLE_THRESHOLD = 0.01;
const IDLE_LABEL = "Scroll or drag";

export type CursorHandle = {
  setHover: (label: string | null) => void;
};

type CursorProps = {
  ref: Ref<CursorHandle>;
  home: boolean;
};

function lerp(from: number, to: number, amount: number) {
  return (1 - amount) * from + amount * to;
}

export function Cursor({ ref, home }: CursorProps) {
  const pointer = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLParagraphElement>(null);

  useImperativeHandle(ref, () => ({
    setHover(text) {
      pointer.current?.classList.toggle("-hover", text !== null);
      if (label.current) label.current.textContent = text ?? IDLE_LABEL;
    },
  }));

  useMountEffect(() => {
    const mouse = { x: 0, y: 0 };
    const position = { x: 0, y: 0 };
    let frame = 0;

    function render() {
      position.x = lerp(position.x, mouse.x, LERP);
      position.y = lerp(position.y, mouse.y, LERP);
      if (pointer.current) pointer.current.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;
      const moving = Math.abs(position.x - mouse.x) > SETTLE_THRESHOLD || Math.abs(position.y - mouse.y) > SETTLE_THRESHOLD;
      if (moving) frame = window.requestAnimationFrame(render);
    }

    function onMouseMove(event: MouseEvent) {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
      pointer.current?.classList.add("-visible");
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(render);
    }

    window.addEventListener("mousemove", onMouseMove);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.cancelAnimationFrame(frame);
    };
  });

  return (
    <div ref={pointer} className={`a-cursor${home ? " -home" : ""}`} aria-hidden="true">
      <Doodle name="dot" className="a-cursor__dot" />
      <p ref={label} className="a-p a-cursor__label">
        {IDLE_LABEL}
      </p>
    </div>
  );
}
