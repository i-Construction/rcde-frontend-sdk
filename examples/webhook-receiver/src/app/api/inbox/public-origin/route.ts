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
    // /ready は本文を使わない。GET で受けると本文を読み切るまで接続を掴んだままになる。
    const [readyResponse, tunnelResponse] = await Promise.all([
      fetch(`http://127.0.0.1:${port}/ready`, { method: "HEAD", signal, cache: "no-store" }),
      fetch(`http://127.0.0.1:${port}/quicktunnel`, { signal, cache: "no-store" }),
    ]);
    if (!readyResponse.ok || !tunnelResponse.ok) {
      await tunnelResponse.body?.cancel();
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
  // 番号の若いポートから順に見て、最初に応答した tunnel を採る。全ポートを毎回
  // 叩くと、cloudflared が居ないときも 2 秒ごとに 10 リクエストを投げ続けることになる。
  for (const port of METRICS_PORTS) {
    const candidate = await originFromReadyMetricsPort(port);
    if (candidate !== null) {
      return NextResponse.json(
        { origin: candidate },
        { headers: { "Cache-Control": "no-store" } }
      );
    }
  }
  return NextResponse.json({ origin: null }, { headers: { "Cache-Control": "no-store" } });
}
