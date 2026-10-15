import { NextResponse } from "next/server";
import { decodeEventLog, type Abi, type Hex } from "viem";
import { presaleAbi, stakingAbi, vestingAbi } from "@/lib/abis";
import { ADDRESSES, TARGET_CHAIN } from "@/lib/config";

export const revalidate = 30;

type Item = {
  kind: string;
  label: string;
  who?: string;
  amount?: string; // wei
  unit?: "NXR" | "ETH";
  ts: number;
  block: number;
  logIndex: number;
  tx: string;
};

type RawLog = {
  topics: Hex[];
  data: Hex;
  blockNumber: string;
  timeStamp: string;
  logIndex: string;
  transactionHash: string;
};

const SOURCES: { address: string; abi: Abi }[] = [
  { address: ADDRESSES.presale, abi: presaleAbi as Abi },
  { address: ADDRESSES.staking, abi: stakingAbi as Abi },
  { address: ADDRESSES.vesting, abi: vestingAbi as Abi },
];

const hex = (s: string) => parseInt(s === "0x" ? "0" : s, 16);

async function fetchLogs(address: string, key: string, fromBlock: string): Promise<RawLog[]> {
  const url =
    `https://api.etherscan.io/v2/api?chainid=${TARGET_CHAIN.id}&module=logs&action=getLogs` +
    `&address=${address}&fromBlock=${fromBlock}&toBlock=latest&page=1&offset=1000&apikey=${key}`;
  const res = await fetch(url, { next: { revalidate: 30 } });
  const json = await res.json();
  return Array.isArray(json.result) ? json.result : []; // "No records found" returns a string
}

function toItem(log: RawLog, abi: Abi): Item | null {
  let ev: { eventName?: string; args?: unknown };
  try {
    ev = decodeEventLog({ abi, data: log.data, topics: log.topics as [Hex, ...Hex[]] }) as typeof ev;
  } catch {
    return null; // events we don't display (OwnershipTransferred, Paused, ...)
  }
  const a = (ev.args ?? {}) as Record<string, unknown>;
  const base = {
    ts: hex(log.timeStamp),
    block: hex(log.blockNumber),
    logIndex: hex(log.logIndex),
    tx: log.transactionHash,
  };

  switch (ev.eventName) {
    case "TokensPurchased":
      return { ...base, kind: "Purchase", label: "bought", who: a.buyer as string, amount: String(a.tokensReceived), unit: "NXR" };
    case "Refunded":
      return { ...base, kind: "Refund", label: "refunded", who: a.buyer as string, amount: String(a.amount), unit: "ETH" };
    case "SaleFinalized":
      return { ...base, kind: "Presale", label: a.successful ? "sale finalized: successful" : "sale finalized: failed" };
    case "TokensClaimed":
      return { ...base, kind: "Claim", label: "claimed vested", who: a.buyer as string, amount: String(a.amount), unit: "NXR" };
    case "Staked":
      return { ...base, kind: "Stake", label: "staked", who: a.user as string, amount: String(a.amount), unit: "NXR" };
    case "Withdrawn":
      return { ...base, kind: "Unstake", label: "unstaked", who: a.user as string, amount: String(a.amount), unit: "NXR" };
    case "RewardPaid":
      return { ...base, kind: "Rewards", label: "claimed rewards", who: a.user as string, amount: String(a.amount), unit: "NXR" };
    case "RewardAdded":
      return { ...base, kind: "Rewards", label: "reward period funded", amount: String(a.amount), unit: "NXR" };
    default:
      return null;
  }
}

export async function GET() {
  const key = process.env.ETHERSCAN_API_KEY;
  if (!key) return NextResponse.json({ items: [], error: "ETHERSCAN_API_KEY is not set" });

  const from = process.env.DEPLOY_BLOCK || "0";
  const items: Item[] = [];

  try {
    // Sequential to stay inside Etherscan's free-tier rate limit.
    for (const s of SOURCES) {
      const logs = await fetchLogs(s.address, key, from);
      for (const l of logs) {
        const item = toItem(l, s.abi);
        if (item) items.push(item);
      }
    }
  } catch {
    return NextResponse.json({ items: [], error: "Could not load activity" });
  }

  items.sort((a, b) => b.block - a.block || b.logIndex - a.logIndex);
  return NextResponse.json({ items: items.slice(0, 20) });
}