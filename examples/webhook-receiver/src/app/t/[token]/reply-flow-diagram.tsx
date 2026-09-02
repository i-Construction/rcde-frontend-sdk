"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReplySettings } from "@/lib/store";

type Mermaid = (typeof import("mermaid"))["default"];

const RENDER_DEBOUNCE_MS = 150;

// mermaid の theme:"base" は色を khroma で計算するため CSS 変数を渡すとパースに失敗する。
// globals.css :root のトークンと同じ値をリテラルで写している（二重管理）。
const DIAGRAM_THEME_VARIABLES = {
  primaryColor: "#eff6ff", // --accent-soft
  primaryBorderColor: "#2563eb", // --accent
  primaryTextColor: "#1a1d23", // --fg
  textColor: "#1a1d23", // --fg
  lineColor: "#6b7280", // --muted
  noteBkgColor: "#f3f4f6",
  noteTextColor: "#1a1d23", // --fg
  noteBorderColor: "#e5e7eb", // --line
  fontSize: "12px",
};

let mermaidBoot: Promise<Mermaid> | null = null;
let renderSequence = 0;

function loadMermaid(): Promise<Mermaid> {
  mermaidBoot ??= import("mermaid").then(({ default: mermaid }) => {
    mermaid.initialize({
      startOnLoad: false,
      suppressErrorRendering: true,
      securityLevel: "strict",
      theme: "base",
      fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
      themeVariables: DIAGRAM_THEME_VARIABLES,
      sequence: { useMaxWidth: true, wrap: true, mirrorActors: false, actorMargin: 40 },
    });
    return mermaid;
  });
  return mermaidBoot;
}

function normalizeDelayMs(delayMs: number): number {
  return Number.isFinite(delayMs) ? Math.max(0, Math.round(delayMs)) : 0;
}

// ラベルに < > を書かない（securityLevel:"strict" の DOMPurify がタグとみなして削る）。
function replyFlowDefinition(status: ReplySettings["status"], delayMs: number): string {
  const waitNote =
    delayMs === 0 ? "token 検証の直後<br/>待ちなし" : `token 検証の直後に<br/>${delayMs} ms 待つ`;
  const afterWait = delayMs === 0 ? "すぐ" : `${delayMs} ms 後に`;
  return [
    "sequenceDiagram",
    "  autonumber",
    "  participant S as 送信元",
    "  participant R as 受信サーバ",
    "  participant M as メモリ store",
    "  participant B as ブラウザ画面",
    "  S->>R: POST /api/inbox/{token}",
    "  activate R",
    `  Note over R: ${waitNote}`,
    `  R->>M: ${afterWait}保存 receivedAt も待ち明け`,
    "  M->>B: SSE 配信 一覧に出るのも同じだけ後",
    `  R-->>S: ${status} を返す`,
    "  deactivate R",
  ].join("\n");
}

export function ReplyFlowDiagram({ settings }: { settings: ReplySettings }) {
  const delayMs = normalizeDelayMs(settings.delayMs);
  const definition = useMemo(
    () => replyFlowDefinition(settings.status, delayMs),
    [settings.status, delayMs]
  );
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timerId = window.setTimeout(() => {
      void (async () => {
        const mermaid = await loadMermaid();
        if (cancelled) {
          return;
        }
        renderSequence += 1;
        try {
          // id を毎回変える。mermaid.render は body に一時 div を作って finally で消すので、
          // 同じ id で 2 本走ると後始末が交差する。
          const rendered = await mermaid.render(`reply-flow-${renderSequence}`, definition);
          if (cancelled) {
            return;
          }
          setSvg(rendered.svg);
        } catch {
          // 図が出せなくても select / input / 一覧は無傷。古い svg も消さない。
        }
      })();
    }, RENDER_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
  }, [definition]);

  return (
    <div className="flow-diagram">
      <div
        className="flow-diagram-canvas"
        aria-hidden="true"
        dangerouslySetInnerHTML={svg === null ? undefined : { __html: svg }}
      />
      <p className="flow-diagram-caption">
        token 検証の直後に {delayMs} ms 待つので、{settings.status}{" "}
        の応答も一覧表示も同じだけ遅れる。 type が contract_file.processing.completed 以外なら 200
        固定。
      </p>
    </div>
  );
}
