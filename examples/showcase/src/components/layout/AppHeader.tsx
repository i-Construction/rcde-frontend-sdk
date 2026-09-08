"use client";

import { useEffect, useState } from "react";
import type { RCDEClient } from "@i-con/frontend-sdk";
import { Boxes, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useWorkspace } from "@/components/workspace/WorkspaceProvider";

/**
 * `Construction` / `Contract` は SDK の index.ts から export されていないため
 * import できない。セレクタに必要な最小限のフィールドだけローカルに定義する。
 *
 * SDK 側の `id` は未検証 JSON 由来で `number | undefined` なので、
 * セレクタの値に使えるのは ID が読めたものだけ。取得時に絞り込む。
 */
type SelectOption = { id: number; name: string };

/** ID が整数として読めなかった要素を落として `SelectOption[]` にする。 */
function toSelectOptions(items: { id?: number; name: string }[]): SelectOption[] {
  return items
    .filter((item): item is SelectOption => item.id !== undefined)
    .map(({ id, name }) => ({ id, name }));
}

/**
 * 画面上部の緑ヘッダー。現場・契約の選択とモーダル起動を担う。
 *
 * 一覧取得は `client`（`Workspace` が生成した `RCDEClient`）で行う。
 * Viewer 初期化前でもセレクタを操作できるようにするため、
 * SDK の `useClient()` が持つインスタンスには依存しない。
 */
export function AppHeader({
  client,
  onOpenSimpleDialog,
  onOpenUpload,
}: {
  client: RCDEClient;
  onOpenSimpleDialog: () => void;
  onOpenUpload: () => void;
}) {
  const { constructionId, contractId, setProject } = useWorkspace();

  const [constructions, setConstructions] = useState<SelectOption[]>([]);
  const [contracts, setContracts] = useState<SelectOption[]>([]);
  const [constructionsLoading, setConstructionsLoading] = useState(true);
  const [contractsLoading, setContractsLoading] = useState(false);
  // env の既定値（WorkspaceProvider の初期値）を選択済みとして表示するため、
  // 現場の選択状態はローカルにも保持する。
  const [selectedConstructionId, setSelectedConstructionId] = useState<number | undefined>(
    constructionId
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setConstructionsLoading(true);
      try {
        const res = await client.getConstructionList();
        if (cancelled) return;
        setConstructions(toSelectOptions(res.constructions));
      } catch (error) {
        if (cancelled) return;
        console.error("[AppHeader] getConstructionList に失敗しました", error);
        toast.error("現場一覧の取得に失敗しました");
      } finally {
        if (!cancelled) {
          setConstructionsLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [client]);

  useEffect(() => {
    // 現場が未選択のときは何もしない。契約一覧のクリアは
    // `handleConstructionChange` 側で行うため、ここで setState する必要はない。
    // （現場が「選択済み → 未選択」に戻る遷移はこの画面には存在しない）
    if (selectedConstructionId === undefined) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      setContractsLoading(true);
      try {
        const res = await client.getContractList({ constructionId: selectedConstructionId });
        if (cancelled) return;
        setContracts(toSelectOptions(res.contracts));
      } catch (error) {
        if (cancelled) return;
        console.error("[AppHeader] getContractList に失敗しました", error);
        toast.error("契約一覧の取得に失敗しました");
      } finally {
        if (!cancelled) {
          setContractsLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [client, selectedConstructionId]);

  const handleConstructionChange = (value: string) => {
    // 現場を切り替えた時点では契約が未確定なので、setProject はまだ呼ばない。
    setSelectedConstructionId(Number(value));
    setContracts([]);
  };

  const handleContractChange = (value: string) => {
    if (selectedConstructionId === undefined) return;
    setProject(selectedConstructionId, Number(value));
  };

  // 現場を切り替えた直後は、前の現場に属する契約IDを選択済みに見せない。
  const contractValue =
    contractId !== undefined && selectedConstructionId === constructionId ? String(contractId) : "";

  return (
    <header className="sticky top-0 z-50 flex h-14 w-full items-center border-b bg-green-800 text-white">
      <div className="flex w-full items-center gap-3 px-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold whitespace-nowrap">RCDE frontend-sdk example</span>
          <Badge variant="secondary" className="whitespace-nowrap">
            @i-con/frontend-sdk
          </Badge>
        </div>

        <Separator orientation="vertical" className="mx-1 h-4 bg-white/20" />

        <div className="flex flex-1 items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/80 whitespace-nowrap">現場</span>
            <Select
              value={selectedConstructionId !== undefined ? String(selectedConstructionId) : ""}
              onValueChange={handleConstructionChange}
              disabled={constructionsLoading}
            >
              <SelectTrigger
                size="sm"
                className="w-56 border-white/30 bg-white/10 text-white data-[placeholder]:text-white/60"
              >
                <SelectValue placeholder="現場を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>現場</SelectLabel>
                  {constructions.map((construction) => (
                    <SelectItem key={construction.id} value={String(construction.id)}>
                      {construction.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {constructionsLoading && <Loader2 className="size-4 animate-spin text-white/80" />}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-white/80 whitespace-nowrap">契約</span>
            <Select
              value={contractValue}
              onValueChange={handleContractChange}
              disabled={selectedConstructionId === undefined || contractsLoading}
            >
              <SelectTrigger
                size="sm"
                className="w-56 border-white/30 bg-white/10 text-white data-[placeholder]:text-white/60"
              >
                <SelectValue placeholder="契約を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>契約</SelectLabel>
                  {contracts.map((contract) => (
                    <SelectItem key={contract.id} value={String(contract.id)}>
                      {contract.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {contractsLoading && <Loader2 className="size-4 animate-spin text-white/80" />}
          </div>

          {constructionId === undefined && (
            <Badge variant="warning" className="whitespace-nowrap">
              現場と契約を選択してください
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 hover:text-white"
            onClick={onOpenUpload}
          >
            <Upload />
            アップロード
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 hover:text-white"
            onClick={onOpenSimpleDialog}
          >
            <Boxes />
            RCDE 最小構成
          </Button>
        </div>
      </div>
    </header>
  );
}
