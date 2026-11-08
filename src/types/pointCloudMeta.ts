/**
 * 点群のバウンディングボックス。
 */
type BoundingBox<T = [number, number, number]> = {
  min: T;
  max: T;
};

// @i-con/pcd-viewer の同名の型と構造を揃えて自前で定義している。
// 向こうの型を import すると型定義の出力が @i-con/pcd-viewer を参照し、
// その types が指す TypeScript のソースが利用側でコンパイルされる。
// ソース中の pngjs/browser には型宣言が無いため、利用側の型検査が落ちる。
// 構造が同じなので、この型の値はそのまま pcd-viewer の <PointCloud meta> へ渡せる。
// （この説明は型定義の出力に含めないよう、JSDoc ではなく行コメントにしている）

/**
 * 点群の LOD メタデータ。`ContractFileView` の `meta` に渡す。
 *
 * @property version - LOD のバージョン
 * @property lod - LOD の段数
 * @property coordinates - LOD ごとのタイル座標とそのバウンディングボックス
 * @property bounds - 点群全体のバウンディングボックス
 */
export type PointCloudMeta<T = [number, number, number]> = {
  version: string;
  lod: number;
  coordinates: {
    [lod: number]: {
      [address: string]: BoundingBox<T>;
    };
  };
  bounds: BoundingBox<T>;
};
