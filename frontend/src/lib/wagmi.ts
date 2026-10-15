import { cookieStorage, createStorage, fallback, http } from "wagmi";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import type { AppKitNetwork } from "@reown/appkit/networks";
import { RPC_URL, TARGET_CHAIN, WALLETCONNECT_PROJECT_ID } from "./config";

export const networks = [TARGET_CHAIN] as [AppKitNetwork, ...AppKitNetwork[]];

// Your own RPC (if set) goes first, then public Sepolia endpoints as backup.
const PUBLIC_SEPOLIA_RPCS = [
  "https://ethereum-sepolia-rpc.publicnode.com",
  "https://sepolia.drpc.org",
  "https://1rpc.io/sepolia",
];

const urls = [RPC_URL, ...PUBLIC_SEPOLIA_RPCS].filter(Boolean) as string[];

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  projectId: WALLETCONNECT_PROJECT_ID,
  networks,
  transports: {
    [TARGET_CHAIN.id]: fallback(
      urls.map((u) => http(u, { batch: true, retryCount: 2, timeout: 10_000 })),
      { rank: false }
    ),
  },
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;