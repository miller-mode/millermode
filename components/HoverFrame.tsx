import type { Ref } from "react";

type HoverFrameProps = {
  ref: Ref<SVGSVGElement>;
  className?: string;
};

export function HoverFrame({ ref, className }: HoverFrameProps) {
  return (
    <svg ref={ref} className={["a-hoverFrame", className].filter(Boolean).join(" ")} aria-hidden="true">
      <path pathLength={1} />
      <path pathLength={1} />
      <path pathLength={1} />
      <path pathLength={1} />
    </svg>
  );
}
