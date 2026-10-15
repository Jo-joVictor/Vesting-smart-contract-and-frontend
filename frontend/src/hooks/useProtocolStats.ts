"use client";

import { useReadContracts } from "wagmi";
import { presaleAbi, stakingAbi, tokenAbi } from "@/lib/abis";
import { ADDRESSES, TARGET_CHAIN } from "@/lib/config";

const chainId = TARGET_CHAIN.id;

/** One batched multicall for every protocol-wide number the marketing pages need. */
export function useProtocolStats() {
  const { data, isLoading } = useReadContracts({
    allowFailure: true,
    contracts: [
      { address: ADDRESSES.token, abi: tokenAbi, functionName: "totalSupply", chainId },
      { address: ADDRESSES.presale, abi: presaleAbi, functionName: "totalRaised", chainId },
      { address: ADDRESSES.presale, abi: presaleAbi, functionName: "hardCap", chainId },
      { address: ADDRESSES.presale, abi: presaleAbi, functionName: "totalSold", chainId },
      { address: ADDRESSES.presale, abi: presaleAbi, functionName: "totalAllocation", chainId },
      { address: ADDRESSES.staking, abi: stakingAbi, functionName: "totalStaked", chainId },
      { address: ADDRESSES.staking, abi: stakingAbi, functionName: "aprBps", chainId },
      { address: ADDRESSES.staking, abi: stakingAbi, functionName: "totalRewardsCommitted", chainId },
    ],
  });

  const pick = (i: number): bigint | undefined => {
    const r = data?.[i];
    return r && r.status === "success" ? (r.result as bigint) : undefined;
  };

  return {
    isLoading,
    totalSupply: pick(0),
    totalRaised: pick(1),
    hardCap: pick(2),
    totalSold: pick(3),
    presaleAllocation: pick(4),
    totalStaked: pick(5),
    aprBps: pick(6),
    rewardsCommitted: pick(7),
  };
}