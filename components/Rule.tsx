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

type RuleProps = {
  seed: number;
  className?: string;
};

export function Rule({ seed, className }: RuleProps) {
  return (
    <svg
      className={["a-rule", className].filter(Boolean).join(" ")}
      viewBox={`0 0 ${RULE_WIDTH} 12`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path pathLength={1} d={wobblePath(seed)} />
    </svg>
  );
}
