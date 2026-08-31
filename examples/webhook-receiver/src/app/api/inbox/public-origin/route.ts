import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const METRICS_PORTS = [20241, 20242, 20243, 20244, 20245];
const PROBE_MS = 400;

function originFromQuicktunnelHostname(hostname: unknown): string | null {
  if (typeof hostname !== "string") {
    return null;
  }
  const host = hostname
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "");
  if (!host.endsWith(".trycloudflare.com")) {
    return null;
  }
  return `https://${host}`;
}

async function originFromReadyMetricsPort(port: number): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, PROBE_MS);
  const signal = controller.signal;
  try {
    const [readyResponse, tunnelResponse] = await Promise.all([
      fetch(`http://127.0.0.1:${port}/ready`, { signal, cache: "no-store" }),
      fetch(`http://127.0.0.1:${port}/quicktunnel`, { signal, cache: "no-store" }),
    ]);
    if (!readyResponse.ok || !tunnelResponse.ok) {
      return null;
    }
    const body = (await tunnelResponse.json()) as { hostname?: unknown };
    return originFromQuicktunnelHostname(body.hostname);
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function GET() {
  const probed = await Promise.all(METRICS_PORTS.map(originFromReadyMetricsPort));
  let origin: string | null = null;
  for (const candidate of probed) {
    if (candidate !== null) {
      origin = candidate;
    }
  }
  return NextResponse.json({ origin }, { headers: { "Cache-Control": "no-store" } });
}
