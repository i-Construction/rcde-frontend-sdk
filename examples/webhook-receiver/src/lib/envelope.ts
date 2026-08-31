export const COMPLETED_TYPE = "contract_file.processing.completed";

const TOP_LEVEL_KEYS = ["id", "type", "createdAt", "data"] as const;
const SIGNATURE_HEADER_NAMES = ["x-rcde-signature", "x-webhook-signature", "stripe-signature"];

export type WireEnvelope = {
  id?: unknown;
  type?: unknown;
  createdAt?: unknown;
  data?: {
    contractFileId?: unknown;
    constructionId?: unknown;
  };
};

export type ParsedEnvelope = {
  id: string | null;
  type: string | null;
  createdAt: string | null;
  contractFileId: number | null;
  constructionId: number | null;
};

export type EnvelopeAssessmentInput = {
  parsed: ParsedEnvelope | null;
  headers: Record<string, string>;
  rawBody: string;
};

export type EnvelopeCheckRow = {
  id: string;
  ok: boolean;
  kind: "required" | "info";
  label: string;
};

export type EnvelopeAssessment = {
  pass: boolean;
  rows: EnvelopeCheckRow[];
};

function asString(candidate: unknown): string | null {
  if (typeof candidate === "string" && candidate !== "") {
    return candidate;
  }
  if (typeof candidate === "number" && Number.isFinite(candidate)) {
    return String(candidate);
  }
  return null;
}

function asPositiveInt(candidate: unknown): number | null {
  if (typeof candidate === "number" && Number.isInteger(candidate) && candidate > 0) {
    return candidate;
  }
  if (typeof candidate === "string" && /^\d+$/.test(candidate)) {
    return Number(candidate);
  }
  return null;
}

export function parseEnvelope(body: unknown): ParsedEnvelope | null {
  if (body === null || typeof body !== "object") {
    return null;
  }
  const wire = body as WireEnvelope;
  const payload = wire.data;
  return {
    id: asString(wire.id),
    type: asString(wire.type),
    createdAt: asString(wire.createdAt),
    contractFileId: asPositiveInt(payload?.contractFileId),
    constructionId: asPositiveInt(payload?.constructionId),
  };
}

export function headerEventId(headers: Headers): string | null {
  return headers.get("x-rcde-event-id");
}

export function assessCompletedEnvelope(input: EnvelopeAssessmentInput): EnvelopeAssessment {
  const body = parseRawObject(input.rawBody);
  const rows = [
    checkJsonObject(body),
    checkTopLevelKeys(body),
    checkCompletedType(input.parsed),
    checkEventId(input.parsed),
    checkCreatedAt(input.parsed),
    checkContractFileId(input.parsed),
    checkHeaderMatchesBodyId(input.headers, input.parsed),
    checkContentType(input.headers),
    checkNoSignatureHeaders(input.headers),
    constructionIdInfo(body),
  ];
  const pass = rows.filter((row) => row.kind === "required").every((row) => row.ok);
  return { pass, rows };
}

function parseRawObject(rawBody: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = rawBody === "" ? null : JSON.parse(rawBody);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function headerValue(headers: Record<string, string>, name: string): string | null {
  const wanted = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === wanted && value !== "") {
      return value;
    }
  }
  return null;
}

function checkJsonObject(body: Record<string, unknown> | null): EnvelopeCheckRow {
  return {
    id: "json-object",
    ok: body !== null,
    kind: "required",
    label: body === null ? "本文が JSON オブジェクトでない" : "本文が JSON オブジェクト",
  };
}

function checkTopLevelKeys(body: Record<string, unknown> | null): EnvelopeCheckRow {
  if (body === null) {
    return {
      id: "top-level-keys",
      ok: false,
      kind: "required",
      label: "トップレベルキーを判定できない",
    };
  }
  const actual = Object.keys(body).sort();
  const expected = [...TOP_LEVEL_KEYS].sort();
  const ok =
    actual.length === expected.length && actual.every((key, index) => key === expected[index]);
  return {
    id: "top-level-keys",
    ok,
    kind: "required",
    label: ok
      ? "トップレベルは id / type / createdAt / data"
      : `トップレベルキーが違う: ${actual.join(", ") || "(empty)"}`,
  };
}

function checkCompletedType(parsed: ParsedEnvelope | null): EnvelopeCheckRow {
  const ok = parsed?.type === COMPLETED_TYPE;
  return {
    id: "type",
    ok,
    kind: "required",
    label: ok ? `type が ${COMPLETED_TYPE}` : `type が ${COMPLETED_TYPE} ではない`,
  };
}

function checkEventId(parsed: ParsedEnvelope | null): EnvelopeCheckRow {
  const ok = parsed?.id !== null && parsed?.id !== undefined;
  return {
    id: "body-id",
    ok,
    kind: "required",
    label: ok ? "本文 id がある" : "本文 id が無い",
  };
}

function checkCreatedAt(parsed: ParsedEnvelope | null): EnvelopeCheckRow {
  const ok = parsed?.createdAt !== null && parsed?.createdAt !== undefined;
  return {
    id: "created-at",
    ok,
    kind: "required",
    label: ok ? "createdAt がある" : "createdAt が無い",
  };
}

function checkContractFileId(parsed: ParsedEnvelope | null): EnvelopeCheckRow {
  const ok = parsed?.contractFileId !== null && parsed?.contractFileId !== undefined;
  return {
    id: "contract-file-id",
    ok,
    kind: "required",
    label: ok ? "data.contractFileId が正の整数" : "data.contractFileId が正の整数ではない",
  };
}

function checkHeaderMatchesBodyId(
  headers: Record<string, string>,
  parsed: ParsedEnvelope | null
): EnvelopeCheckRow {
  const headerId = headerValue(headers, "x-rcde-event-id");
  if (headerId === null) {
    return {
      id: "header-event-id",
      ok: false,
      kind: "required",
      label: "X-RCDE-Event-Id が無い",
    };
  }
  const ok = parsed?.id === headerId;
  return {
    id: "header-event-id",
    ok,
    kind: "required",
    label: ok ? "X-RCDE-Event-Id が本文 id と一致" : "X-RCDE-Event-Id が本文 id と一致しない",
  };
}

function checkContentType(headers: Record<string, string>): EnvelopeCheckRow {
  const contentType = headerValue(headers, "content-type");
  const ok = contentType !== null && contentType.toLowerCase().includes("application/json");
  return {
    id: "content-type",
    ok,
    kind: "required",
    label: ok ? "Content-Type が JSON" : "Content-Type が JSON ではない",
  };
}

function checkNoSignatureHeaders(headers: Record<string, string>): EnvelopeCheckRow {
  const present = SIGNATURE_HEADER_NAMES.filter((name) => headerValue(headers, name) !== null);
  const ok = present.length === 0;
  return {
    id: "no-signature",
    ok,
    kind: "required",
    label: ok ? "署名ヘダが無い" : `署名ヘダがある: ${present.join(", ")}`,
  };
}

function constructionIdInfo(body: Record<string, unknown> | null): EnvelopeCheckRow {
  const payload = body?.data;
  const hasKey =
    payload !== null &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    "constructionId" in payload;
  return {
    id: "construction-id",
    ok: true,
    kind: "info",
    label: hasKey
      ? "data.constructionId あり"
      : "data.constructionId なし（オプショナルなので不整合ではない）",
  };
}
