import { NextResponse } from "next/server";
import { isInboxTokenValid } from "@/lib/auth";
import { listEvents, subscribe } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEARTBEAT_MS = 15_000;

export async function GET(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  if (!isInboxTokenValid(token)) {
    return NextResponse.json({ error: "invalid token" }, { status: 401 });
  }

  const encoder = new TextEncoder();
  let closed = false;
  let heartbeatId: ReturnType<typeof setInterval> | undefined;
  let unsubscribe = (): void => {};

  function cleanup(controller?: ReadableStreamDefaultController<Uint8Array>): void {
    if (closed) {
      return;
    }
    closed = true;
    if (heartbeatId !== undefined) {
      clearInterval(heartbeatId);
    }
    unsubscribe();
    if (controller === undefined) {
      return;
    }
    try {
      controller.close();
    } catch {
      // already closed
    }
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const write = (chunk: string) => {
        if (closed) {
          return;
        }
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          cleanup();
        }
      };

      write(`data: ${JSON.stringify({ type: "snapshot", events: listEvents(token) })}\n\n`);
      unsubscribe = subscribe(token, (event) => {
        write(`data: ${JSON.stringify({ type: "event", event })}\n\n`);
      });
      heartbeatId = setInterval(() => {
        write(": ping\n\n");
      }, HEARTBEAT_MS);
      request.signal.addEventListener("abort", () => {
        cleanup(controller);
      });
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
