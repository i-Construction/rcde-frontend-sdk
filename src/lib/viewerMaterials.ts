import type { Object3D } from "three";
import { clamp } from "./viewerMath";

/**
 * 外観適用で書き込む可能性のあるマテリアルのプロパティだけを表す形。
 * three の Material は実装ごとに持つプロパティが違うため、必要な分だけを optional で受ける。
 */
type AppearanceMaterial = {
  size?: number;
  uniforms?: Record<string, { value?: number }>;
  opacity?: number;
  transparent?: boolean;
  needsUpdate?: boolean;
};

/**
 * マテリアルへ適用する外観設定。
 * 指定されたプロパティだけを書き込み、undefined のものは既存の値に触れない。
 */
export type MaterialAppearance = {
  /** 点の大きさ。0〜5 に丸めて適用する。 */
  pointSize?: number;
  /** 不透明度（パーセント）。0〜100 に丸めたうえで 0〜1 へ変換して適用する。 */
  opacity?: number;
};

/**
 * root とその配下すべてのマテリアルへ外観設定を適用する。
 * root 自身がマテリアルを持つ場合も対象に含む。
 */
export const applyAppearanceToMaterials = (
  root: Object3D | null,
  appearance: MaterialAppearance
): void => {
  if (!root) return;

  const { pointSize, opacity } = appearance;
  if (pointSize === undefined && opacity === undefined) return;

  // 既定値で埋めないこと（`clamp(opacity ?? 100, ...)` などにしない）。埋めると
  // ファイル単位で片方だけを指定したときに、もう片方が既定値へ巻き戻る。
  // viewerMaterials.test.ts の「〜だけを指定したとき、〜は元の値のまま残る」3 件が
  // この回帰を検出する。
  const clampedPointSize = pointSize === undefined ? undefined : clamp(pointSize, 0, 5);
  const opacity01 = opacity === undefined ? undefined : clamp(opacity, 0, 100) / 100;

  root.traverse((obj: Object3D) => {
    const mat = (obj as { material?: AppearanceMaterial }).material;
    if (!mat) return;

    if (clampedPointSize !== undefined) {
      if (typeof mat.size === "number") {
        mat.size = clampedPointSize;
        mat.needsUpdate = true;
      }
      if (mat.uniforms?.pointSize?.value !== undefined) {
        mat.uniforms.pointSize.value = clampedPointSize;
      }
    }

    if (opacity01 !== undefined) {
      if (mat.uniforms?.opacity?.value !== undefined) {
        mat.uniforms.opacity.value = opacity01;
      }
      if (typeof mat.opacity === "number") {
        mat.opacity = opacity01;
        if (opacity01 < 1 && mat.transparent !== true) mat.transparent = true;
        mat.needsUpdate = true;
      }
    }
  });
};
