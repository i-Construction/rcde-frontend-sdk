"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useClient, useContractFiles } from "@i-con/frontend-sdk";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatJson } from "@/lib/format";

/** 確認ダイアログを出す書き込み系メソッドの種別。 */
type WriteAction = "createConstruction" | "createContract";

const WRITE_ACTION_LABELS: Record<WriteAction, string> = {
  createConstruction: "createConstruction（現場を作成）",
  createContract: "createContract（契約を作成）",
};

/**
 * `RCDEClient` の全メソッドを UI から実行し、レスポンスを確認するパネル。
 *
 * 引数の形はメソッドごとに異なるので注意（実ソース `lib/rcde-client.ts` 準拠）:
 * - `getConstructionList()` — 引数なし
 * - `getConstruction(constructionId)` — 位置引数
 * - `getContractList({ constructionId })` — オブジェクト
 * - `getContractFileList({ contractId })` — オブジェクト
 * - `getContractFileMetadata({ contractId, contractFileId })` — オブジェクト
 * - `getContractFileImagePosition({ contractId, contractFileId, level?, addr? })` — オブジェクト
 * - `getContractFileImageColor({ contractId, contractFileId, level?, addr? })` — オブジェクト
 * - `getContractFileDownloadUrl(contractId, fileId)` — **位置引数 2 つ**
 * - `createConstruction(params)` / `createContract(params)` — オブジェクト
 *
 * `uploadContractFile` / `uploadContractFileMultipart` はこのパネルでは扱わない。
 * ファイル選択とアップロード進捗の UI が必要なため、別途アップロードモーダル側で実装している。
 */
export function ApiPlaygroundPanel() {
  const { client, project } = useClient();
  const { containers } = useContractFiles();

  const [fileId, setFileId] = useState<number | undefined>(undefined);
  const [level, setLevel] = useState("0");
  const [addr, setAddr] = useState("0-0-0");

  const [result, setResult] = useState<unknown>(undefined);
  const [resultLabel, setResultLabel] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [runningLabel, setRunningLabel] = useState<string | undefined>(undefined);

  // 書き込み系の入力値
  const [constructionName, setConstructionName] = useState("");
  const [constructionAddress, setConstructionAddress] = useState("");
  const [constructionContractedAt, setConstructionContractedAt] = useState("");
  const [constructionPeriod, setConstructionPeriod] = useState("");
  const [contractAmount, setContractAmount] = useState("");
  const [advancePaymentRate, setAdvancePaymentRate] = useState("");
  const [contractName, setContractName] = useState("");
  const [contractContractedAt, setContractContractedAt] = useState("");
  const [pendingWrite, setPendingWrite] = useState<WriteAction | undefined>(undefined);

  if (client === undefined) {
    return (
      <Alert>
        <AlertTitle className="text-xs">ビューアの初期化を待っています</AlertTitle>
        <AlertDescription className="text-xs">
          <p>
            `RCDEClient` は Viewer が `useClient().initialize(app)` を呼んだ時点で生成されます。
            点群ビューアの読み込みが終わると、このパネルから API を実行できます。
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  const constructionId = project?.constructionId;
  const contractId = project?.contractId;
  const isBusy = runningLabel !== undefined;
  const needsProject = project === undefined;
  const needsFile = fileId === undefined;

  const run = async (label: string, execute: () => Promise<unknown>) => {
    setRunningLabel(label);
    setErrorMessage(undefined);
    try {
      const value = await execute();
      setResult(value);
      setResultLabel(label);
      toast.success(`${label} が成功しました`);
    } catch (error) {
      // catch した値は unknown なので Error かどうかを判定してメッセージを取り出す。
      const message = error instanceof Error ? error.message : String(error);
      setResult(undefined);
      setResultLabel(label);
      setErrorMessage(message);
      toast.error(`${label} が失敗しました: ${message}`);
    } finally {
      setRunningLabel(undefined);
    }
  };

  const executeWrite = async (action: WriteAction) => {
    setPendingWrite(undefined);

    if (action === "createConstruction") {
      // `CreateConstructionParams` は SDK 型では name 以外が任意だが、RCDE のサーバー側
      // バリデーションでは address / contractedAt / period / contractAmount /
      // advancePaymentRate も必須なので、未入力だと HTTP 400 になる。
      await run("createConstruction", () =>
        client.createConstruction({
          name: constructionName,
          address: constructionAddress === "" ? undefined : constructionAddress,
          contractedAt: toIsoString(constructionContractedAt),
          period: toIsoString(constructionPeriod),
          contractAmount: toOptionalNumber(contractAmount),
          advancePaymentRate: toOptionalNumber(advancePaymentRate),
        })
      );
      return;
    }

    if (constructionId === undefined) {
      toast.error("constructionId が未取得です");
      return;
    }
    await run("createContract", () =>
      client.createContract({
        constructionId,
        name: contractName,
        contractedAt: toIsoString(contractContractedAt) ?? "",
      })
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-2">
        <div className="text-muted-foreground text-xs">
          <p>constructionId: {constructionId ?? "未取得"}</p>
          <p>contractId: {contractId ?? "未取得"}</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">対象ファイル（contractFileId）</Label>
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
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>現場・契約</CardTitle>
          <CardDescription>現場（construction）と契約（contract）の読み取り。</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            disabled={isBusy}
            onClick={() => run("getConstructionList", () => client.getConstructionList())}
          >
            getConstructionList()
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            disabled={isBusy || constructionId === undefined}
            onClick={() =>
              run("getConstruction", () => client.getConstruction(constructionId ?? 0))
            }
          >
            getConstruction(constructionId)
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            disabled={isBusy || constructionId === undefined}
            onClick={() =>
              run("getContractList", () =>
                client.getContractList({ constructionId: constructionId ?? 0 })
              )
            }
          >
            getContractList({"{ constructionId }"})
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>契約ファイル</CardTitle>
          <CardDescription>
            ファイル一覧・メタデータ・ダウンロード URL。`getContractFileDownloadUrl` だけは
            位置引数です。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            disabled={isBusy || needsProject}
            onClick={() =>
              run("getContractFileList", () =>
                client.getContractFileList({ contractId: contractId ?? 0 })
              )
            }
          >
            getContractFileList({"{ contractId }"})
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            disabled={isBusy || needsProject || needsFile}
            onClick={() =>
              run("getContractFileMetadata", () =>
                client.getContractFileMetadata({
                  contractId: contractId ?? 0,
                  contractFileId: fileId ?? 0,
                })
              )
            }
          >
            getContractFileMetadata(...)
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            disabled={isBusy || needsProject || needsFile}
            onClick={() =>
              run("getContractFileDownloadUrl", () =>
                client.getContractFileDownloadUrl(contractId ?? 0, fileId ?? 0)
              )
            }
          >
            getContractFileDownloadUrl(contractId, fileId)
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>PCLOD タイル</CardTitle>
          <CardDescription>
            戻り値は `ArrayBuffer` です。中身は PNG なのでバイト数のみ表示します。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            <div className="flex flex-col gap-1">
              <Label className="text-xs" htmlFor="pclod-level">
                level
              </Label>
              <Input
                id="pclod-level"
                type="number"
                min={0}
                className="h-8 text-xs"
                value={level}
                onChange={(event) => setLevel(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs" htmlFor="pclod-addr">
                addr
              </Label>
              <Input
                id="pclod-addr"
                className="h-8 text-xs"
                value={addr}
                onChange={(event) => setAddr(event.target.value)}
              />
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            disabled={isBusy || needsProject || needsFile}
            onClick={() =>
              run("getContractFileImagePosition", () =>
                client.getContractFileImagePosition({
                  contractId: contractId ?? 0,
                  contractFileId: fileId ?? 0,
                  level: toFiniteNumber(level),
                  addr,
                })
              )
            }
          >
            getContractFileImagePosition(...)
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            disabled={isBusy || needsProject || needsFile}
            onClick={() =>
              run("getContractFileImageColor", () =>
                client.getContractFileImageColor({
                  contractId: contractId ?? 0,
                  contractFileId: fileId ?? 0,
                  level: toFiniteNumber(level),
                  addr,
                })
              )
            }
          >
            getContractFileImageColor(...)
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>書き込み系</CardTitle>
          <CardDescription>
            アップロード系（`uploadContractFile` / `uploadContractFileMultipart`）は
            アップロードモーダル側で実装しているため、ここでは扱いません。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Alert variant="warning">
            <AlertTitle className="text-xs">実データが作られます</AlertTitle>
            <AlertDescription className="text-xs">
              <p>
                これらのメソッドは RCDE 上に現場・契約を実際に作成します。UI から削除はできない
                ため、テスト用の環境で実行してください。
              </p>
            </AlertDescription>
          </Alert>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs" htmlFor="construction-name">
              現場名（name）
            </Label>
            <Input
              id="construction-name"
              className="h-8 text-xs"
              value={constructionName}
              onChange={(event) => setConstructionName(event.target.value)}
            />
            <Label className="text-xs" htmlFor="construction-address">
              住所（address）
            </Label>
            <Input
              id="construction-address"
              className="h-8 text-xs"
              value={constructionAddress}
              onChange={(event) => setConstructionAddress(event.target.value)}
            />
            <Label className="text-xs" htmlFor="construction-contracted-at">
              契約日（contractedAt）
            </Label>
            <Input
              id="construction-contracted-at"
              type="date"
              className="h-8 text-xs"
              value={constructionContractedAt}
              onChange={(event) => setConstructionContractedAt(event.target.value)}
            />
            <Label className="text-xs" htmlFor="construction-period">
              工期（period）
            </Label>
            <Input
              id="construction-period"
              type="date"
              className="h-8 text-xs"
              value={constructionPeriod}
              onChange={(event) => setConstructionPeriod(event.target.value)}
            />
            <Label className="text-xs" htmlFor="construction-amount">
              契約金額（contractAmount）
            </Label>
            <Input
              id="construction-amount"
              type="number"
              min={0}
              className="h-8 text-xs"
              value={contractAmount}
              onChange={(event) => setContractAmount(event.target.value)}
            />
            <Label className="text-xs" htmlFor="construction-advance-rate">
              前払金率（advancePaymentRate）
            </Label>
            <Input
              id="construction-advance-rate"
              type="number"
              min={0}
              className="h-8 text-xs"
              value={advancePaymentRate}
              onChange={(event) => setAdvancePaymentRate(event.target.value)}
            />
            <Button
              size="sm"
              variant="destructive"
              className="text-xs"
              disabled={isBusy || constructionName === ""}
              onClick={() => setPendingWrite("createConstruction")}
            >
              createConstruction(params)
            </Button>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs" htmlFor="contract-name">
              契約名（name）
            </Label>
            <Input
              id="contract-name"
              className="h-8 text-xs"
              value={contractName}
              onChange={(event) => setContractName(event.target.value)}
            />
            <Label className="text-xs" htmlFor="contract-contracted-at">
              契約日（contractedAt）
            </Label>
            <Input
              id="contract-contracted-at"
              type="date"
              className="h-8 text-xs"
              value={contractContractedAt}
              onChange={(event) => setContractContractedAt(event.target.value)}
            />
            <Button
              size="sm"
              variant="destructive"
              className="text-xs"
              disabled={
                isBusy ||
                constructionId === undefined ||
                contractName === "" ||
                contractContractedAt === ""
              }
              onClick={() => setPendingWrite("createContract")}
            >
              createContract({"{ constructionId, name, contractedAt }"})
            </Button>
          </div>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-semibold">実行結果</h3>
          {isBusy && (
            <span className="text-muted-foreground text-xs">{runningLabel} 実行中...</span>
          )}
        </div>
        {resultLabel !== undefined && (
          <p className="text-muted-foreground text-xs">{resultLabel}</p>
        )}
        {errorMessage !== undefined ? (
          <p className="text-destructive text-xs break-words">{errorMessage}</p>
        ) : (
          <pre className="bg-muted max-h-64 overflow-auto rounded p-2 text-xs">
            {result === undefined ? "（未実行）" : formatJson(result)}
          </pre>
        )}
      </section>

      <Dialog
        open={pendingWrite !== undefined}
        onOpenChange={(open) => {
          if (!open) {
            setPendingWrite(undefined);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>実行の確認</DialogTitle>
            <DialogDescription>RCDE 上に実データが作成されます。よろしいですか？</DialogDescription>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            {pendingWrite === undefined ? "" : WRITE_ACTION_LABELS[pendingWrite]}
          </p>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setPendingWrite(undefined)}>
              キャンセル
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (pendingWrite !== undefined) {
                  void executeWrite(pendingWrite);
                }
              }}
            >
              実行する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** `Input type="date"` の値（YYYY-MM-DD）を ISO 文字列に変換する。未入力は undefined。 */
function toIsoString(value: string): string | undefined {
  if (value === "") {
    return undefined;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/** 数値入力を任意項目として扱う。未入力・不正値は undefined にしてリクエストから省く。 */
function toOptionalNumber(value: string): number | undefined {
  if (value === "") {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toFiniteNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
