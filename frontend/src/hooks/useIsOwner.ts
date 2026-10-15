"use client";

import { useAccount, useReadContracts } from "wagmi";
import { presaleAbi, stakingAbi, vestingAbi } from "@/lib/abis";
import { ADDRESSES, TARGET_CHAIN } from "@/lib/config";

const chainId = TARGET_CHAIN.id;

/** True if the connected wallet owns at least one of the protocol contracts. */
export function useIsOwner() {
  const { address } = useAccount();
  const { data } = useReadContracts({
    allowFailure: true,
    contracts: [
      { address: ADDRESSES.presale, abi: presaleAbi, functionName: "owner", chainId },
      { address: ADDRESSES.staking, abi: stakingAbi, functionName: "owner", chainId },
      { address: ADDRESSES.vesting, abi: vestingAbi, functionName: "owner", chainId },
    ],
    query: { enabled: !!address, staleTime: 60_000 },
  });

  if (!address || !data) return false;
  return data.some(
    (r) => r.status === "success" && String(r.result).toLowerCase() === address.toLowerCase()
  );
}