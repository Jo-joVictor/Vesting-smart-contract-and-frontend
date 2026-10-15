import { sepolia } from "@reown/appkit/networks";
import type { Address } from "viem";

export const TARGET_CHAIN = sepolia;

const addr = (value: string | undefined, fallback: Address): Address =>
  (value && value.startsWith("0x") ? value : fallback) as Address;

export const ADDRESSES = {
  token: addr(
    process.env.NEXT_PUBLIC_TOKEN_ADDRESS,
    "0x15e3168E0F97dE45EA1f847A0906e3632E9C08c9"
  ),
  presale: addr(
    process.env.NEXT_PUBLIC_PRESALE_ADDRESS,
    "0xf2A674660e8f54487D0c505a51Eea2851f924B6e"
  ),
  vesting: addr(
    process.env.NEXT_PUBLIC_VESTING_ADDRESS,
    "0xFA074F31635C720b61bc292B60980B48Ed31b179"
  ),
  staking: addr(
    process.env.NEXT_PUBLIC_STAKING_ADDRESS,
    "0xe57629CD9A8eE29865A409214F27A0434af4D1b9"
  ),
} as const;

export const WALLETCONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ??
  "YOUR_WALLETCONNECT_PROJECT_ID";

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
export const RPC_URL = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || undefined;

export const TOKEN_SYMBOL = "NXR";

export const explorerAddress = (a: string) =>
  `${TARGET_CHAIN.blockExplorers?.default.url}/address/${a}`;
export const explorerTx = (h: string) =>
  `${TARGET_CHAIN.blockExplorers?.default.url}/tx/${h}`;