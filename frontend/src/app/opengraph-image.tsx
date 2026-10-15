import { ImageResponse } from "next/og";

export const alt = "Nexora Labs — Trustless token infrastructure";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f7f7f4",
          color: "#1a1b1a",
          padding: 80,
        }}
      >
        <div style={{ display: "flex", fontSize: 34 }}>Nexora Labs</div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 104, lineHeight: 1.02, letterSpacing: -3 }}>
          <span>Trustless token</span>
          <span>infrastructure</span>
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#6a53d9" }}>Presale · Vesting · Staking</div>
      </div>
    ),
    size
  );
}