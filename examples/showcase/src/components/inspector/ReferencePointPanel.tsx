"use client";

import { useState } from "react";
import { Vector3 } from "three";
import { toast } from "sonner";
import { useContractFiles, useReferencePoint } from "@i-con/frontend-sdk";
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
import { formatVector } from "@/lib/format";

/** 入力途中の "-" を許すため文字列で保持する。 */
type Vector3Input = { x: string; y: string; z: string };

const AXES: (keyof Vector3Input)[] = ["x", "y", "z"];

/**
 * `useReferencePoint` の 3 つの API（`point` / `change` / `focusFileById`）のデモ。
 *
 * 基準点は「点群座標に加算されるオフセット」で、原点から遠い測量座標をワールド原点付近へ
 * 引き寄せるために使う。WebGL の頂点座標は float32 なので、数十万〜数百万の絶対座標を
 * そのまま描画すると精度落ち（点のちらつき・ジッター）が起きる。
 */
export function ReferencePointPanel() {
  const { point, change, focusFileById } = useReferencePoint();
  const { containers } = useContractFiles();

  const [input, setInput] = useState<Vector3Input>({ x: "0", y: "0", z: "0" });
  const [focusFileId, setFocusFileId] = useState<number | undefined>(undefined);
  const [focusing, setFocusing] = useState(false);

  const handleChange = () => {
    change(toVector3(input));
    toast.success("基準点を変更しました（change）");
  };

  const handleResetToOrigin = () => {
    change(new Vector3(0, 0, 0));
    setInput({ x: "0", y: "0", z: "0" });
    toast.success("基準点を原点に戻しました");
  };

  const handleFocus = async () => {
    if (focusFileId === undefined) {
      toast.error("フォーカスするファイルを選択してください");
      return;
    }

    setFocusing(true);
    try {
      // `focusFileById` は成功時 true、対象なし・PCLOD 未完了・メタデータ取得失敗時は false を返す。
      const succeeded = await focusFileById(focusFileId);
      if (succeeded) {
        toast.success(`ファイル #${focusFileId} の中心へ基準点を移動しました`);
      } else {
        toast.error("フォーカスできませんでした（PCLOD 未完了、またはメタデータ取得に失敗）");
      }
    } finally {
      setFocusing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Alert>
        <AlertTitle className="text-xs">基準点とは</AlertTitle>
        <AlertDescription className="text-xs">
          <p>
            点群の Bounding Box 中心をワールド原点へ引き寄せるためのオフセットです。WebGL の頂点
            座標は float32 なので、測量座標をそのまま描画すると精度落ちでちらつきます。基準点で
            原点付近に寄せることでこれを回避します。
          </p>
        </AlertDescription>
      </Alert>

      <section className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold">現在の基準点（point）</h3>
        <p className="bg-muted rounded px-2 py-1.5 font-mono text-xs">{formatVector(point)}</p>
        <p className="text-muted-foreground text-xs">
          three の `Vector3` です。点群側の座標にこの値が加算されて描画されます。
        </p>
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <div>
          <h3 className="text-xs font-semibold">change</h3>
          <p className="text-muted-foreground text-xs">
            基準点を任意の値に差し替えます。Context 内の state を更新するだけで永続化はされません。
          </p>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {AXES.map((axis) => (
            <div key={axis} className="flex flex-col gap-1">
              <Label className="text-xs uppercase">{axis}</Label>
              <Input
                type="number"
                step={1}
                className="h-8 text-xs"
                value={input[axis]}
                onChange={(event) => setInput({ ...input, [axis]: event.target.value })}
              />
            </div>
          ))}
        </div>

        <div className="flex gap-1.5">
          <Button size="sm" className="flex-1 text-xs" onClick={handleChange}>
            変更（change）
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={handleResetToOrigin}
          >
            原点に戻す
          </Button>
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <div>
          <h3 className="text-xs font-semibold">focusFileById</h3>
          <p className="text-muted-foreground text-xs">
            指定ファイルのメタデータから Bounding Box 中心を求め、その符号を反転した値を基準点に
            設定します（= その点群がワールド原点へ来ます）。
          </p>
        </div>

        <Select
          value={focusFileId === undefined ? undefined : String(focusFileId)}
          onValueChange={(value) => setFocusFileId(Number(value))}
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

        <Button
          size="sm"
          className="text-xs"
          onClick={handleFocus}
          disabled={focusing || focusFileId === undefined}
        >
          {focusing ? "フォーカス中..." : "このファイルにフォーカス"}
        </Button>
        <p className="text-muted-foreground text-xs">
          戻り値は boolean です。PCLOD 変換が完了していないファイルは false になります。
        </p>
      </section>
    </div>
  );
}

function toVector3(input: Vector3Input): Vector3 {
  return new Vector3(toFiniteNumber(input.x), toFiniteNumber(input.y), toFiniteNumber(input.z));
}

function toFiniteNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
