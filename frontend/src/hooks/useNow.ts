"use client";
import { useEffect, useState } from "react";

/** Current unix time in seconds, ticking every second. null until mounted (avoids hydration mismatch). */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Math.floor(Date.now() / 1000));
    tick();
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}