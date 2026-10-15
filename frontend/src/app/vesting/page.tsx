import type { Metadata } from "next";
import { VestingView } from "@/components/vesting/VestingView";

export const metadata: Metadata = { title: "Vesting — Nexora Labs" };

export default function VestingPage() {
  return <VestingView />;
}