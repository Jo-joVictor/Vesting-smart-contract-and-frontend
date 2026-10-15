import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/context/Web3Provider";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: { default: "Nexora Labs — Trustless token infrastructure", template: "%s" },
  description: "Presale, vesting and staking for NXR on Ethereum.",
  openGraph: { title: "Nexora Labs", description: "Presale, vesting and staking for NXR.", type: "website" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookies = (await headers()).get("cookie");

  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen font-sans">
        <Web3Provider cookies={cookies}>
          <Nav />
          <main>{children}</main>
          <Footer />
        </Web3Provider>
      </body>
    </html>
  );
}