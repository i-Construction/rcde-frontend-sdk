"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { assessCompletedEnvelope } from "@/lib/envelope";
import type { InboxEvent, ReplySettings } from "@/lib/store";
import { ReplyFlowDiagram } from "./reply-flow-diagram";

type Props = { token: string };

const PUBLIC_ORIGIN_KEY = "inboxPublicOrigin";
const MAX_LIST_EVENTS = 100;
const TUNNEL_POLL_MS = 2_000;

function postUrl(origin: string, token: string): string {
  return `${origin}/api/inbox/${token}`;
}

function isPublicPostOrigin(origin: string): boolean {
  try {
    const parsed = new URL(origin);
    if (parsed.protocol !== "https:") {
      return false;
    }
    return parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1";
  } catch {
    return false;
  }
}

function originFromInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return null;
  }
  try {
    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(withScheme);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    if (parsed.hostname === "") {
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
}

function publicOriginFromInput(raw: string): string | null {
  const parsed = originFromInput(raw);
  if (parsed === null || !isPublicPostOrigin(parsed)) {
    return null;
  }
  return parsed;
}

function formatTime(iso: string): string {
  const received = new Date(iso);
  if (Number.isNaN(received.getTime())) {
    return iso;
  }
  return received.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function prettyBody(rawBody: string): string {
  try {
    return JSON.stringify(JSON.parse(rawBody), null, 2);
  } catch {
    return rawBody === "" ? "(empty)" : rawBody;
  }
}

function EnvelopeChecks({ event }: { event: InboxEvent }) {
  const assessment = assessCompletedEnvelope(event);
  return (
    <>
      <h2>整合</h2>
      <ul className="checks">
        {assessment.rows.map((row) => (
          <li
            key={row.id}
            className={row.kind === "info" ? "check-info" : row.ok ? "check-ok" : "check-fail"}
          >
            {row.kind === "info" ? "情報" : row.ok ? "OK" : "NG"} {row.label}
          </li>
        ))}
      </ul>
    </>
  );
}

function EnvelopeBadge({ event }: { event: InboxEvent }) {
  const pass = assessCompletedEnvelope(event).pass;
  return <span className={pass ? "badge pass" : "badge fail"}>{pass ? "整合" : "不整合"}</span>;
}

function parseStreamMessage(
  raw: string
): { type: "snapshot"; events: InboxEvent[] } | { type: "event"; event: InboxEvent } | null {
  try {
    const parsed = JSON.parse(raw) as { type?: unknown; events?: unknown; event?: unknown };
    if (parsed.type === "snapshot" && Array.isArray(parsed.events)) {
      return { type: "snapshot", events: parsed.events as InboxEvent[] };
    }
    if (parsed.type === "event" && parsed.event !== null && typeof parsed.event === "object") {
      return { type: "event", event: parsed.event as InboxEvent };
    }
    return null;
  } catch {
    return null;
  }
}

function LucideIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <LucideIcon>
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </LucideIcon>
  );
}

function MailboxIcon() {
  return (
    <LucideIcon>
      <path d="M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5C2 7 4 5 6.5 5H18c2.2 0 4 1.8 4 4v8Z" />
      <polyline points="15,9 18,9 18,11" />
      <path d="M6.5 5C9 5 11 7 11 9.5V17a2 2 0 0 1-2 2" />
      <line x1="6" x2="7" y1="10" y2="10" />
    </LucideIcon>
  );
}

function TimerIcon() {
  return (
    <LucideIcon>
      <line x1="10" x2="14" y1="2" y2="2" />
      <line x1="12" x2="15" y1="14" y2="11" />
      <circle cx="12" cy="14" r="8" />
    </LucideIcon>
  );
}

function TrashIcon() {
  return (
    <LucideIcon>
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </LucideIcon>
  );
}

function CopyPostUrlButton({ url, enabled }: { url: string; enabled: boolean }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setCopied(false);
    }, 1500);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copied]);

  async function copyPostUrl() {
    if (!enabled) {
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      className={copied ? "copy-url copied" : "copy-url"}
      disabled={!enabled}
      onClick={() => {
        void copyPostUrl();
      }}
      aria-label={
        copied ? "コピーした" : enabled ? "POST 先をコピー" : "公開 URL が無いのでコピーできない"
      }
    >
      {copied ? (
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20 6 9 17l-5-5"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <rect
            x="9"
            y="9"
            width="13"
            height="13"
            rx="2"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
          />
        </svg>
      )}
    </button>
  );
}

function PublicOriginInput({ token }: { token: string }) {
  const [publicOrigin, setPublicOrigin] = useState("");
  // 入力中だけ下書きを持つ。null は「publicOrigin をそのまま出す」。
  const [editingDraft, setEditingDraft] = useState<string | null>(null);
  // tunnel から入れた値。手で貼ったら null にして、以後ポーリングに上書きさせない。
  const tunnelOriginRef = useRef<string | null>(null);
  const publicOriginRef = useRef("");
  const url = publicOrigin === "" ? "" : postUrl(publicOrigin, token);
  const draft = editingDraft ?? url;
  const copyEnabled = isPublicPostOrigin(publicOrigin);

  useEffect(() => {
    let cancelled = false;

    function applyStoredOrigin() {
      const stored = window.localStorage.getItem(PUBLIC_ORIGIN_KEY);
      if (stored === null) {
        return;
      }
      const parsed = publicOriginFromInput(stored);
      if (parsed === null) {
        window.localStorage.removeItem(PUBLIC_ORIGIN_KEY);
        return;
      }
      if (cancelled) {
        return;
      }
      // 前回 tunnel から拾って保存した値なので、新しい tunnel が見つかれば入れ替えてよい。
      tunnelOriginRef.current = parsed;
      publicOriginRef.current = parsed;
      setPublicOrigin(parsed);
    }

    async function applyLiveTunnel() {
      try {
        const response = await fetch("/api/inbox/public-origin", { cache: "no-store" });
        if (!response.ok || cancelled) {
          return;
        }
        const body = (await response.json()) as { origin?: unknown };
        if (typeof body.origin !== "string") {
          return;
        }
        const parsed = publicOriginFromInput(body.origin);
        if (parsed === null || cancelled) {
          return;
        }
        const current = publicOriginRef.current;
        if (current !== "" && current !== tunnelOriginRef.current) {
          // 手で貼った値。tunnel が生きていても上書きしない。
          return;
        }
        tunnelOriginRef.current = parsed;
        publicOriginRef.current = parsed;
        setPublicOrigin(parsed);
        window.localStorage.setItem(PUBLIC_ORIGIN_KEY, parsed);
      } catch {
        // tunnel 未起動
      }
    }

    void (async () => {
      applyStoredOrigin();
      await applyLiveTunnel();
    })();
    const intervalId = window.setInterval(() => {
      // 見えていない間は cloudflared のメトリクスポートを叩かない。
      if (document.visibilityState === "hidden") {
        return;
      }
      void applyLiveTunnel();
    }, TUNNEL_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  function commitDraft(raw: string) {
    const parsed = publicOriginFromInput(raw);
    // 手入力を正とし、以後のポーリングでは戻さない。
    tunnelOriginRef.current = null;
    publicOriginRef.current = parsed ?? "";
    setPublicOrigin(parsed ?? "");
    setEditingDraft(null);
    if (parsed === null) {
      window.localStorage.removeItem(PUBLIC_ORIGIN_KEY);
      return;
    }
    window.localStorage.setItem(PUBLIC_ORIGIN_KEY, parsed);
  }

  return (
    <div className="url-row">
      <input
        className="url"
        value={draft}
        placeholder={`https://xxxx.trycloudflare.com/api/inbox/${token}`}
        aria-label="POST 先"
        spellCheck={false}
        onChange={(e) => {
          setEditingDraft(e.target.value);
        }}
        onBlur={(e) => {
          commitDraft(e.currentTarget.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur();
          }
        }}
      />
      <CopyPostUrlButton url={url} enabled={copyEnabled} />
    </div>
  );
}

export function InboxClient({ token }: Props) {
  const [events, setEvents] = useState<InboxEvent[]>([]);
  const [settings, setSettings] = useState<ReplySettings>({ status: 200, delayMs: 0 });
  const [selectedSeq, setSelectedSeq] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  // 入力中だけ下書きを持つ。null は「settings.delayMs をそのまま出す」。
  const [delayDraft, setDelayDraft] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const settingsResponse = await fetch(`/api/inbox/${token}/settings`);
        if (!settingsResponse.ok || cancelled) {
          return;
        }
        setSettings((await settingsResponse.json()) as ReplySettings);
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : String(err));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    const source = new EventSource(`/api/inbox/${token}/stream`);
    source.onopen = () => {
      setLoadError(null);
    };
    source.onmessage = (message) => {
      const parsed = parseStreamMessage(message.data);
      if (parsed === null) {
        return;
      }
      if (parsed.type === "snapshot") {
        setEvents(parsed.events);
        return;
      }
      setEvents((prev) => {
        if (prev.some((item) => item.seq === parsed.event.seq)) {
          return prev;
        }
        return [parsed.event, ...prev].slice(0, MAX_LIST_EVENTS);
      });
    };
    return () => {
      source.close();
    };
  }, [token]);

  const selected = events.find((event) => event.seq === selectedSeq) ?? events[0];
  const latestSeq = events[0]?.seq;

  async function saveSettings(next: Partial<ReplySettings>) {
    const settingsResponse = await fetch(`/api/inbox/${token}/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    if (settingsResponse.ok) {
      setSettings((await settingsResponse.json()) as ReplySettings);
    }
  }

  async function deleteEvent(seq: number) {
    const deleteResponse = await fetch(`/api/inbox/${token}/events?seq=${seq}`, {
      method: "DELETE",
    });
    if (!deleteResponse.ok) {
      return;
    }
    setEvents((prev) => prev.filter((item) => item.seq !== seq));
  }

  return (
    <div className="shell">
      <header className="top">
        <div>
          <Link href="/" className="back">
            <ArrowLeftIcon />
            URL一覧
          </Link>
          <h1>RCDE webhook inbox</h1>
          <p className="muted">R-CDE に登録する通知先 URL</p>
          <PublicOriginInput token={token} />
        </div>
        <div className="controls">
          <label>
            次の応答
            <select
              value={settings.status}
              onChange={(e) => {
                void saveSettings({ status: Number(e.target.value) as ReplySettings["status"] });
              }}
            >
              <option value={200}>200</option>
              <option value={400}>400</option>
              <option value={500}>500</option>
            </select>
          </label>
          <label>
            遅延 ms
            <input
              type="number"
              min={0}
              max={30000}
              value={delayDraft ?? settings.delayMs}
              onChange={(e) => {
                setDelayDraft(e.target.value);
              }}
              onBlur={(e) => {
                const next = Number(e.currentTarget.value);
                setDelayDraft(null);
                if (Number.isFinite(next) && e.currentTarget.value !== "") {
                  void saveSettings({ delayMs: next });
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                }
              }}
            />
          </label>
          <ReplyFlowDiagram settings={settings} />
          <p className="hint">4xx/5xx はここで切り替え。timeout はサーバ停止。</p>
        </div>
      </header>
      {loadError !== null ? <p className="error">{loadError}</p> : null}
      <div className="split">
        <section>
          <h2 className="section-heading">
            <MailboxIcon />
            受信一覧
          </h2>
          <ol className="list">
            {events.length === 0 ? <li className="empty">まだ受信なし</li> : null}
            {events.map((event) => (
              <li
                key={event.seq}
                className={selected?.seq === event.seq ? "list-item active" : "list-item"}
              >
                <button
                  className="row"
                  type="button"
                  onClick={() => {
                    setSelectedSeq(event.seq);
                  }}
                >
                  <span className="row-time">
                    <TimerIcon />
                    {formatTime(event.receivedAt)}
                  </span>
                  <span className="row-meta">
                    {event.method} {event.eventId ?? "(no event id)"}
                  </span>
                  <span className="badges">
                    {event.seq === latestSeq ? <span className="badge latest">最新</span> : null}
                    <EnvelopeBadge event={event} />
                    {event.duplicate ? <span className="badge duplicate">重複</span> : null}
                    {event.ignoredType ? <span className="badge">無視</span> : null}
                  </span>
                </button>
                <button
                  className="row-delete"
                  type="button"
                  aria-label="削除"
                  onClick={() => {
                    void deleteEvent(event.seq);
                  }}
                >
                  <TrashIcon />
                </button>
              </li>
            ))}
          </ol>
        </section>
        {selected !== undefined ? (
          <article className="detail">
            <EnvelopeChecks event={selected} />
            <h2>生 JSON</h2>
            <pre className="json">{prettyBody(selected.rawBody)}</pre>
            <h3>ヘッダ</h3>
            <div className="headers">
              <div>
                X-RCDE-Event-Id: {selected.headers["x-rcde-event-id"] ?? selected.eventId ?? "—"}
              </div>
              <div>Content-Type: {selected.headers["content-type"] ?? "—"}</div>
            </div>
          </article>
        ) : (
          <article className="detail">
            <h2>生 JSON</h2>
            <p className="muted">受信するとここに出る</p>
          </article>
        )}
      </div>
    </div>
  );
}
