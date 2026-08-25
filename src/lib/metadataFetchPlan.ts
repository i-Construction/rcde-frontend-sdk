/**
 * メタデータの差分フェッチ計画を算出する純粋関数。
 *
 * 表示対象のファイル ID 一覧と既にキャッシュ済みの ID を比較し、
 * 新規にフェッチが必要な ID とキャッシュから除去すべき ID を返す。
 *
 * Viewer のメタデータ取得 effect から呼ばれる。
 */
export type MetadataFetchPlan = {
  /** キャッシュに存在しないためフェッチが必要な ID */
  toFetch: number[];
  /** 表示対象から外れたためキャッシュから削除すべき ID */
  toRemove: number[];
};

export function computeMetadataFetchPlan(
  targetIds: number[],
  cachedIds: Set<number>
): MetadataFetchPlan {
  const targetSet = new Set(targetIds);

  const toFetch = targetIds.filter((id) => !cachedIds.has(id));

  const toRemove: number[] = [];
  for (const id of cachedIds) {
    if (!targetSet.has(id)) {
      toRemove.push(id);
    }
  }

  return { toFetch, toRemove };
}
