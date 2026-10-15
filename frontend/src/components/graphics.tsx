import { cn } from "@/lib/utils";

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const line = (pts: [number, number][]) =>
  pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

const SAMPLES = 90;

/** Rotated-ellipse moiré ring (staking / overview hero) */
export function Torus({ className, lines = 40 }: { className?: string; lines?: number }) {
  return (
    <svg viewBox="0 0 400 260" fill="none" className={cn("text-accent", className)} aria-hidden>
      <g stroke="currentColor" strokeWidth="0.6" transform="translate(200 130) scale(1 0.62)">
        {Array.from({ length: lines }, (_, i) => (
          <ellipse key={i} rx="190" ry="58" transform={`rotate(${(i * 180) / lines})`} />
        ))}
      </g>
    </svg>
  );
}

/** Twisting ribbon of fine lines (presale / tokenomics hero) */
export function Wave({
  className,
  lines = 28,
  stroke = "currentColor",
}: {
  className?: string;
  lines?: number;
  stroke?: string;
}) {
  const W = 440;
  const H = 240;
  const paths = Array.from({ length: lines }, (_, i) => {
    const t = i / (lines - 1) - 0.5;
    const pts: [number, number][] = [];
    for (let s = 0; s <= SAMPLES; s++) {
      const x = s / SAMPLES;
      const center = H / 2 + 46 * Math.sin(x * Math.PI * 1.6 + 0.4) - (x - 0.5) * 70;
      const width = 150 * Math.sin(x * Math.PI * 2 + 0.3);
      pts.push([x * W, center + t * width]);
    }
    return line(pts);
  });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} fill="none" className={className} aria-hidden>
      <g stroke={stroke} strokeWidth="0.6" opacity="0.85">
        {paths.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  );
}

/** Stepped ribbon: three rising plateaus (vesting) */
export function Ribbon({ className, lines = 24 }: { className?: string; lines?: number }) {
  const W = 440;
  const H = 240;
  const paths = Array.from({ length: lines }, (_, i) => {
    const t = i / (lines - 1);
    const pts: [number, number][] = [];
    for (let s = 0; s <= SAMPLES; s++) {
      const x = s / SAMPLES;
      const step =
        smoothstep(0.28, 0.31, x) * 55 + smoothstep(0.6, 0.63, x) * 55 + smoothstep(0.93, 0.96, x) * 30;
      const base = H * 0.78 - step + 12 * Math.sin(x * Math.PI * 3);
      pts.push([x * W, base - 90 * t]);
    }
    return line(pts);
  });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} fill="none" className={cn("text-accent", className)} aria-hidden>
      <g stroke="currentColor" strokeWidth="0.6">
        {paths.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  );
}