# Nexora Web

Frontend for the Nexora token launch: presale, vesting, staking and tokenomics, plus an owner-only admin console. It talks directly to the Nexora smart contracts on Sepolia.

## Features

- **Overview:** live protocol stats and a recent-activity feed.
- **Presale:** countdown, progress bar with soft-cap marker, staged pricing table, buy form with on-chain quote and slippage, finalize, refunds.
- **Vesting:** timeline with real dates, claimed / claimable / locked bar, claim button.
- **Staking:** approve, stake, unstake, claim rewards, exit, live APR.
- **Tokenomics:** 40 / 30 / 30 allocation, verified against the deployed contracts.
- **Admin** (`/admin`): fund and start reward periods, withdraw proceeds, rescue unsold tokens, pause and unpause. Visible in the nav only to contract owners.

## Stack

- [Next.js](https://nextjs.org/) (App Router) + TypeScript
- Tailwind CSS v4
- [wagmi](https://wagmi.sh/) + [viem](https://viem.sh/) + TanStack Query
- [Reown AppKit](https://reown.com/appkit) (WalletConnect) for wallet connection
- Etherscan API (server-side only) for the activity feed

## Getting started

Requires Node 20+ and [pnpm](https://pnpm.io/).

```bash
pnpm install
cp .env.local.example .env.local   # then fill in the values below
pnpm dev
```

Open http://localhost:3000.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Yes | Project ID from [Reown Cloud](https://cloud.reown.com). Add your domains to its allow-list. |
| `NEXT_PUBLIC_APP_URL` | Yes | Public URL of the site (`http://localhost:3000` locally, your domain in production). |
| `NEXT_PUBLIC_SEPOLIA_RPC_URL` | Recommended | Your own RPC (Alchemy or Infura). Falls back to public endpoints. Restrict the key by domain. |
| `NEXT_PUBLIC_TOKEN_ADDRESS` | No | Overrides the default token address. |
| `NEXT_PUBLIC_PRESALE_ADDRESS` | No | Overrides the default presale address. |
| `NEXT_PUBLIC_VESTING_ADDRESS` | No | Overrides the default vesting address. |
| `NEXT_PUBLIC_STAKING_ADDRESS` | No | Overrides the default staking address. |
| `ETHERSCAN_API_KEY` | For activity feed | **Server-only.** Do not prefix with `NEXT_PUBLIC_`. |
| `DEPLOY_BLOCK` | No | Block of the first deployment. Speeds up log queries. |

Anything prefixed `NEXT_PUBLIC_` is visible in the browser.

## Scripts

```bash
pnpm dev     # development server
pnpm build   # production build (run before deploying)
pnpm start   # serve the production build
pnpm lint    # lint
```

## Project structure

```
src/
├─ app/
│  ├─ page.tsx                 Overview
│  ├─ presale/ vesting/ staking/ tokenomics/ admin/
│  ├─ api/activity/route.ts    Server route: reads contract logs via Etherscan
│  ├─ layout.tsx · globals.css · not-found · loading · error
│  └─ icon.svg · opengraph-image.tsx
├─ components/
│  ├─ presale/ vesting/ staking/ admin/   Page-specific components
│  ├─ ui.tsx · Nav · Footer · ConnectButton · ActionButton
│  ├─ TxStatus · Countdown · graphics.tsx · ActivityFeed
│  └─ LiveStats · AllocationCards · OnChainCheck · Feature
├─ context/Web3Provider.tsx    wagmi + React Query + AppKit setup
├─ hooks/                      Contract-read hooks, countdown, transaction wrapper
└─ lib/
   ├─ abis.ts                  Human-readable ABIs (include custom errors)
   ├─ config.ts                Chain and contract addresses
   ├─ wagmi.ts                 Transports with RPC fallbacks
   ├─ format.ts · errors.ts · utils.ts · tokenomics.ts
```

## How it works

- **Reads** go through wagmi's batched multicall with an explicit `chainId`, so data loads even when the wallet is on another network or disconnected.
- **Writes** go through `ActionButton` (connect and network-switch handling) and `useTx` (sign → wait for receipt → refetch all reads → readable revert messages).
- **Countdowns** follow chain time (latest block timestamp), not the visitor's clock, when the clock is clearly wrong.
- **Quotes:** the presale form calls the contract's `quote()` and mirrors its validation rules before the user signs.
- **Admin access** is gated in the UI by comparing the wallet to each contract's `owner()`. The real protection is the contracts' `onlyOwner` checks.

## Deploying to Vercel

1. Run `pnpm build` locally and fix any errors.
2. Push the repo to GitHub and import it in Vercel.
3. Add the environment variables above (Project Settings → Environment Variables). Set `NEXT_PUBLIC_APP_URL` to the production URL.
4. In Reown Cloud, add the Vercel domain (and any custom domain) to the Project ID's allow-list.
5. Deploy.

## Switching networks

1. In `src/lib/config.ts`, change `TARGET_CHAIN` (for example import `mainnet` from `@reown/appkit/networks`).
2. Set the four contract addresses in the environment.
3. Replace the public RPC list in `src/lib/wagmi.ts` with endpoints for that chain.
4. Set `DEPLOY_BLOCK` to the presale deployment block.
5. Remove the "test network" sentence from the FAQ copy on the presale, staking and tokenomics pages.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `Can't resolve '@x402/...'` at build | `pnpm add @x402/core @x402/evm @x402/svm`, or alias those modules to `false` in the webpack config in `next.config.ts`. |
| `Cross-Origin-Opener-Policy ... 404` in the console | Use a real Reown Project ID with your domain allow-listed. Usually harmless. |
| Numbers show `—` or load slowly | RPC problem. Set `NEXT_PUBLIC_SEPOLIA_RPC_URL` to your own Alchemy or Infura endpoint and restart the dev server. |
| Activity feed says the key isn't set | Set `ETHERSCAN_API_KEY` (no `NEXT_PUBLIC_` prefix) and restart. |
| Claim button disabled on `/vesting` | The presale isn't finalized as successful yet, or the vesting contract hasn't been funded with NXR. |
| Staking APR shows 0% | No reward period is active, or nobody is staking yet. The owner must fund rewards and start a period on `/admin`. |

## Security notes

- Never put private keys in this repo or in any `NEXT_PUBLIC_` variable.
- Treat the UI as a convenience layer. Everything that matters is enforced by the contracts, which should be audited before mainnet use.

## License

MIT