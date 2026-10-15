"use client";
import { useNow } from "./useNow";

export function useCountdown(targetSec?: number, offsetSec = 0) {
  const now = useNow();

  if (now === null || targetSec === undefined) {
    return { ready: false, done: false, remaining: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const remaining = Math.max(0, targetSec - (now + offsetSec));
  return {
    ready: true,
    done: remaining === 0,
    remaining,
    days: Math.floor(remaining / 86400),
    hours: Math.floor((remaining % 86400) / 3600),
    minutes: Math.floor((remaining % 3600) / 60),
    seconds: remaining % 60,
  };
}