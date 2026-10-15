"use client";

import { useAccount, useReadContracts } from "wagmi";
import { zeroAddress } from "viem";
import { stakingAbi, tokenAbi } from "@/lib/abis";
import { ADDRESSES, TARGET_CHAIN } from "@/lib/config";

const chainId = TARGET_CHAIN.id;
const s = { address: ADDRESSES.staking, abi: stakingAbi, chainId } as const;
const t = { address: ADDRESSES.token, abi: tokenAbi, chainId } as const;

export function useStaking() {
  const { address } = useAccount();
  const who = address ?? zeroAddress;

  const { data, isLoading } = useReadContracts({
    allowFailure: true,
    contracts: [
      { ...s, functionName: "totalStaked" }, // 0
      { ...s, functionName: "rewardRate" }, // 1
      { ...s, functionName: "periodFinish" }, // 2
      { ...s, functionName: "rewardsDuration" }, // 3
      { ...s, functionName: "aprBps" }, // 4
      { ...s, functionName: "paused" }, // 5
      { ...s, functionName: "totalRewardsCommitted" }, // 6
      { ...s, functionName: "totalRewardsPaid" }, // 7
    ],
    query: { refetchInterval: 15_000 },
  });

  const { data: user } = useReadContracts({
    allowFailure: true,
    contracts: [
      { ...s, functionName: "balances", args: [who] }, // 0
      { ...s, functionName: "earned", args: [who] }, // 1
      { ...t, functionName: "balanceOf", args: [who] }, // 2
      { ...t, functionName: "allowance", args: [who, ADDRESSES.staking] }, // 3
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
    totalStaked: val<bigint>(0),
    rewardRate: val<bigint>(1),
    periodFinish: val<bigint>(2),
    rewardsDuration: val<bigint>(3),
    aprBps: val<bigint>(4),
    paused: val<boolean>(5),
    rewardsCommitted: val<bigint>(6),
    rewardsPaid: val<bigint>(7),
    staked: uval(0),
    earned: uval(1),
    walletBalance: uval(2),
    allowance: uval(3),
  };
}

export type StakingData = ReturnType<typeof useStaking>;