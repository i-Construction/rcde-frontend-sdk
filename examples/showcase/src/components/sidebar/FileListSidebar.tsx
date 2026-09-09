"use client";

import { useCallback, useEffect, useMemo } from "react";
import { Crosshair, Download, Eye, EyeOff, Layers, Loader2, RefreshCw, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  BATCH_PROCESSING_STATUS,
  deriveFileStatus,
  isBatchProcessingStatus,
  isFileStatusActive,
  isPclodCompleted,
  useContractFileActions,
  useContractFiles,
  type BatchProcessingResult,
  type BatchProcessingStatus,
  type ContractFile,
  type ContractFileActions,
  type ContractFileContainer,
  type ContractFileRow,
  type ContractFiles,
  type FileStatus,
  type PclodStatus,
  type UploadStatus,
} from "@i-con/frontend-sdk";
import { useWorkspace } from "@/components/workspace/WorkspaceProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatJson, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

/** 処理中ファイルがあるときに一覧を再取得する間隔。 */
const POLL_INTERVAL_MS = 10000;

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning";

/** `FileStatus.upload` の 2 値。SDK は状態値を返すので、表示ラベルはアプリ側で持つ。 */
const UPLOAD_STATUS_LABELS: Record<UploadStatus, string> = {
  uploading: "アップロード中",
  uploaded: "完了",
};

const UPLOAD_BADGE_VARIANT: Record<UploadStatus, BadgeVariant> = {
  uploading: "warning",
  uploaded: "success",
};

/** `FileStatus.pclod` の 6 値。 */
const PCLOD_STATUS_LABELS: Record<PclodStatus, string> = {
  none: "-",
  waiting: "待機中",
  processing: "処理中",
  completed: "完了",
  failed: "失敗",
  unknown: "不明",
};

const PCLOD_BADGE_VARIANT: Record<PclodStatus, BadgeVariant> = {
  // アップロード中の行は PCLOD 判定自体が行えないため none になる
  none: "secondary",
  waiting: "warning",
  processing: "warning",
  completed: "success",
  failed: "destructive",
  // batchProcessingResult.status が RCDE 既知値(1|2|3|4)以外だったケース。異常系なので目立たせる
  unknown: "destructive",
};

/** `BATCH_PROCESSING_STATUS` の 4 値に対応する日本語ラベル。 */
const BATCH_STATUS_LABELS: Record<BatchProcessingStatus, string> = {
  [BATCH_PROCESSING_STATUS.start]: "開始",
  [BATCH_PROCESSING_STATUS.inProgress]: "進行中",
  [BATCH_PROCESSING_STATUS.finish]: "完了",
  [BATCH_PROCESSING_STATUS.failed]: "失敗",
};

/**
 * 行の種別に依らず同じ形でステータスを取り出す。
 *
 * `pending` 行は `ContractFile` を持たないが、`getFileStatus` に
 * `{ id, name }` だけを渡せば登録済み行と同じ `FileStatus` が得られる。
 */
function getRowStatus(actions: ContractFileActions, row: ContractFileRow): FileStatus {
  return row.type === "pending"
    ? actions.getFileStatus({ id: row.contractFileId, name: row.name })
    : actions.getFileStatus(row.container.file);
}

export function FileListSidebar({ onOpenUpload }: { onOpenUpload: () => void }) {
  const {
    pendingUploads,
    selectedFileId,
    setSelectedFileId,
    customFileLayerFileId,
    setCustomFileLayerFileId,
    requestRefetch,
    pushEvent,
  } = useWorkspace();

  // `pendingUploads` は WorkspaceProvider 側で `useState` 管理されており参照が安定している。
  // `useContractFileActions({ ... })` のようにレンダーごとに新しいリテラルを渡すと
  // フック内部の `rows` / `getFileStatus` / 戻り値オブジェクトのメモ化が毎回無効になり、
  // 利用側の `useMemo` / `useEffect` の依存配列まで毎レンダー再評価されてしまう。
  const actions = useContractFileActions(pendingUploads);

  // `useContractFiles` は SDK が公開するコンテキストフック。
  // `useContractFileActions` は内部でこれを使っているが、一覧の一括操作
  // （`load` / `updateFiles`）はフック経由では露出しないため直接呼ぶ。
  const { containers, load, updateFiles } = useContractFiles();

  // 「処理中（= ポーリング対象）」の行数。`isFileStatusActive` の実用的な使い道は
  // まさにこれで、アップロード中・PCLOD 待機/処理中の行が残っている間だけ
  // 一覧を再取得し、全て落ち着いたらポーリングを止める、という制御に使う。
  const activeRowCount = useMemo(
    () => actions.rows.filter((row) => isFileStatusActive(getRowStatus(actions, row))).length,
    [actions]
  );

  useEffect(() => {
    if (activeRowCount === 0) {
      return;
    }
    const timerId = window.setInterval(() => {
      requestRefetch();
    }, POLL_INTERVAL_MS);
    return () => {
      window.clearInterval(timerId);
    };
  }, [activeRowCount, requestRefetch]);

  const handleFocus = useCallback(
    async (file: ContractFile) => {
      // `focusFile` は成功可否を boolean で返す（対象なし・PCLOD 未完了・失敗で false）。
      // 例外を投げないので、戻り値を必ず判定してユーザーに結果を伝える。
      const focused = await actions.focusFile(file);
      if (focused) {
        toast.success("基準点を移動しました");
      } else {
        toast.error("フォーカスできませんでした");
      }
      pushEvent({
        kind: "info",
        label: `focusFile: ${focused ? "成功" : "失敗"}`,
        detail: file.name,
      });
    },
    [actions, pushEvent]
  );

  const handleDownload = useCallback(
    async (file: ContractFile) => {
      // `downloadFile` も boolean を返す（署名付きURLの取得失敗・無効URLで false）。
      const opened = await actions.downloadFile(file);
      if (opened) {
        toast.success("ダウンロードを開始しました");
      } else {
        toast.error("ダウンロードできませんでした");
      }
      pushEvent({
        kind: "info",
        label: `downloadFile: ${opened ? "成功" : "失敗"}`,
        detail: file.name,
      });
    },
    [actions, pushEvent]
  );

  // `ContractFiles` は `ContractFile[]` のエイリアス。`load` / `updateFiles` の引数型。
  const files = useMemo<ContractFiles>(
    () => containers.map((container) => container.file),
    [containers]
  );

  const handleShowAll = useCallback(() => {
    // `load(files)` は visibleIds を省略すると全件 visible: true で再構築する。
    load(files);
    pushEvent({ kind: "info", label: "useContractFiles.load（全表示）" });
  }, [files, load, pushEvent]);

  const handleHideAll = useCallback(() => {
    // visibleIds に空配列を渡すと全件 visible: false になる。
    load(files, []);
    pushEvent({ kind: "info", label: "useContractFiles.load（全非表示）" });
  }, [files, load, pushEvent]);

  const handleUpdateFiles = useCallback(() => {
    // `updateFiles(files)` は既存の表示状態を fileId 単位で引き継いだまま
    // ファイル情報だけを差し替える（`load` との違いはここ）。
    updateFiles(files);
    pushEvent({ kind: "info", label: "useContractFiles.updateFiles（表示状態を保持）" });
  }, [files, updateFiles, pushEvent]);

  const selectedContainer = useMemo<ContractFileContainer | undefined>(
    () => containers.find((container) => container.file.id === selectedFileId),
    [containers, selectedFileId]
  );
  const selectedFile = selectedContainer?.file;

  return (
    <TooltipProvider>
      <div className="bg-sidebar flex h-full w-full flex-col overflow-hidden border-r">
        {/* ヘッダー: 件数表示と一覧の再取得 / アップロード起動 */}
        <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2">
          <h2 className="text-sm font-semibold">ファイル</h2>
          <Badge variant="outline">{formatNumber(actions.rows.length)} 件</Badge>
          {activeRowCount > 0 && (
            <Badge variant="warning">
              <Loader2 className="animate-spin" />
              処理中 {formatNumber(activeRowCount)}
            </Badge>
          )}
          <div className="ml-auto flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" onClick={requestRefetch}>
                  <RefreshCw />
                  <span className="sr-only">再取得</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>一覧を再取得（contractFilesRefetchKey を更新）</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary" size="icon-sm" onClick={onOpenUpload}>
                  <Upload />
                  <span className="sr-only">アップロード</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>点群ファイルをアップロード</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* 一覧本体: actions.rows をそのままループする */}
        <div className="flex-1 overflow-y-auto">
          {actions.rows.length === 0 && (
            <p className="text-muted-foreground px-3 py-6 text-center text-xs">
              ファイルがありません。再取得するか、アップロードしてください。
            </p>
          )}

          {actions.rows.map((row) => {
            if (row.type === "pending") {
              // アップロード API が contractFileId を返した直後の行。
              // 一覧 API にはまだ現れないため、表示・フォーカス・ダウンロードは行えない。
              const status = getRowStatus(actions, row);
              return (
                <div
                  key={`pending-${row.contractFileId}`}
                  className="border-b px-3 py-2 opacity-70"
                >
                  <div className="flex items-center gap-1.5">
                    <Loader2 className="size-3.5 shrink-0 animate-spin" />
                    <span className="truncate text-sm font-medium">{row.name}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    <Badge variant={UPLOAD_BADGE_VARIANT[status.upload]}>
                      アップロード: {UPLOAD_STATUS_LABELS[status.upload]}
                    </Badge>
                    <Badge variant={PCLOD_BADGE_VARIANT[status.pclod]}>
                      PCLOD: {PCLOD_STATUS_LABELS[status.pclod]}
                    </Badge>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1">
                    <Button variant="ghost" size="icon-sm" disabled>
                      <EyeOff />
                      <span className="sr-only">表示切替（不可）</span>
                    </Button>
                    <Button variant="ghost" size="icon-sm" disabled>
                      <Crosshair />
                      <span className="sr-only">フォーカス（不可）</span>
                    </Button>
                    <Button variant="ghost" size="icon-sm" disabled>
                      <Download />
                      <span className="sr-only">ダウンロード（不可）</span>
                    </Button>
                  </div>
                </div>
              );
            }

            const { file, visible } = row.container;
            const status = getRowStatus(actions, row);
            // PCLOD が完了していないファイルはタイル取得ができないため、
            // 表示・フォーカスは無効化する。
            const canView = actions.isPclodCompleted(file);
            const isSelected = file.id === selectedFileId;
            const isCustomLayerTarget = file.id === customFileLayerFileId;

            return (
              <div
                key={file.id}
                className={cn(
                  "border-b px-3 py-2",
                  isSelected && "bg-sidebar-accent ring-sidebar-ring ring-1 ring-inset"
                )}
              >
                {/* 行クリックで選択。選択中ファイルは Viewer 側の selectedFileId に反映される */}
                <button
                  type="button"
                  className="w-full truncate text-left text-sm font-medium"
                  onClick={() => {
                    setSelectedFileId(file.id);
                    pushEvent({ kind: "info", label: "ファイル選択", detail: file.name });
                  }}
                >
                  {file.name}
                </button>

                <div className="mt-1 flex flex-wrap items-center gap-1">
                  <Badge variant={UPLOAD_BADGE_VARIANT[status.upload]}>
                    アップロード: {UPLOAD_STATUS_LABELS[status.upload]}
                  </Badge>
                  <Badge variant={PCLOD_BADGE_VARIANT[status.pclod]}>
                    PCLOD: {PCLOD_STATUS_LABELS[status.pclod]}
                  </Badge>
                  {visible && <Badge variant="outline">表示中</Badge>}
                  {isCustomLayerTarget && <Badge variant="default">カスタム描画</Badge>}
                </div>

                <div className="mt-1.5 flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={!canView}
                        onClick={() => {
                          actions.toggleVisibility(row.container);
                          pushEvent({
                            kind: "info",
                            label: `toggleVisibility: ${visible ? "非表示" : "表示"}`,
                            detail: file.name,
                          });
                        }}
                      >
                        {visible ? <Eye /> : <EyeOff />}
                        <span className="sr-only">表示/非表示</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {canView ? "表示/非表示を切り替え" : "PCLOD 未完了のため表示できません"}
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={!canView}
                        onClick={() => {
                          void handleFocus(file);
                        }}
                      >
                        <Crosshair />
                        <span className="sr-only">フォーカス</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {canView
                        ? "バウンディングボックス中心へ基準点を移動"
                        : "PCLOD 未完了のためフォーカスできません"}
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          void handleDownload(file);
                        }}
                      >
                        <Download />
                        <span className="sr-only">ダウンロード</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>署名付きURLを取得して別タブで開く</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isCustomLayerTarget ? "default" : "ghost"}
                        size="icon-sm"
                        className="ml-auto"
                        onClick={() => {
                          // `ContractFileView` を自前で描画するレイヤーの対象を切り替える
                          const nextId = isCustomLayerTarget ? undefined : file.id;
                          setCustomFileLayerFileId(nextId);
                          pushEvent({
                            kind: "info",
                            label: `カスタム描画: ${nextId === undefined ? "解除" : "設定"}`,
                            detail: file.name,
                          });
                        }}
                      >
                        <Layers />
                        <span className="sr-only">カスタム描画</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>ContractFileView を自前描画する対象に切り替え</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            );
          })}
        </div>

        {/* フッター: useContractFiles / ステータスユーティリティの直接呼び出しデモ */}
        <div className="max-h-[48%] shrink-0 space-y-2 overflow-y-auto border-t p-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">useContractFiles の直接利用</CardTitle>
              <CardDescription>
                登録済み {formatNumber(containers.length)} 件 / 表示中{" "}
                {formatNumber(containers.filter((container) => container.visible).length)} 件
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={containers.length === 0}
                onClick={handleShowAll}
              >
                全表示
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={containers.length === 0}
                onClick={handleHideAll}
              >
                全非表示
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={containers.length === 0}
                onClick={handleUpdateFiles}
              >
                表示状態を保持して再読込
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">ユーティリティ検証</CardTitle>
              <CardDescription>
                `deriveFileStatus` / `isPclodCompleted` / `isFileStatusActive` /
                `isBatchProcessingStatus` を SDK から直接 import して選択中ファイルに適用した結果
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedFile === undefined ? (
                <p className="text-muted-foreground text-xs">
                  一覧からファイルを選択すると結果を表示します。
                </p>
              ) : (
                <UtilityInspector
                  file={selectedFile}
                  // `ContractFile.id` は未検証 JSON 由来なので undefined になり得る。
                  // ID が読めないファイルは pendingUploads の鍵にできないため false 扱いにする。
                  isPendingUpload={
                    selectedFile.id !== undefined && pendingUploads[selectedFile.id] !== undefined
                  }
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}

/**
 * ステータス系ユーティリティを直接呼び出して結果を並べるだけの表示用コンポーネント。
 *
 * `useContractFileActions.getFileStatus` は内部で `deriveFileStatus` を
 * 呼んでいるが、フックを介さず素の関数として使えることを示す。
 */
function UtilityInspector({
  file,
  isPendingUpload,
}: {
  file: ContractFile;
  isPendingUpload: boolean;
}) {
  // 第 2 引数のアップロード中判定は呼び出し側の責任（フック経由なら pendingUploads から自動判定）
  const status = deriveFileStatus(file, isPendingUpload);
  const pclodCompleted = isPclodCompleted(file);
  const statusActive = isFileStatusActive(status);

  // `BatchProcessingResult.status` は SDK が知らない値だと undefined になり、生値が
  // `rawStatus` に残る。`isBatchProcessingStatus` は「RCDE と SDK の値集合が揃っているか」の
  // 判定に使えるので、rawStatus を直接検査した結果も並べて挙動を確認できるようにする。
  const batchResult: BatchProcessingResult | undefined = file.batchProcessingResult;
  const rawStatusIsKnown =
    batchResult === undefined ? undefined : isBatchProcessingStatus(batchResult.rawStatus);

  return (
    <div className="space-y-2 text-xs">
      <div className="truncate font-medium">{file.name}</div>

      <div>
        <div className="text-muted-foreground">
          deriveFileStatus(file, {String(isPendingUpload)})
        </div>
        <pre className="bg-muted mt-1 overflow-x-auto rounded-md p-2 text-[11px]">
          {formatJson(status)}
        </pre>
      </div>

      <Separator />

      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground">isPclodCompleted(file)</span>
        <Badge variant={pclodCompleted ? "success" : "secondary"}>{String(pclodCompleted)}</Badge>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground">isFileStatusActive(status)</span>
        {statusActive ? (
          <Badge variant="warning">
            <Loader2 className="animate-spin" />
            処理中（ポーリング対象）
          </Badge>
        ) : (
          <Badge variant="secondary">false</Badge>
        )}
      </div>

      <Separator />

      <div className="text-muted-foreground">BatchProcessingResult</div>
      {batchResult === undefined ? (
        <p className="text-muted-foreground">PCLOD のバッチ結果がまだありません。</p>
      ) : (
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">status</span>
            <span>
              {batchResult.status === undefined
                ? "undefined（SDK 未知の値）"
                : `${batchResult.status}: ${BATCH_STATUS_LABELS[batchResult.status]}`}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">rawStatus</span>
            <span>{formatNumber(batchResult.rawStatus)}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">isBatchProcessingStatus(rawStatus)</span>
            <Badge variant={rawStatusIsKnown === true ? "success" : "destructive"}>
              {String(rawStatusIsKnown)}
            </Badge>
          </div>
        </div>
      )}

      <div className="text-muted-foreground">
        contractFileId: {formatNumber(file.id)} / uploadedAt: {file.uploadedAt ?? "-"} / CDEStatus:{" "}
        {formatNumber(file.status)}
      </div>
    </div>
  );
}
