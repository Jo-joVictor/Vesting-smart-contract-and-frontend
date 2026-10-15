"use client";

import { useCountdown } from "@/hooks/useCountdown";
import { cn } from "@/lib/utils";

const pad = (n: number) => String(n).padStart(2, "0");

export function Countdown({
  target,
  offset = 0,
  className,
  size = "lg",
  tone = "light",
}: {
  target?: number; // unix seconds
  offset?: number; // chain time minus local time, in seconds
  className?: string;
  size?: "md" | "lg";
  tone?: "light" | "dark";
}) {
  const { ready, days, hours, minutes, seconds } = useCountdown(target, offset);

  const cells = [
    ["Days", days],
    ["Hours", hours],
    ["Min", minutes],
    ["Sec", seconds],
  ] as const;

  return (
    <div className={cn("flex items-end gap-4 md:gap-6", className)} aria-live="off">
      {cells.map(([label, value], i) => (
        <div key={label} className="flex items-end gap-4 md:gap-6">
          <div>
            <div
              className={cn(
                "font-light tabular-nums tracking-tight",
                size === "lg" ? "text-5xl md:text-7xl" : "text-3xl md:text-4xl"
              )}
            >
              {ready ? pad(value) : "––"}
            </div>
            <div
              className={cn(
                "mt-1 font-mono text-[10px] uppercase tracking-wider",
                tone === "dark" ? "text-paper/50" : "text-muted"
              )}
            >
              {label}
            </div>
          </div>
          {i < cells.length - 1 && (
            <span className={cn("pb-5 font-light text-rule", size === "lg" ? "text-4xl" : "text-2xl")}>:</span>
          )}
        </div>
      ))}
    </div>
  );
}