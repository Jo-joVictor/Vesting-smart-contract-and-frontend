import { formatUnits } from "viem";

const group = (s: string) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

function trim(value: bigint, dp: number): string {
  const [int, frac = ""] = formatUnits(value, 18).split(".");
  const f = frac.slice(0, dp).replace(/0+$/, "");
  const out = group(int) + (f ? "." + f : "");
  if (value > 0n && out === "0") return `<0.${"0".repeat(Math.max(dp - 1, 0))}1`;
  return out;
}

export const fmtToken = (v: bigint | undefined, dp = 2) =>
  v === undefined ? "—" : trim(v, dp);

export const fmtEth = (v: bigint | undefined, dp = 4) =>
  v === undefined ? "—" : trim(v, dp);

export const shortAddr = (a?: string) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");

/** bps -> "12.80%" */
export const fmtBps = (bps: bigint | undefined) =>
  bps === undefined ? "—" : `${(Number(bps) / 100).toFixed(2)}%`;

/** seconds -> "3d 4h", "2h 10m", "45s" (two largest non-zero units) */
export function fmtDuration(totalSeconds: number | bigint): string {
  let s = Number(totalSeconds);
  if (s <= 0) return "0s";
  const units: [string, number][] = [
    ["d", 86400],
    ["h", 3600],
    ["m", 60],
    ["s", 1],
  ];
  const parts: string[] = [];
  for (const [label, size] of units) {
    const n = Math.floor(s / size);
    if (n > 0) {
      parts.push(`${n}${label}`);
      s -= n * size;
    }
    if (parts.length === 2) break;
  }
  return parts.join(" ");
}

export const fmtDate = (ts: bigint | number) =>
  new Date(Number(ts) * 1000).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

/** progress 0..100 from two bigints, safe for zero denominators */
export const pctOf = (part: bigint | undefined, whole: bigint | undefined) => {
  if (!part || !whole || whole === 0n) return 0;
  return Math.min(100, Number((part * 10000n) / whole) / 100);
};