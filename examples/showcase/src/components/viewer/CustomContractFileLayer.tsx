"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ContractFileView,
  CoordinateSystem,
  useClient,
  useContractFiles,
  useReferencePoint,
  type ContractFileProps,
  type ViewerFileMemoryEstimate,
} from "@i-con/frontend-sdk";
import type { PointCloudMeta } from "@i-con/pcd-viewer";
import { toast } from "sonner";
import { useWorkspace } from "@/components/workspace/WorkspaceProvider";
import { formatBytes, formatNumber } from "@/lib/format";

/**
 * 公開 API の `ContractFileView` を自前で直接使うデモ。
 *
 * `Viewer` は表示中のファイルを内部で `ContractFileView` として描画するが、
 * 同じコンポーネントを利用側が単体で使うこともできる。
 * ここでは指定された 1 ファイルを、Viewer 本体とは別のパラメータ
 * （位置・点サイズ・不透明度・座標系）で重ねて描画する。
 */
export function CustomContractFileLayer() {
  const { customFileLayerFileId, pushEvent } = useWorkspace();
  const { client, project } = useClient();
  const { containers } = useContractFiles();
  const { point } = useReferencePoint();

  // 取得済みメタデータは対象ファイル ID とセットで持つ。ID だけの state にすると
  // 対象を切り替えた直後に「前のファイルのメタデータ」で描画してしまう一方、
  // effect の中で同期的にクリアするのは cascading render になるため避ける。
  const [metaEntry, setMetaEntry] = useState<{ fileId: number; meta: PointCloudMeta } | undefined>(
    undefined
  );
  // onMemoryEstimateChange はタイル読み込みのたびに発火するため、
  // 合計バイト数が実際に変わったときだけイベントログへ流す。
  const lastTotalBytesRef = useRef<number | undefined>(undefined);

  const container = containers.find((c) => c.file.id === customFileLayerFileId);
  const file = container?.file;

  useEffect(() => {
    if (client === undefined || project === undefined || customFileLayerFileId === undefined) {
      return;
    }

    // 取得完了前に対象ファイルが切り替わったら、古いレスポンスを捨てる。
    let cancelled = false;

    client
      .getContractFileMetadata({ ...project, contractFileId: customFileLayerFileId })
      .then((data) => {
        if (cancelled) return;
        // RCDE API のレスポンス型と pcd-viewer の PointCloudMeta は
        // 別々に定義されているため、SDK 内部と同じくキャストして受け渡す。
        setMetaEntry({
          fileId: customFileLayerFileId,
          meta: data as unknown as PointCloudMeta,
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error("[CustomContractFileLayer] メタデータの取得に失敗しました:", error);
        toast.error("独自レイヤー用のメタデータ取得に失敗しました");
        setMetaEntry(undefined);
      });

    return () => {
      cancelled = true;
    };
  }, [client, project, customFileLayerFileId]);

  // 対象が切り替わった直後は前のファイルのメタデータが残っているので、ID 一致で弾く。
  const meta =
    metaEntry !== undefined && metaEntry.fileId === customFileLayerFileId
      ? metaEntry.meta
      : undefined;

  const handleMemoryEstimateChange = useCallback(
    (estimate: ViewerFileMemoryEstimate) => {
      if (lastTotalBytesRef.current === estimate.totalBytes) {
        return;
      }
      lastTotalBytesRef.current = estimate.totalBytes;

      pushEvent({
        kind: "info",
        label: `独自 ContractFileView のメモリ推定（ファイル ID: ${estimate.fileId}）`,
        detail: `タイル ${formatNumber(estimate.loadedTileCount)} 件 / 圧縮 ${formatBytes(
          estimate.compressedBytes
        )} / デコード後 ${formatBytes(estimate.decodedBytes)} / 合計 ${formatBytes(
          estimate.totalBytes
        )}`,
      });
    },
    [pushEvent]
  );

  if (customFileLayerFileId === undefined || file === undefined || meta === undefined) {
    return null;
  }

  // `ContractFileProps` は SDK が公開している props 型。全プロパティを明示して、
  // `Viewer` が内部で何を渡しているのかを 1 か所で読めるようにする。
  const viewProps: ContractFileProps = {
    file,
    meta,
    referencePoint: point,
    selected: false,
    // Viewer 本体が描画する同じファイルとぴったり重なって見分けが付かなくなるため、
    // Z 方向へ 30m ずらして「自前描画のコピー」だと分かるようにする。
    translation: { x: 0, y: 0, z: 30 },
    rotation: { x: 0, y: 0, z: 0 },
    inspectorPointSize: 2,
    inspectorOpacity: 100,
    // RCDE の点群は右手系 Z Up なので変換なしの値を指定する。
    inspectorCoordinateSystem: CoordinateSystem.RightHandedZUp,
    onMemoryEstimateChange: handleMemoryEstimateChange,
  };

  return <ContractFileView {...viewProps} />;
}
