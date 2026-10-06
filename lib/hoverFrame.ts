import gsap from "gsap";
import type { ScreenRect } from "@/lib/gallery/Gallery";

const PAD = 28;
const DRAW_DURATION = 0.55;

function wobble(amount: number) {
  return (Math.random() * 2 - 1) * amount;
}

function overshooter(size: number) {
  const base = Math.min(Math.max(size * 0.045, 6), 12);
  return () => base + Math.random() * base * 1.4;
}

function messyEdges(width: number, height: number) {
  const left = PAD;
  const top = PAD;
  const right = PAD + width;
  const bottom = PAD + height;
  const midX = (left + right) / 2;
  const midY = (top + bottom) / 2;
  const edge = Math.min(Math.max(Math.min(width, height) * 0.018, 3), 10);
  const bow = edge * 2.4;
  const overshoot = overshooter(Math.min(width, height));

  return [
    `M${left - overshoot()} ${top + wobble(edge)} Q${midX + wobble(width * 0.2)} ${top + wobble(bow)} ${right + overshoot()} ${top + wobble(edge)}`,
    `M${right + wobble(edge)} ${top - overshoot()} Q${right + wobble(bow)} ${midY + wobble(height * 0.2)} ${right + wobble(edge)} ${bottom + overshoot()}`,
    `M${right + overshoot()} ${bottom + wobble(edge)} Q${midX + wobble(width * 0.2)} ${bottom + wobble(bow)} ${left - overshoot()} ${bottom + wobble(edge)}`,
    `M${left + wobble(edge)} ${bottom + overshoot()} Q${left + wobble(bow)} ${midY + wobble(height * 0.2)} ${left + wobble(edge)} ${top - overshoot()}`,
  ];
}

function place(frame: SVGSVGElement, rect: ScreenRect) {
  frame.style.transform = `translate3d(${rect.x - PAD}px, ${rect.y - PAD}px, 0)`;
}

export function drawFrame(frame: SVGSVGElement, rect: ScreenRect) {
  const width = rect.width + PAD * 2;
  const height = rect.height + PAD * 2;
  const strokes = Array.from(frame.querySelectorAll("path"));
  const edges = messyEdges(rect.width, rect.height);

  frame.setAttribute("width", String(width));
  frame.setAttribute("height", String(height));
  frame.setAttribute("viewBox", `0 0 ${width} ${height}`);
  strokes.forEach((stroke, index) => stroke.setAttribute("d", edges[index]));
  place(frame, rect);

  gsap.killTweensOf([frame, ...strokes]);
  gsap.set(frame, { opacity: 1 });
  gsap.fromTo(
    strokes,
    { strokeDashoffset: 1 },
    { strokeDashoffset: 0, duration: DRAW_DURATION / 2, ease: "power1.inOut", stagger: DRAW_DURATION / 4 },
  );
}

export function moveFrame(frame: SVGSVGElement, rect: ScreenRect) {
  place(frame, rect);
}

export function hideFrame(frame: SVGSVGElement) {
  gsap.killTweensOf(frame);
  gsap.to(frame, { opacity: 0, duration: 0.2, ease: "power1.out" });
}
