"use client";

import { useCallback, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { CloudUpload, Info, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { CoordinateSystem, useClient, type CoordinateSystemType } from "@i-con/frontend-sdk";
import { useWorkspace } from "@/components/workspace/WorkspaceProvider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MEBIBYTE, formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";

/** `client` のどのアップロードメソッドを呼ぶか。 */
type UploadMethod = "single" | "multipart";

/**
 * マルチパートアップロードの既定チャンクサイズ（MiB）。
 *
 * SDK 内部の `DEFAULT_CHUNK_SIZE_BYTES`（= 100 * 1024 * 1024）と同値だが、
 * この定数は `@i-con/frontend-sdk` の index.ts から export されておらず
 * 公開 API ではないため import せず、ここで同じ値を持つ。
 */
const DEFAULT_CHUNK_SIZE_MIB = 100;

/** SDK が公開する `CoordinateSystem` 定数の 6 種。 */
const COORDINATE_SYSTEM_OPTIONS: { value: CoordinateSystemType; label: string }[] = [
  { value: CoordinateSystem.RightHandedXUp, label: "右手系 X-Up" },
  { value: CoordinateSystem.LeftHandedXUp, label: "左手系 X-Up" },
  { value: CoordinateSystem.RightHandedYUp, label: "右手系 Y-Up" },
  { value: CoordinateSystem.LeftHandedYUp, label: "左手系 Y-Up" },
  { value: CoordinateSystem.RightHandedZUp, label: "右手系 Z-Up" },
  { value: CoordinateSystem.LeftHandedZUp, label: "左手系 Z-Up" },
];

function isUploadMethod(value: string): value is UploadMethod {
  return value === "single" || value === "multipart";
}

function isCoordinateSystemType(value: string): value is CoordinateSystemType {
  return COORDINATE_SYSTEM_OPTIONS.some((option) => option.value === value);
}

export function UploadModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { client, project } = useClient();
  const { addPendingUpload, removePendingUpload, requestRefetch } = useWorkspace();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | undefined>(undefined);
  const [method, setMethod] = useState<UploadMethod>("multipart");
  const [chunkSizeMiB, setChunkSizeMiB] = useState(String(DEFAULT_CHUNK_SIZE_MIB));
  const [coordinateSystem, setCoordinateSystem] = useState<CoordinateSystemType>(
    CoordinateSystem.RightHandedZUp
  );
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ completed: number; total: number } | undefined>(
    undefined
  );
  const [dragOver, setDragOver] = useState(false);

  // client / project は Viewer が RCDE の初期化を終えるまで undefined。
  const isReady = client !== undefined && project !== undefined;

  const parsedChunkSizeMiB = Number(chunkSizeMiB);
  const isChunkSizeValid = Number.isFinite(parsedChunkSizeMiB) && parsedChunkSizeMiB > 0;
  const chunkSizeBytes = isChunkSizeValid ? Math.floor(parsedChunkSizeMiB * MEBIBYTE) : undefined;
  const partTotal =
    file !== undefined && chunkSizeBytes !== undefined
      ? Math.ceil(file.size / chunkSizeBytes)
      : undefined;

  const canUpload =
    isReady && file !== undefined && !uploading && (method === "single" || isChunkSizeValid);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      // アップロード中に閉じると進捗が追えなくなるため閉じさせない
      if (uploading) {
        return;
      }
      if (!nextOpen) {
        setFile(undefined);
        setProgress(undefined);
        setDragOver(false);
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange, uploading]
  );

  const handleInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.item(0) ?? undefined;
    setFile(selected);
    setProgress(undefined);
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragOver(false);
      if (uploading) {
        return;
      }
      const dropped = event.dataTransfer.files.item(0);
      if (dropped !== null) {
        setFile(dropped);
        setProgress(undefined);
      }
    },
    [uploading]
  );

  const handleUpload = useCallback(async () => {
    if (client === undefined || project === undefined || file === undefined) {
      return;
    }

    setUploading(true);
    setProgress(undefined);

    // 作成済みの contractFileId。成功でも失敗でも pending 行を消すために保持する。
    let createdContractFileId: number | undefined;

    const handleContractFileCreated = (contractFileId: number) => {
      createdContractFileId = contractFileId;
      // 一覧 API に載る前でも「アップロード中」行として見えるようにする
      addPendingUpload(contractFileId, file.name);
    };

    try {
      // ファイル全体をメモリ上の ArrayBuffer に載せる。SDK の buffer は ArrayBuffer 固定。
      // 数 GB クラスの点群だとブラウザのメモリを圧迫するため、
      // 実運用では Blob.slice によるチャンク読み出しを検討すること。
      const buffer = await file.arrayBuffer();

      // pointCloudAttribute は SDK 実装上 Record<string, unknown>。
      // RCDE 側の属性項目（no / time / method / equipment / person / crs 等）を任意に渡せる。
      const pointCloudAttribute: Record<string, unknown> = { coordinateSystem };

      if (method === "single") {
        // 単一 PUT でアップロードする。戻り値は完了APIのレスポンス（Record<string, unknown>）。
        await client.uploadContractFile({
          contractId: project.contractId,
          name: file.name,
          buffer,
          pointCloudAttribute,
          onContractFileCreated: handleContractFileCreated,
        });
      } else {
        // チャンク分割アップロード。戻り値は { contractFileId }。
        // chunkSize を省略すると SDK 既定の 100 MiB が使われる。
        await client.uploadContractFileMultipart({
          contractId: project.contractId,
          name: file.name,
          buffer,
          pointCloudAttribute,
          chunkSize: chunkSizeBytes,
          onContractFileCreated: handleContractFileCreated,
          onUploadProgress: (completed, total) => {
            setProgress({ completed, total });
          },
        });
      }

      if (createdContractFileId !== undefined) {
        removePendingUpload(createdContractFileId);
      }
      requestRefetch();
      toast.success(`${file.name} をアップロードしました`);
      setFile(undefined);
      setProgress(undefined);
      onOpenChange(false);
    } catch (error) {
      if (createdContractFileId !== undefined) {
        removePendingUpload(createdContractFileId);
      }
      const message = error instanceof Error ? error.message : String(error);
      console.error("[UploadModal] アップロードに失敗しました:", error);
      toast.error(`アップロードに失敗しました: ${message}`);
    } finally {
      setUploading(false);
    }
  }, [
    addPendingUpload,
    chunkSizeBytes,
    client,
    coordinateSystem,
    file,
    method,
    onOpenChange,
    project,
    removePendingUpload,
    requestRefetch,
  ]);

  const progressPercent =
    progress === undefined || progress.total === 0
      ? 0
      : Math.round((progress.completed / progress.total) * 100);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton={!uploading}>
        <DialogHeader>
          <DialogTitle>点群ファイルのアップロード</DialogTitle>
          <DialogDescription>
            RCDEClient の uploadContractFile（単一 PUT）と uploadContractFileMultipart
            （チャンク分割）を切り替えて試せます。
          </DialogDescription>
        </DialogHeader>

        {!isReady && (
          <Alert variant="warning">
            <Info />
            <AlertTitle>ビューアの初期化を待っています</AlertTitle>
            <AlertDescription>
              RCDEClient と対象プロジェクト（contractId）が確定するまでアップロードできません。
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {/* ファイル選択 + ドラッグ&ドロップ */}
          <div
            className={cn(
              "flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center transition-colors",
              dragOver && "border-primary bg-primary/5",
              uploading && "opacity-60"
            )}
            onDragOver={(event) => {
              event.preventDefault();
              if (!uploading) {
                setDragOver(true);
              }
            }}
            onDragLeave={() => {
              setDragOver(false);
            }}
            onDrop={handleDrop}
          >
            <CloudUpload className="text-muted-foreground size-6" />
            <p className="text-sm">ここにファイルをドラッグ&ドロップ</p>
            <p className="text-muted-foreground text-xs">対応拡張子: .las / .laz / .txt</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".las,.laz,.txt"
              className="hidden"
              disabled={uploading}
              onChange={handleInputChange}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => {
                fileInputRef.current?.click();
              }}
            >
              ファイルを選択
            </Button>
            {file !== undefined && (
              <p className="text-xs font-medium">
                {file.name}（{formatBytes(file.size)}）
              </p>
            )}
          </div>

          {/* アップロード方式 */}
          <div className="space-y-1.5">
            <Label htmlFor="upload-method">アップロード方式</Label>
            <Select
              value={method}
              disabled={uploading}
              onValueChange={(value) => {
                if (isUploadMethod(value)) {
                  setMethod(value);
                  setProgress(undefined);
                }
              }}
            >
              <SelectTrigger id="upload-method" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">single: uploadContractFile（単一 PUT）</SelectItem>
                <SelectItem value="multipart">
                  multipart: uploadContractFileMultipart（チャンク分割）
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* チャンクサイズ（multipart のみ） */}
          {method === "multipart" && (
            <div className="space-y-1.5">
              <Label htmlFor="chunk-size">チャンクサイズ（MiB）</Label>
              <Input
                id="chunk-size"
                type="number"
                min={1}
                step={1}
                value={chunkSizeMiB}
                disabled={uploading}
                onChange={(event) => {
                  setChunkSizeMiB(event.target.value);
                }}
              />
              <p className="text-muted-foreground text-xs">
                SDK 既定値は {DEFAULT_CHUNK_SIZE_MIB} MiB。
                {isChunkSizeValid
                  ? partTotal === undefined
                    ? " ファイルを選択すると分割数を表示します。"
                    : ` 現在の設定では ${partTotal} 分割になります。`
                  : " 1 以上の数値を入力してください。"}
              </p>
            </div>
          )}

          {/* pointCloudAttribute に渡す座標系 */}
          <div className="space-y-1.5">
            <Label htmlFor="coordinate-system">座標系（pointCloudAttribute に付与）</Label>
            <Select
              value={coordinateSystem}
              disabled={uploading}
              onValueChange={(value) => {
                if (isCoordinateSystemType(value)) {
                  setCoordinateSystem(value);
                }
              }}
            >
              <SelectTrigger id="coordinate-system" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>CoordinateSystem</SelectLabel>
                  {COORDINATE_SYSTEM_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}（{option.value}）
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              {`pointCloudAttribute: { coordinateSystem: "${coordinateSystem}" }`}
            </p>
          </div>

          {/* 進捗（multipart の onUploadProgress） */}
          {progress !== undefined && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">チャンク進捗</span>
                <span>
                  {progress.completed} / {progress.total}（{progressPercent}%）
                </span>
              </div>
              <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={uploading}>
              キャンセル
            </Button>
          </DialogClose>
          <Button
            disabled={!canUpload}
            onClick={() => {
              void handleUpload();
            }}
          >
            {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
            {uploading ? "アップロード中..." : "アップロード"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
