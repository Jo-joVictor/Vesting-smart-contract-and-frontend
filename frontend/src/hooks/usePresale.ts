"use client";

import { useAccount, useBalance, useReadContracts } from "wagmi";
import { zeroAddress } from "viem";
import { presaleAbi } from "@/lib/abis";
import { ADDRESSES, TARGET_CHAIN } from "@/lib/config";

const base = { address: ADDRESSES.presale, abi: presaleAbi, chainId: TARGET_CHAIN.id } as const;

export type Stage = { allocation: bigint; sold: bigint; priceWei: bigint };
export type Phase = "loading" | "upcoming" | "live" | "ended" | "success" | "failed";

export function usePresale() {
  const { address } = useAccount();

  const { data, isLoading } = useReadContracts({
    allowFailure: true,
    contracts: [
      { ...base, functionName: "startTime" }, // 0
      { ...base, functionName: "endTime" }, // 1
      { ...base, functionName: "softCap" }, // 2
      { ...base, functionName: "hardCap" }, // 3
      { ...base, functionName: "minContribution" }, // 4
      { ...base, functionName: "maxContribution" }, // 5
      { ...base, functionName: "totalAllocation" }, // 6
      { ...base, functionName: "totalRaised" }, // 7
      { ...base, functionName: "totalSold" }, // 8
      { ...base, functionName: "tgeTime" }, // 9
      { ...base, functionName: "finalized" }, // 10
      { ...base, functionName: "successful" }, // 11
      { ...base, functionName: "paused" }, // 12
      { ...base, functionName: "getStage", args: [0n] }, // 13
      { ...base, functionName: "getStage", args: [1n] }, // 14
      { ...base, functionName: "getStage", args: [2n] }, // 15
    ],
    query: { refetchInterval: 15_000 },
  });

  const { data: user } = useReadContracts({
    allowFailure: true,
    contracts: [
      { ...base, functionName: "purchased", args: [address ?? zeroAddress] },
      { ...base, functionName: "contributions", args: [address ?? zeroAddress] },
    ],
    query: { enabled: !!address, refetchInterval: 15_000 },
  });

  const { data: balance } = useBalance({
    address,
    chainId: TARGET_CHAIN.id,
    query: { enabled: !!address },
  });

  const val = <T,>(i: number): T | undefined => {
    const r = data?.[i];
    return r && r.status === "success" ? (r.result as unknown as T) : undefined;
  };
  const uval = (i: number): bigint | undefined => {
    const r = user?.[i];
    return r && r.status === "success" ? (r.result as bigint) : undefined;
  };

  return {
    isLoading,
    startTime: val<bigint>(0),
    endTime: val<bigint>(1),
    softCap: val<bigint>(2),
    hardCap: val<bigint>(3),
    minContribution: val<bigint>(4),
    maxContribution: val<bigint>(5),
    totalAllocation: val<bigint>(6),
    totalRaised: val<bigint>(7),
    totalSold: val<bigint>(8),
    tgeTime: val<bigint>(9),
    finalized: val<boolean>(10),
    successful: val<boolean>(11),
    paused: val<boolean>(12),
    stages: [val<Stage>(13), val<Stage>(14), val<Stage>(15)],
    purchased: uval(0),
    contributions: uval(1),
    ethBalance: balance?.value,
  };
}

export type PresaleData = ReturnType<typeof usePresale>;

export function getPhase(p: PresaleData, now: number | null): Phase {
  if (p.startTime === undefined || p.endTime === undefined || p.finalized === undefined || now === null) {
    return "loading";
  }
  if (p.finalized) return p.successful ? "success" : "failed";
  if (now < Number(p.startTime)) return "upcoming";

  const capHit = p.totalRaised !== undefined && p.hardCap !== undefined && p.totalRaised >= p.hardCap;
  const soldOut =
    p.totalSold !== undefined && p.totalAllocation !== undefined && p.totalSold >= p.totalAllocation;

  if (now >= Number(p.endTime) || capHit || soldOut) return "ended";
  return "live";
}