"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  CoordinateSystem,
  ViewerBridge,
  type CoordinateSystemType,
  type UpAxis,
  type ViewerAppearance,
} from "@i-con/frontend-sdk";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useWorkspace, type R3FFlags } from "@/components/workspace/WorkspaceProvider";

/** `CoordinateSystem` 定数の 6 種すべてを日本語ラベル付きで並べる。 */
const COORDINATE_SYSTEM_OPTIONS: { value: CoordinateSystemType; label: string }[] = [
  { value: CoordinateSystem.RightHandedXUp, label: "右手系 X Up" },
  { value: CoordinateSystem.LeftHandedXUp, label: "左手系 X Up" },
  { value: CoordinateSystem.RightHandedYUp, label: "右手系 Y Up" },
  { value: CoordinateSystem.LeftHandedYUp, label: "左手系 Y Up" },
  { value: CoordinateSystem.RightHandedZUp, label: "右手系 Z Up" },
  { value: CoordinateSystem.LeftHandedZUp, label: "左手系 Z Up" },
];

/** `r3f` prop に渡す各フラグの説明。`referencePointAxis` だけ Viewer 内蔵の描画。 */
const R3F_FLAG_LABELS: { key: keyof R3FFlags; label: string; description: string }[] = [
  { key: "map", label: "MapControls", description: "ドラッグでのパン・ズーム操作" },
  { key: "light", label: "環境光", description: "ambientLight を配置する" },
  { key: "grid", label: "グリッド", description: "無限グリッドを描画する" },
  { key: "gizmo", label: "ギズモ", description: "右上の軸方向ギズモ" },
  {
    key: "referencePointAxis",
    label: "内蔵の基準点軸",
    description: "Viewer 内蔵の軸（下の自前描画と二重表示になる）",
  },
];

/** 適用先。`fileId` を渡さない場合はグローバル適用になる。 */
type AppearanceTarget = "global" | "file";

/**
 * `ViewerBridge.setAppearance` のデモパネル。
 *
 * `ViewerAppearance` の各フィールドの効き方:
 * - `pointSize`: 点のサイズ。Viewer 側で 0..5 にクランプされる。
 * - `opacity`: 不透明度。0..100（パーセント）で渡し、Viewer 側で 0..1 に変換される。
 * - `upAxis`: カメラの up ベクトル。"Y" なら (0,1,0)、"Z" なら (0,0,1)。
 *   これはファイル単位ではなくカメラに対して適用される（`fileId` の有無に関わらず効く）。
 * - `coordinateSystem`: ファイル単位の座標系。`fileId` を指定したときだけ保持される。
 * - `fileId`: 省略するとグローバル（Viewer 共通）の appearance を更新する。
 */
export function AppearancePanel() {
  const { selectedFileId, r3fFlags, toggleR3FFlag, axisConfig, setAxisConfig } = useWorkspace();

  const [pointSize, setPointSize] = useState(2);
  const [opacity, setOpacity] = useState(100);
  const [upAxis, setUpAxis] = useState<UpAxis>("Z");
  const [coordinateSystem, setCoordinateSystem] = useState<CoordinateSystemType>(
    CoordinateSystem.RightHandedZUp
  );
  const [target, setTarget] = useState<AppearanceTarget>("global");

  const isFileTarget = target === "file" && selectedFileId !== undefined;

  const handleApply = () => {
    // グローバル適用時は `fileId` を渡さない（キーを付けると undefined 判定に影響しないが、
    // 意図を明確にするためオブジェクト自体を分けて組み立てる）。
    const appearance: ViewerAppearance = isFileTarget
      ? { pointSize, opacity, upAxis, coordinateSystem, fileId: selectedFileId }
      : { pointSize, opacity, upAxis, coordinateSystem };

    ViewerBridge.setAppearance(appearance);
    toast.success(
      isFileTarget
        ? `ファイル #${selectedFileId} に表示設定を適用しました`
        : "グローバルに表示設定を適用しました"
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-3">
        <div>
          <h3 className="text-xs font-semibold">setAppearance</h3>
          <p className="text-muted-foreground text-xs">
            点のサイズ・不透明度・カメラ up・座標系を Viewer に送信します。
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs">点サイズ（pointSize）</Label>
            <span className="text-muted-foreground text-xs tabular-nums">
              {pointSize.toFixed(1)}
            </span>
          </div>
          <Slider
            min={0}
            max={5}
            step={0.1}
            value={[pointSize]}
            onValueChange={(values) => setPointSize(values[0] ?? 0)}
          />
          <p className="text-muted-foreground text-xs">0〜5 の範囲でクランプされます。</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs">不透明度（opacity）</Label>
            <span className="text-muted-foreground text-xs tabular-nums">{opacity} %</span>
          </div>
          <Slider
            min={0}
            max={100}
            step={1}
            value={[opacity]}
            onValueChange={(values) => setOpacity(values[0] ?? 0)}
          />
          <p className="text-muted-foreground text-xs">
            0〜100 のパーセント指定です。100 未満にすると透過描画になります。
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">カメラ up（upAxis）</Label>
          <Select value={upAxis} onValueChange={(value) => setUpAxis(value as UpAxis)}>
            <SelectTrigger size="sm" className="w-full text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Z">Z Up（土木系の既定）</SelectItem>
              <SelectItem value="Y">Y Up</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-xs">
            カメラの up ベクトルを切り替えます。適用先の指定とは無関係に常にカメラへ適用されます。
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">座標系（coordinateSystem）</Label>
          <Select
            value={coordinateSystem}
            onValueChange={(value) => setCoordinateSystem(value as CoordinateSystemType)}
          >
            <SelectTrigger size="sm" className="w-full text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COORDINATE_SYSTEM_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-xs">
            ファイル単位の座標系です。適用先に「選択中のファイル」を選んだときのみ保持されます。
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">適用先</Label>
          <Select value={target} onValueChange={(value) => setTarget(value as AppearanceTarget)}>
            <SelectTrigger size="sm" className="w-full text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">グローバル（fileId なし）</SelectItem>
              <SelectItem value="file" disabled={selectedFileId === undefined}>
                選択中のファイル（fileId 指定）
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-xs">
            {selectedFileId === undefined
              ? "ファイルが未選択のため、ファイル単位の適用は選べません。"
              : `選択中のファイル ID: ${selectedFileId}`}
          </p>
        </div>

        <Button size="sm" className="text-xs" onClick={handleApply}>
          適用
        </Button>
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <div>
          <h3 className="text-xs font-semibold">r3f 表示フラグ</h3>
          <p className="text-muted-foreground text-xs">
            Viewer の `r3f` prop に渡すフラグです。false を渡すと該当要素が描画されません。
          </p>
        </div>

        {R3F_FLAG_LABELS.map((flag) => (
          <div key={flag.key} className="flex items-start justify-between gap-2">
            <div className="flex flex-col">
              <Label className="text-xs">{flag.label}</Label>
              <span className="text-muted-foreground text-xs">{flag.description}</span>
            </div>
            <Switch
              checked={r3fFlags[flag.key]}
              onCheckedChange={() => toggleR3FFlag(flag.key)}
              aria-label={flag.label}
            />
          </div>
        ))}
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <div>
          <h3 className="text-xs font-semibold">自前描画の ReferencePointAxis</h3>
          <p className="text-muted-foreground text-xs">
            `ReferencePointAxis` を children として自前に描画しています。上の「内蔵の基準点軸」を ON
            にすると Viewer 内蔵の軸と二重表示になります。
          </p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <Label className="text-xs">表示（visible）</Label>
          <Switch
            checked={axisConfig.visible}
            onCheckedChange={(checked) => setAxisConfig({ ...axisConfig, visible: checked })}
            aria-label="基準点軸の表示"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs" htmlFor="axis-length">
            長さ（length）
          </Label>
          <Input
            id="axis-length"
            type="number"
            step={1}
            className="h-8 text-xs"
            value={axisConfig.length}
            onChange={(event) =>
              setAxisConfig({ ...axisConfig, length: toFiniteNumber(event.target.value) })
            }
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs" htmlFor="axis-width">
            太さ（width）
          </Label>
          <Input
            id="axis-width"
            type="number"
            step={0.1}
            className="h-8 text-xs"
            value={axisConfig.width}
            onChange={(event) =>
              setAxisConfig({ ...axisConfig, width: toFiniteNumber(event.target.value) })
            }
          />
        </div>
      </section>
    </div>
  );
}

/** `Input type="number"` の値を数値へ変換する。空文字や不正値は 0 にする。 */
function toFiniteNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
