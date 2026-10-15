"use client";

import { type ReactNode } from "react";
import { createAppKit } from "@reown/appkit/react";
import { WagmiProvider, cookieToInitialState, type Config } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiAdapter, networks } from "@/lib/wagmi";
import { APP_URL, TARGET_CHAIN, WALLETCONNECT_PROJECT_ID } from "@/lib/config";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 10_000, refetchOnWindowFocus: true } },
});

createAppKit({
  adapters: [wagmiAdapter],
  projectId: WALLETCONNECT_PROJECT_ID,
  networks,
  defaultNetwork: TARGET_CHAIN,
  metadata: {
    name: "Nexora Labs",
    description: "Token infrastructure. Built for the long term.",
    url: APP_URL,
    icons: [`${APP_URL}/favicon.ico`],
  },
  features: { analytics: false, email: false, socials: false },
  themeMode: "light",
  themeVariables: {
    "--w3m-accent": "#6a53d9",
    "--w3m-border-radius-master": "2px",
    "--w3m-font-family": "var(--font-inter), system-ui, sans-serif",
  },
});

export function Web3Provider({
  children,
  cookies,
}: {
  children: ReactNode;
  cookies: string | null;
}) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies);

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}