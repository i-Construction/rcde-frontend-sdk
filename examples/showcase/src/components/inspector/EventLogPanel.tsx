"use client";

import { useEffect } from "react";
import { ViewerBridge, type Command } from "@i-con/frontend-sdk";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useWorkspace, type EventLogEntry } from "@/components/workspace/WorkspaceProvider";
import { formatJson, formatTime } from "@/lib/format";

/** `kind` ごとにバッジの色を変えて、ログの種別を一目で分かるようにする。 */
const KIND_VARIANTS: Record<
  EventLogEntry["kind"],
  "default" | "secondary" | "outline" | "destructive" | "success" | "warning"
> = {
  click: "default",
  hover: "secondary",
  bridge: "outline",
  info: "secondary",
};

const KIND_LABELS: Record<EventLogEntry["kind"], string> = {
  click: "クリック",
  hover: "ホバー",
  bridge: "Bridge",
  info: "情報",
};

/**
 * イベントログパネル。
 *
 * クリック / ホバーのログは Viewer の `onObjectClick` / `onObjectHover` から記録されている。
 * `ViewerHoverEvent` は「ホバー対象が変わったときのみ」発火するので、同じオブジェクト上で
 * カーソルを動かし続けても追加のイベントは出ない（対象から外れると `hit: false` が 1 回届く）。
 *
 * このパネル自身は `ViewerBridge.addListener` のデモを担当し、
 * `RCDE_VIEWER_CMD` チャンネルに流れたコマンドを傍受してログに残す。
 */
export function EventLogPanel() {
  const { events, pushEvent, clearEvents } = useWorkspace();

  useEffect(() => {
    // `addListener` は `window.addEventListener("message", ...)` の解除関数を返す。
    // 登録しっぱなしにするとリスナーが増え続けるため、必ずクリーンアップで呼ぶ。
    // `Command` は type で判別するユニオン。SDK 側で種類が増えたらここが型エラーになる。
    const unsubscribe = ViewerBridge.addListener((cmd: Command) => {
      if (cmd.type === "SET_TRANSFORM") {
        pushEvent({
          kind: "bridge",
          label: "SET_TRANSFORM",
          detail: formatJson(cmd.payload),
        });
        return;
      }
      if (cmd.type === "SET_APPEARANCE") {
        pushEvent({
          kind: "bridge",
          label: "SET_APPEARANCE",
          detail: formatJson(cmd.payload),
        });
        return;
      }
      // RESET には payload がないため、detail は付けない。
      pushEvent({ kind: "bridge", label: "RESET" });
    });

    return () => {
      unsubscribe();
    };
  }, [pushEvent]);

  return (
    <div className="flex flex-col gap-4">
      <Alert>
        <AlertTitle className="text-xs">記録しているイベント</AlertTitle>
        <AlertDescription className="text-xs">
          <p>
            クリック / ホバーは Viewer の `onObjectClick` / `onObjectHover` から記録しています。
            ホバーは対象が変わったときだけ発火するため、同一オブジェクト上でのカーソル移動では
            イベントが増えません。
          </p>
          <p>
            Bridge は `ViewerBridge.addListener` で `RCDE_VIEWER_CMD`
            チャンネルを傍受したコマンドです。
          </p>
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs">{events.length} 件（新しい順・最大 60 件）</p>
        <Button
          size="sm"
          variant="outline"
          className="text-xs"
          onClick={clearEvents}
          disabled={events.length === 0}
        >
          クリア
        </Button>
      </div>

      <Separator />

      {events.length === 0 ? (
        <p className="text-muted-foreground text-xs">
          点群をクリック / ホバーしたり、Transform や表示設定を適用するとログが増えます。
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {events.map((event) => (
            <li key={event.id} className="rounded border p-2">
              <div className="flex items-center gap-1.5">
                <Badge variant={KIND_VARIANTS[event.kind]}>{KIND_LABELS[event.kind]}</Badge>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {formatTime(event.at)}
                </span>
              </div>
              <p className="mt-1 text-xs font-medium break-words">{event.label}</p>
              {event.detail !== undefined && (
                <pre className="bg-muted mt-1 max-h-32 overflow-auto rounded p-2 text-xs">
                  {event.detail}
                </pre>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="text-muted-foreground text-xs">
        ログは WorkspaceProvider 側で 60
        件に制限されており、上限を超えると古いものから破棄されます。
      </p>
    </div>
  );
}
