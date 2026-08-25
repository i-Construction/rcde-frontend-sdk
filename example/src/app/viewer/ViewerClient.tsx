"use client";

import {
  RCDE,
  type PendingUploads,
  type RCDEAppConfig,
  type ViewerClickEvent,
  type ViewerHoverEvent,
  type ViewerMemoryAlert,
  type ViewerMemoryAlertLevel,
  type ViewerMemorySample,
} from "@i-con/frontend-sdk";
import { Alert, Box, Divider, Typography } from "@mui/material";
import { useCallback, useMemo, useState } from "react";

import { ContractFileSidebar, SidebarUploadButton } from "@/components/ContractFileSidebar";
import { FileUploadModal } from "@/components/FileUploadModal";
import { ReferencePointDialog } from "@/components/ReferencePointDialog";
import { ViewerBottomToolbar } from "@/components/ViewerBottomToolbar";
import { ViewerHeader } from "@/components/ViewerHeader";

/** SDK の ReferencePointView より上にツールバーを置くオフセット（px） */
const VIEWER_TOOLBAR_BOTTOM_OFFSET = 48;
const MEBIBYTE = 1024 * 1024;

function formatMiB(bytes?: number): string {
  if (bytes === undefined) {
    return "-";
  }

  return `${(bytes / MEBIBYTE).toFixed(1)} MiB`;
}

type ViewerClientProps = {
  token: string;
  constructionId: number;
  contractId: number;
  constructionName?: string;
  contractName?: string;
};

export function ViewerClient({
  token,
  constructionId,
  contractId,
  constructionName,
  contractName,
}: ViewerClientProps) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isReferencePointDialogOpen, setIsReferencePointDialogOpen] = useState(false);
  const [pendingUploads, setPendingUploads] = useState<PendingUploads>({});
  const [contractFilesRefetchKey, setContractFilesRefetchKey] = useState<number | undefined>(
    undefined
  );
  const [memorySample, setMemorySample] = useState<ViewerMemorySample | undefined>(undefined);
  const [memoryAlert, setMemoryAlert] = useState<ViewerMemoryAlert | undefined>(undefined);
  const [lastClickEvent, setLastClickEvent] = useState<ViewerClickEvent | undefined>(undefined);
  const [hoverEvent, setHoverEvent] = useState<ViewerHoverEvent | undefined>(undefined);

  // 基準点ダイアログの開閉などで ViewerClient が再レンダーされても、
  // token が変わらない限り app オブジェクトの参照を保つ。
  // 参照が変わるたびに Viewer 側で RCDEClient が再生成され、
  // ファイル一覧が再取得されて表示状態がリセットされてしまうため。
  const app: RCDEAppConfig = useMemo(
    () => ({
      token,
      // ブラウザから RCDE API への直接呼び出しは CORS で POST 等が失敗するためプロキシ経由
      baseUrl: "/api/rcde",
      authType: "2legged",
    }),
    [token]
  );

  const handleUploadOpen = useCallback(() => {
    setIsUploadOpen(true);
  }, []);

  const handleUploadClose = useCallback(() => {
    setIsUploadOpen(false);
  }, []);

  const handleUploadStarted = useCallback(
    ({ contractFileId, name }: { contractFileId: number; name: string }) => {
      setPendingUploads((prev) => ({
        ...prev,
        [contractFileId]: { name },
      }));
    },
    []
  );

  const handleUploadFinished = useCallback((contractFileId: number) => {
    setPendingUploads((prev) => {
      const next = { ...prev };
      delete next[contractFileId];
      return next;
    });
  }, []);

  const handleUploaded = useCallback(() => {
    setContractFilesRefetchKey((prev) => (prev === undefined ? 1 : prev + 1));
    handleUploadClose();
  }, [handleUploadClose]);

  const handleReferencePointToolbarClick = useCallback(() => {
    setIsReferencePointDialogOpen(true);
  }, []);

  const handleReferencePointDialogClose = useCallback(() => {
    setIsReferencePointDialogOpen(false);
  }, []);

  const handleMemorySample = useCallback((sample: ViewerMemorySample) => {
    setMemorySample(sample);
  }, []);

  const handleMemoryAlert = useCallback((alert: ViewerMemoryAlert) => {
    setMemoryAlert(alert);
  }, []);

  const handleMemoryAlertLevelChange = useCallback((level: ViewerMemoryAlertLevel | undefined) => {
    if (level === undefined) {
      setMemoryAlert(undefined);
    }
  }, []);

  const handleObjectClick = useCallback((event: ViewerClickEvent) => {
    setLastClickEvent(event);
  }, []);

  const handleObjectHover = useCallback((event: ViewerHoverEvent) => {
    setHoverEvent(event);
  }, []);

  const memoryMonitoring = useMemo(
    () => ({
      enabled: true,
      sampleIntervalMs: 15000,
      thresholds: {
        warningBytes: 256 * MEBIBYTE,
        criticalBytes: 384 * MEBIBYTE,
        source: "max-available" as const,
        hysteresisBytes: 32 * MEBIBYTE,
      },
      onSample: handleMemorySample,
      onAlert: handleMemoryAlert,
      onAlertLevelChange: handleMemoryAlertLevelChange,
    }),
    [handleMemoryAlert, handleMemoryAlertLevelChange, handleMemorySample]
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <ViewerHeader
        accessToken={token}
        constructionId={constructionId}
        contractId={contractId}
        constructionName={constructionName}
        contractName={contractName}
      />
      <Box sx={{ flex: 1, minHeight: 0, position: "relative" }}>
        <RCDE
          app={app}
          constructionId={constructionId}
          contractId={contractId}
          // デフォルトで全点群ファイルを非表示にする（空配列 = 表示対象なし）
          contractFileIds={[]}
          contractFilesRefetchKey={contractFilesRefetchKey}
          onObjectClick={handleObjectClick}
          onObjectHover={handleObjectHover}
          memoryMonitoring={memoryMonitoring}
          auxiliaryContent={
            <>
              <ContractFileSidebar
                pendingUploads={pendingUploads}
                headerActions={<SidebarUploadButton onClick={handleUploadOpen} />}
              />
              <FileUploadModal
                contractId={contractId}
                open={isUploadOpen}
                onClose={handleUploadClose}
                onUploaded={handleUploaded}
                onUploadStarted={handleUploadStarted}
                onUploadFinished={handleUploadFinished}
              />
              <ReferencePointDialog
                open={isReferencePointDialogOpen}
                onClose={handleReferencePointDialogClose}
              />
            </>
          }
        />
        <Box
          sx={{
            position: "absolute",
            top: 12,
            left: 12,
            zIndex: 10,
            width: 320,
            px: 1.5,
            py: 1,
            borderRadius: 1,
            bgcolor: "rgba(0, 0, 0, 0.65)",
            color: "common.white",
            backdropFilter: "blur(6px)",
            pointerEvents: "none",
          }}
        >
          <Typography variant="caption" component="div">
            Viewer 推定メモリ: {formatMiB(memorySample?.estimatedViewerBytes)}
          </Typography>
          <Typography variant="caption" component="div">
            ページメモリ: {formatMiB(memorySample?.pageBytes ?? memorySample?.jsHeapBytes)}
          </Typography>
          <Typography variant="caption" component="div">
            タイル数: {memorySample?.loadedTileCount ?? 0} / ソース: {memorySample?.source ?? "-"}
          </Typography>
        </Box>
        <Box
          sx={{
            position: "absolute",
            bottom: 12,
            right: 12,
            zIndex: 10,
            width: 320,
            px: 1.5,
            py: 1,
            borderRadius: 1,
            bgcolor: "rgba(0, 0, 0, 0.65)",
            color: "common.white",
            backdropFilter: "blur(6px)",
            pointerEvents: "none",
          }}
        >
          <Typography variant="caption" component="div" sx={{ fontWeight: "bold", mb: 0.5 }}>
            クリック
          </Typography>
          {lastClickEvent ? (
            lastClickEvent.file ? (
              <>
                <Typography variant="caption" component="div">
                  ファイル: {lastClickEvent.file.fileName ?? `ID: ${lastClickEvent.file.id}`}
                </Typography>
                <Typography variant="caption" component="div">
                  交差点: ({lastClickEvent.intersectionPoint?.x.toFixed(2)},{" "}
                  {lastClickEvent.intersectionPoint?.y.toFixed(2)},{" "}
                  {lastClickEvent.intersectionPoint?.z.toFixed(2)})
                </Typography>
                <Typography variant="caption" component="div">
                  画面座標: ({lastClickEvent.screenPosition.x}, {lastClickEvent.screenPosition.y})
                </Typography>
              </>
            ) : (
              <Typography variant="caption" component="div" sx={{ color: "grey.400" }}>
                空白クリック ({lastClickEvent.screenPosition.x}, {lastClickEvent.screenPosition.y})
              </Typography>
            )
          ) : (
            <Typography variant="caption" component="div" sx={{ color: "grey.500" }}>
              未クリック
            </Typography>
          )}
          <Divider sx={{ my: 0.5, borderColor: "rgba(255,255,255,0.2)" }} />
          <Typography variant="caption" component="div" sx={{ fontWeight: "bold", mb: 0.5 }}>
            ホバー
          </Typography>
          {hoverEvent?.file ? (
            <Typography variant="caption" component="div">
              ファイル: {hoverEvent.file.fileName ?? `ID: ${hoverEvent.file.id}`}
            </Typography>
          ) : (
            <Typography variant="caption" component="div" sx={{ color: "grey.500" }}>
              {hoverEvent ? "対象なし" : "未ホバー"}
            </Typography>
          )}
        </Box>
        {memoryAlert && (
          <Box
            sx={{
              position: "absolute",
              top: 96,
              left: 12,
              zIndex: 11,
              width: 360,
            }}
          >
            <Alert severity={memoryAlert.level === "critical" ? "error" : "warning"}>
              3D 表示のメモリ使用量が閾値を超えました。現在値:{" "}
              {formatMiB(memoryAlert.observedBytes)} / 閾値: {formatMiB(memoryAlert.thresholdBytes)}
            </Alert>
          </Box>
        )}
        <Box
          sx={{
            position: "absolute",
            bottom: VIEWER_TOOLBAR_BOTTOM_OFFSET,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            pointerEvents: "auto",
          }}
        >
          <ViewerBottomToolbar
            isReferencePointActive={isReferencePointDialogOpen}
            onReferencePointClick={handleReferencePointToolbarClick}
          />
        </Box>
      </Box>
    </Box>
  );
}
