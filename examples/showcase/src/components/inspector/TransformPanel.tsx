"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ViewerBridge, useContractFiles, type ViewerTransform } from "@i-con/frontend-sdk";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { useWorkspace } from "@/components/workspace/WorkspaceProvider";

/** x / y / z の 3 成分。入力途中の "-" や "1." を許すため文字列で保持する。 */
type Vector3Input = { x: string; y: string; z: string };

const ZERO_INPUT: Vector3Input = { x: "0", y: "0", z: "0" };

const AXES: (keyof Vector3Input)[] = ["x", "y", "z"];

/**
 * `ViewerBridge.setTransform` / `ViewerBridge.reset` のデモパネル。
 *
 * `ViewerBridge` は `window.postMessage` でチャンネル `RCDE_VIEWER_CMD` にコマンドを流し、
 * Viewer 側が `window.addEventListener("message", ...)` で受け取る仕組みになっている。
 * DOM の参照や React のツリーを共有しないため、iframe 越しや別ウィンドウ（同一オリジンで
 * message が届く範囲）からでも Viewer を制御できる。
 */
export function TransformPanel() {
  const { selectedFileId } = useWorkspace();
  const { containers } = useContractFiles();

  // `ViewerTransform.fileId` は必須（number）なので、対象ファイルが決まらないと送信できない。
  const [fileId, setFileId] = useState<number | undefined>(selectedFileId);
  const [translation, setTranslation] = useState<Vector3Input>(ZERO_INPUT);
  // `ViewerTransform.rotation` は度数（degree）。ラジアンではない。
  const [rotation, setRotation] = useState<Vector3Input>(ZERO_INPUT);

  const handleApply = () => {
    if (fileId === undefined) {
      toast.error("対象ファイルを選択してください");
      return;
    }

    const transform: ViewerTransform = {
      translation: toVector3(translation),
      rotation: toVector3(rotation), // degree
      fileId,
    };
    ViewerBridge.setTransform(transform);
    toast.success(`ファイル #${fileId} に Transform を適用しました`);
  };

  const handleReset = () => {
    // `reset` は transform（translation / rotation）と appearance（点サイズ・不透明度・
    // ファイル単位の座標系）の両方を初期化し、カメラの up も Z に戻す。
    // ファイル単位の設定もすべて破棄されるので、個別調整はやり直しになる。
    ViewerBridge.reset();
    toast.success("Transform と表示設定を初期化しました");
  };

  return (
    <div className="flex flex-col gap-4">
      <Alert>
        <AlertTitle className="text-xs">ViewerBridge の仕組み</AlertTitle>
        <AlertDescription className="text-xs">
          <p>
            コマンドは `window.postMessage` のチャンネル `RCDE_VIEWER_CMD` 経由で Viewer
            に届きます。React のツリーを共有しないため、iframe 越しや別ウィンドウからでも 同じ API
            で制御できます。
          </p>
        </AlertDescription>
      </Alert>

      <section className="flex flex-col gap-3">
        <div>
          <h3 className="text-xs font-semibold">setTransform</h3>
          <p className="text-muted-foreground text-xs">
            指定ファイルの平行移動と回転を設定します。ファイル単位の設定です。
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">対象ファイル（fileId・必須）</Label>
          <Select
            value={fileId === undefined ? undefined : String(fileId)}
            onValueChange={(value) => setFileId(Number(value))}
          >
            <SelectTrigger size="sm" className="w-full text-xs">
              <SelectValue placeholder="ファイルを選択" />
            </SelectTrigger>
            <SelectContent>
              {containers.map((container) => (
                <SelectItem key={container.file.id} value={String(container.file.id)}>
                  #{container.file.id} {container.file.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {containers.length === 0 && (
            <p className="text-muted-foreground text-xs">
              契約ファイルがまだ読み込まれていません。
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">平行移動（translation）</Label>
          <div className="grid grid-cols-3 gap-1.5">
            {AXES.map((axis) => (
              <div key={axis} className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs uppercase">{axis}</span>
                <Input
                  type="number"
                  step={1}
                  className="h-8 text-xs"
                  value={translation[axis]}
                  onChange={(event) =>
                    setTranslation({ ...translation, [axis]: event.target.value })
                  }
                />
              </div>
            ))}
          </div>
          <p className="text-muted-foreground text-xs">ワールド単位のオフセットです。</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">回転（rotation・度数）</Label>
          <div className="grid grid-cols-3 gap-1.5">
            {AXES.map((axis) => (
              <div key={axis} className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs uppercase">{axis}</span>
                <Input
                  type="number"
                  step={1}
                  className="h-8 text-xs"
                  value={rotation[axis]}
                  onChange={(event) => setRotation({ ...rotation, [axis]: event.target.value })}
                />
              </div>
            ))}
          </div>
          <p className="text-muted-foreground text-xs">
            単位は度（degree）です。ラジアンを渡すと極端に小さい回転になります。
          </p>
        </div>

        <Button size="sm" className="text-xs" onClick={handleApply}>
          適用
        </Button>
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <div>
          <h3 className="text-xs font-semibold">reset</h3>
        </div>
        <Alert variant="destructive">
          <AlertTitle className="text-xs">初期化される範囲</AlertTitle>
          <AlertDescription className="text-xs">
            <p>
              `reset` は Transform（平行移動・回転）と表示設定（点サイズ・不透明度・ファイル単位の
              座標系）の両方を初期化し、カメラの up も Z に戻します。ファイルごとに調整した設定も
              すべて破棄されます。
            </p>
          </AlertDescription>
        </Alert>
        <Button variant="destructive" size="sm" className="text-xs" onClick={handleReset}>
          リセット
        </Button>
      </section>
    </div>
  );
}

/** 文字列入力を `ViewerTransform` の x/y/z 数値へ変換する。空文字や不正値は 0 にする。 */
function toVector3(input: Vector3Input): { x: number; y: number; z: number } {
  return {
    x: toFiniteNumber(input.x),
    y: toFiniteNumber(input.y),
    z: toFiniteNumber(input.z),
  };
}

function toFiniteNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
