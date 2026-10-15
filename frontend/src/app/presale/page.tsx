import type { Metadata } from "next";
import { PresaleView } from "@/components/presale/PresaleView";

export const metadata: Metadata = { title: "Presale — Nexora Labs" };

export default function PresalePage() {
  return <PresaleView />;
}