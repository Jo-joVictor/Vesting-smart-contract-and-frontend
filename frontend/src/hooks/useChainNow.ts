"use client";

import { useEffect, useState } from "react";
import { useBlock } from "wagmi";
import { TARGET_CHAIN } from "@/lib/config";
import { useNow } from "./useNow";

/**
 * Unix seconds aligned to chain time.
 * Blocks are a few seconds old by the time we read them, so small gaps are
 * ignored. The offset only applies when the visitor's clock is clearly wrong.
 */
export function useChainNow() {
  const local = useNow();
  const { data: block } = useBlock({
    chainId: TARGET_CHAIN.id,
    query: { refetchInterval: 30_000 },
  });
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (!block) return;
    const raw = Number(block.timestamp) - Math.floor(Date.now() / 1000);
    setOffset(Math.abs(raw) > 30 ? raw : 0);
  }, [block]);

  return { now: local === null ? null : local + offset, offset };
}