"use client";

import { useMemo, useState } from "react";
import { RCDE, type RCDEAppConfig, type RCDEProps } from "@i-con/frontend-sdk";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/**
 * README 冒頭の「基本的な使用方法」をそのまま再現する最小構成デモ。
 *
 * メイン画面は `Viewer` + プロバイダ自前構成だが、`RCDE` は
 * `ClientProvider` / `ContractFilesProvider` / `ReferencePointProvider` を
 * 内包するため、これ 1 つ置けばビューアが動く。
 * その代わりファイル一覧などの UI はキャンバスへの重ね描き
 * （`auxiliaryContent`）に限られる。
 */
export function SimpleRcdeDialog({
  app,
  open,
  onOpenChange,
  defaultConstructionId,
  defaultContractId,
}: {
  app: RCDEAppConfig;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultConstructionId: number | undefined;
  defaultContractId: number | undefined;
}) {
  const [constructionId, setConstructionId] = useState(defaultConstructionId ?? 0);
  const [contractId, setContractId] = useState(defaultContractId ?? 0);

  // RCDEProps は ViewerProps と同一。型注釈で公開型を明示的に使っている。
  const rcdeProps = useMemo<RCDEProps>(
    () => ({
      app,
      constructionId,
      contractId,
    }),
    [app, constructionId, contractId]
  );

  const isReady = constructionId > 0 && contractId > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[80vh] max-w-4xl flex-col gap-3">
        <DialogHeader>
          <DialogTitle>RCDE コンポーネント（最小構成）</DialogTitle>
          <DialogDescription>
            プロバイダを内包した <code>RCDE</code> を 1 つ置くだけで動く構成です。
            <code>children</code> に置いた React Three Fiber の要素は、そのまま Canvas
            の子として描画されます。
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-end gap-3">
          <div className="grid gap-1">
            <Label htmlFor="simple-construction-id" className="text-xs">
              現場ID
            </Label>
            <Input
              id="simple-construction-id"
              type="number"
              className="h-8 w-28"
              value={constructionId}
              onChange={(event) => setConstructionId(Number(event.target.value))}
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="simple-contract-id" className="text-xs">
              契約ID
            </Label>
            <Input
              id="simple-contract-id"
              type="number"
              className="h-8 w-28"
              value={contractId}
              onChange={(event) => setContractId(Number(event.target.value))}
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden rounded-md border">
          {isReady ? (
            <div className="viewer-host">
              <RCDE {...rcdeProps}>
                {/* children は react three fiber の Canvas 子要素として描画される */}
                <mesh position={[0, 0, 5]}>
                  <boxGeometry args={[10, 10, 10]} />
                  <meshBasicMaterial color="red" wireframe />
                </mesh>
              </RCDE>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-6">
              <Alert>
                <AlertTitle>現場IDと契約IDを入力してください</AlertTitle>
                <AlertDescription>
                  どちらも 1 以上の値を入れるとビューアを初期化します。
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
