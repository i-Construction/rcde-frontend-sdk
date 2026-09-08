"use client";

import type { ReactNode } from "react";
import {
  Activity,
  Axis3d,
  Boxes,
  Compass,
  Eraser,
  Grid3x3,
  Move,
  RefreshCw,
  Ruler,
  Sun,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useWorkspace, type R3FFlags } from "@/components/workspace/WorkspaceProvider";
import { cn } from "@/lib/utils";

/** ツールバー内の共通ボタン。有効時は背景を明るくして押下状態を示す。 */
function ToolbarButton({
  label,
  active = false,
  className,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  className?: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          aria-pressed={active}
          onClick={onClick}
          className={cn(
            "text-white hover:bg-white/15 hover:text-white",
            active && "bg-white/20",
            className
          )}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/** `r3fFlags` の 5 つのトグルをまとめて定義する。 */
const R3F_TOGGLES: { key: keyof R3FFlags; label: string; icon: ReactNode }[] = [
  { key: "grid", label: "グリッド", icon: <Grid3x3 /> },
  { key: "light", label: "環境光", icon: <Sun /> },
  { key: "gizmo", label: "ビューギズモ", icon: <Compass /> },
  { key: "map", label: "マップ操作（MapControls）", icon: <Move /> },
  { key: "referencePointAxis", label: "内蔵の基準点軸", icon: <Axis3d /> },
];

/**
 * ビューアペイン下部中央に浮かべるツールバー。
 *
 * 計測モードの ON/OFF、`r3f` 表示フラグ、メモリ監視、一覧の再取得を 1 か所から操作する。
 */
export function ViewerToolbar() {
  const {
    measurementEnabled,
    setMeasurementEnabled,
    measurementPoints,
    setMeasurementPoints,
    customLayerVisible,
    setCustomLayerVisible,
    r3fFlags,
    toggleR3FFlag,
    memoryConfig,
    setMemoryConfig,
    alertLevel,
    requestRefetch,
  } = useWorkspace();

  const handleMeasurementToggle = () => {
    const next = !measurementEnabled;
    setMeasurementEnabled(next);
    if (next) {
      toast.info("クリックで2点を指定すると距離が表示されます。Escでリセット");
    }
  };

  const memoryIconClassName =
    alertLevel === "critical"
      ? "text-red-400"
      : alertLevel === "warning"
        ? "text-amber-300"
        : undefined;

  return (
    <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-lg border bg-[#2d2d2d] p-1.5 text-white shadow-lg">
      <ToolbarButton
        label="距離計測（MeasurementHandler）"
        active={measurementEnabled}
        onClick={handleMeasurementToggle}
      >
        <Ruler />
      </ToolbarButton>
      {measurementPoints.length > 0 && (
        <>
          <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
            {measurementPoints.length} 点
          </Badge>
          <ToolbarButton label="計測点をクリア" onClick={() => setMeasurementPoints([])}>
            <Eraser />
          </ToolbarButton>
        </>
      )}

      <Separator orientation="vertical" className="mx-1 h-6 bg-white/20" />

      <ToolbarButton
        label="カスタムレイヤー表示"
        active={customLayerVisible}
        onClick={() => setCustomLayerVisible(!customLayerVisible)}
      >
        <Boxes />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-6 bg-white/20" />

      {R3F_TOGGLES.map((toggle) => (
        <ToolbarButton
          key={toggle.key}
          label={toggle.label}
          active={r3fFlags[toggle.key]}
          onClick={() => toggleR3FFlag(toggle.key)}
        >
          {toggle.icon}
        </ToolbarButton>
      ))}

      <Separator orientation="vertical" className="mx-1 h-6 bg-white/20" />

      <ToolbarButton
        label="メモリ監視"
        active={memoryConfig.enabled}
        onClick={() => setMemoryConfig({ ...memoryConfig, enabled: !memoryConfig.enabled })}
      >
        <Activity className={memoryIconClassName} />
      </ToolbarButton>
      <ToolbarButton label="ファイル一覧を再取得" onClick={requestRefetch}>
        <RefreshCw />
      </ToolbarButton>
    </div>
  );
}
