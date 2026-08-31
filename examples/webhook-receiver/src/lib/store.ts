import type { ParsedEnvelope } from "./envelope";

export type ReplySettings = {
  status: 200 | 400 | 500;
  delayMs: number;
};

export type InboxEvent = {
  seq: number;
  receivedAt: string;
  method: string;
  path: string;
  headers: Record<string, string>;
  rawBody: string;
  parsed: ParsedEnvelope | null;
  eventId: string | null;
  duplicate: boolean;
  ignoredType: boolean;
};

export type InboxEventListener = (event: InboxEvent) => void;

type TokenBucket = {
  events: InboxEvent[];
  settings: ReplySettings;
  nextSeq: number;
  seenEventIds: Set<string>;
  subscribers: Set<InboxEventListener>;
};

const MAX_EVENTS = 100;

const g = globalThis as typeof globalThis & {
  __webhookInbox?: Map<string, TokenBucket>;
};

function buckets(): Map<string, TokenBucket> {
  if (g.__webhookInbox === undefined) {
    g.__webhookInbox = new Map();
  }
  return g.__webhookInbox;
}

function initialStatus(token: string): ReplySettings["status"] {
  const raw = process.env[`INBOX_REPLY_${token}`] ?? "";
  if (raw === "200" || raw === "400" || raw === "500") {
    return Number(raw) as ReplySettings["status"];
  }
  return 200;
}

function bucket(token: string): TokenBucket {
  const map = buckets();
  const existing = map.get(token);
  if (existing !== undefined) {
    existing.subscribers ??= new Set();
    return existing;
  }
  const created: TokenBucket = {
    events: [],
    settings: { status: initialStatus(token), delayMs: 0 },
    nextSeq: 1,
    seenEventIds: new Set(),
    subscribers: new Set(),
  };
  map.set(token, created);
  return created;
}

export function getSettings(token: string): ReplySettings {
  return { ...bucket(token).settings };
}

export function setSettings(token: string, next: Partial<ReplySettings>): ReplySettings {
  const current = bucket(token);
  if (next.status === 200 || next.status === 400 || next.status === 500) {
    current.settings.status = next.status;
  }
  if (typeof next.delayMs === "number" && Number.isFinite(next.delayMs)) {
    current.settings.delayMs = Math.max(0, Math.min(30_000, Math.floor(next.delayMs)));
  }
  return { ...current.settings };
}

export function rememberEvent(
  token: string,
  event: Omit<InboxEvent, "seq" | "duplicate">
): InboxEvent {
  const current = bucket(token);
  const duplicate = event.eventId !== null && current.seenEventIds.has(event.eventId);
  if (event.eventId !== null) {
    current.seenEventIds.add(event.eventId);
  }
  const stored: InboxEvent = {
    ...event,
    seq: current.nextSeq,
    duplicate,
  };
  current.nextSeq += 1;
  current.events.unshift(stored);
  if (current.events.length > MAX_EVENTS) {
    current.events.length = MAX_EVENTS;
  }
  for (const listener of [...current.subscribers]) {
    try {
      listener(stored);
    } catch {
      current.subscribers.delete(listener);
    }
  }
  return stored;
}

export function subscribe(token: string, listener: InboxEventListener): () => void {
  const current = bucket(token);
  current.subscribers.add(listener);
  return () => {
    current.subscribers.delete(listener);
  };
}

export function listEvents(token: string): InboxEvent[] {
  return bucket(token).events;
}

export function removeEvent(token: string, seq: number): boolean {
  const current = bucket(token);
  const index = current.events.findIndex((event) => event.seq === seq);
  if (index < 0) {
    return false;
  }
  const [removed] = current.events.splice(index, 1);
  if (
    removed.eventId !== null &&
    !current.events.some((event) => event.eventId === removed.eventId)
  ) {
    current.seenEventIds.delete(removed.eventId);
  }
  return true;
}
