"use client";

import { useAccount, useReadContracts } from "wagmi";
import { zeroAddress } from "viem";
import { presaleAbi, tokenAbi, vestingAbi } from "@/lib/abis";
import { ADDRESSES, TARGET_CHAIN } from "@/lib/config";

const chainId = TARGET_CHAIN.id;
const v = { address: ADDRESSES.vesting, abi: vestingAbi, chainId } as const;
const pr = { address: ADDRESSES.presale, abi: presaleAbi, chainId } as const;

export type VestingPhase = "loading" | "pending" | "failed" | "active";

export function useVesting() {
  const { address } = useAccount();

  const { data, isLoading } = useReadContracts({
    allowFailure: true,
    contracts: [
      { ...v, functionName: "tgeUnlockBps" }, // 0
      { ...v, functionName: "cliffDuration" }, // 1
      { ...v, functionName: "linearDuration" }, // 2
      { ...v, functionName: "totalClaimed" }, // 3
      { ...pr, functionName: "tgeTime" }, // 4
      { ...pr, functionName: "finalized" }, // 5
      { ...pr, functionName: "successful" }, // 6
      { address: ADDRESSES.token, abi: tokenAbi, functionName: "balanceOf", args: [ADDRESSES.vesting], chainId }, // 7
    ],
    query: { refetchInterval: 15_000 },
  });

  const { data: user } = useReadContracts({
    allowFailure: true,
    contracts: [
      { ...pr, functionName: "purchased", args: [address ?? zeroAddress] }, // 0
      { ...v, functionName: "claimed", args: [address ?? zeroAddress] }, // 1
      { ...v, functionName: "vested", args: [address ?? zeroAddress] }, // 2
      { ...v, functionName: "claimable", args: [address ?? zeroAddress] }, // 3
    ],
    query: { enabled: !!address, refetchInterval: 15_000 },
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
    tgeUnlockBps: val<bigint>(0),
    cliffDuration: val<bigint>(1),
    linearDuration: val<bigint>(2),
    totalClaimed: val<bigint>(3),
    tgeTime: val<bigint>(4),
    finalized: val<boolean>(5),
    successful: val<boolean>(6),
    vaultBalance: val<bigint>(7),
    purchased: uval(0),
    claimed: uval(1),
    vested: uval(2),
    claimable: uval(3),
  };
}

export type VestingData = ReturnType<typeof useVesting>;

export function getVestingPhase(d: VestingData): VestingPhase {
  if (d.finalized === undefined) return "loading";
  if (!d.finalized) return "pending";
  return d.successful ? "active" : "failed";
}