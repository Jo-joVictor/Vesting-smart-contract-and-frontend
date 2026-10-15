import type { Metadata } from "next";
import { StakingView } from "@/components/staking/StakingView";

export const metadata: Metadata = { title: "Staking — Nexora Labs" };

export default function StakingPage() {
  return <StakingView />;
}