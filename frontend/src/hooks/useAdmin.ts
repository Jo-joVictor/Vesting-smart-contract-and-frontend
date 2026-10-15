"use client";

import { useAccount, useBalance, useReadContracts } from "wagmi";
import { zeroAddress, type Address } from "viem";
import { presaleAbi, stakingAbi, tokenAbi, vestingAbi } from "@/lib/abis";
import { ADDRESSES, TARGET_CHAIN } from "@/lib/config";

const chainId = TARGET_CHAIN.id;
const pr = { address: ADDRESSES.presale, abi: presaleAbi, chainId } as const;
const st = { address: ADDRESSES.staking, abi: stakingAbi, chainId } as const;
const vs = { address: ADDRESSES.vesting, abi: vestingAbi, chainId } as const;
const tk = { address: ADDRESSES.token, abi: tokenAbi, chainId } as const;

const sub = (a?: bigint, b?: bigint) => (a !== undefined && b !== undefined && a > b ? a - b : 0n);

export function useAdmin() {
  const { address } = useAccount();
  const who = address ?? zeroAddress;

  const { data } = useReadContracts({
    allowFailure: true,
    contracts: [
      { ...pr, functionName: "owner" }, // 0
      { ...pr, functionName: "paused" }, // 1
      { ...pr, functionName: "finalized" }, // 2
      { ...pr, functionName: "successful" }, // 3
      { ...pr, functionName: "totalSold" }, // 4
      { ...st, functionName: "owner" }, // 5
      { ...st, functionName: "paused" }, // 6
      { ...st, functionName: "totalStaked" }, // 7
      { ...st, functionName: "totalRewardsCommitted" }, // 8
      { ...st, functionName: "totalRewardsPaid" }, // 9
      { ...st, functionName: "rewardsDuration" }, // 10
      { ...vs, functionName: "owner" }, // 11
      { ...vs, functionName: "totalClaimed" }, // 12
      { ...tk, functionName: "balanceOf", args: [ADDRESSES.staking] }, // 13
      { ...tk, functionName: "balanceOf", args: [ADDRESSES.vesting] }, // 14
      { ...tk, functionName: "balanceOf", args: [who] }, // 15
    ],
    query: { refetchInterval: 15_000 },
  });

  const { data: presaleEth } = useBalance({
    address: ADDRESSES.presale,
    chainId,
    query: { refetchInterval: 15_000 },
  });

  const val = <T,>(i: number): T | undefined => {
    const r = data?.[i];
    return r && r.status === "success" ? (r.result as unknown as T) : undefined;
  };

  const isOwner = (o?: Address) => !!address && !!o && o.toLowerCase() === address.toLowerCase();

  const presaleOwner = val<Address>(0);
  const stakingOwner = val<Address>(5);
  const vestingOwner = val<Address>(11);

  const finalized = val<boolean>(2);
  const successful = val<boolean>(3);
  const totalSold = val<bigint>(4);
  const totalStaked = val<bigint>(7);
  const committed = val<bigint>(8);
  const paid = val<bigint>(9);
  const stakingBal = val<bigint>(13);
  const vestingBal = val<bigint>(14);
  const totalClaimed = val<bigint>(12);

  // Staking: contract balance minus principal = reward pool; minus unpaid commitments = uncommitted.
  const rewardPool = sub(stakingBal, totalStaked);
  const outstanding = sub(committed, paid);
  const uncommitted = sub(rewardPool, outstanding);

  // Vesting: what buyers are still owed, and what is safe to rescue.
  const stillOwed = sub(totalSold, totalClaimed);
  const owedForRescue = finalized && successful ? stillOwed : 0n;
  const rescuable = sub(vestingBal, owedForRescue);
  const vestingShortfall = sub(finalized && !successful ? 0n : stillOwed, vestingBal);

  return {
    connected: !!address,
    address,
    walletNxr: val<bigint>(15),

    presale: {
      owner: presaleOwner,
      isOwner: isOwner(presaleOwner),
      paused: val<boolean>(1),
      finalized,
      successful,
      totalSold,
      ethBalance: presaleEth?.value,
    },
    staking: {
      owner: stakingOwner,
      isOwner: isOwner(stakingOwner),
      paused: val<boolean>(6),
      totalStaked,
      committed,
      paid,
      duration: val<bigint>(10),
      balance: stakingBal,
      outstanding,
      uncommitted,
    },
    vesting: {
      owner: vestingOwner,
      isOwner: isOwner(vestingOwner),
      balance: vestingBal,
      totalClaimed,
      stillOwed,
      rescuable,
      shortfall: vestingShortfall,
    },
  };
}

export type AdminData = ReturnType<typeof useAdmin>;