import { Matrix4 } from 'three';
import { CoordinateSystemType } from '../bridge/viewerBridge';

export function getUpAxisFromCoordinateSystem(cs: CoordinateSystemType): 'X' | 'Y' | 'Z' {
  if (cs.includes('X_UP')) return 'X';
  if (cs.includes('Y_UP')) return 'Y';
  return 'Z';
}

export function isLeftHanded(cs: CoordinateSystemType): boolean {
  return cs.startsWith('LEFT_HANDED');
}

export function getCoordinateTransformMatrix(cs: CoordinateSystemType): Matrix4 {
  const matrix = new Matrix4();

  // 右手系/左手系の判定
  const leftHanded = isLeftHanded(cs);

  // Up軸の判定
  const upAxis = getUpAxisFromCoordinateSystem(cs);

  // 座標系に応じた変換行列を設定
  // Three.jsはデフォルトで右手系Y-Up
  if (upAxis === 'Z' && !leftHanded) {
    // 右手系 Z-Up: X軸90度回転
    matrix.makeRotationX(Math.PI / 2);
  } else if (upAxis === 'Z' && leftHanded) {
    // 左手系 Z-Up: X軸90度回転 + Z軸反転
    matrix.makeRotationX(Math.PI / 2).multiply(
      new Matrix4().makeScale(1, 1, -1)
    );
  } else if (upAxis === 'X' && !leftHanded) {
    // 右手系 X-Up: Z軸-90度回転
    matrix.makeRotationZ(-Math.PI / 2);
  } else if (upAxis === 'X' && leftHanded) {
    // 左手系 X-Up: Z軸-90度回転 + Z軸反転
    matrix.makeRotationZ(-Math.PI / 2).multiply(
      new Matrix4().makeScale(1, 1, -1)
    );
  } else if (upAxis === 'Y' && leftHanded) {
    // 左手系 Y-Up: Z軸反転のみ
    matrix.makeScale(1, 1, -1);
  }
  // 右手系 Y-Up はデフォルト（単位行列）

  return matrix;
}
