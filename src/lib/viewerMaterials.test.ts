import { describe, expect, it } from "vitest";
import { BufferGeometry, Group, Object3D, Points, PointsMaterial, ShaderMaterial } from "three";
import { applyAppearanceToMaterials } from "./viewerMaterials";

/** size / opacity / transparent を持ち uniforms を持たない、点群の既定マテリアル。 */
const createPointsWithBasicMaterial = () => {
  const material = new PointsMaterial();
  material.size = 1;
  material.opacity = 1;
  material.transparent = false;
  return new Points(new BufferGeometry(), material);
};

/** uniforms.pointSize / uniforms.opacity を持つ、シェーダ実装のマテリアル。 */
const createPointsWithShaderMaterial = () => {
  const material = new ShaderMaterial({
    uniforms: {
      pointSize: { value: 1 },
      opacity: { value: 1 },
    },
  });
  material.opacity = 1;
  material.transparent = false;
  return new Points(new BufferGeometry(), material);
};

const groupOf = (...children: Object3D[]) => {
  const group = new Group();
  children.forEach((child) => group.add(child));
  return group;
};

describe("applyAppearanceToMaterials", () => {
  it("点の大きさだけを指定したとき、不透明度と透過フラグは元の値のまま残る", () => {
    const points = createPointsWithBasicMaterial();
    points.material.opacity = 0.3;
    points.material.transparent = true;

    applyAppearanceToMaterials(groupOf(points), { pointSize: 2 });

    expect(points.material.size).toBe(2);
    expect(points.material.opacity).toBe(0.3);
    expect(points.material.transparent).toBe(true);
  });

  it("点の大きさだけを指定したとき、uniforms の opacity は元の値のまま残る", () => {
    const points = createPointsWithShaderMaterial();
    points.material.uniforms.opacity.value = 0.3;

    applyAppearanceToMaterials(groupOf(points), { pointSize: 2 });

    expect(points.material.uniforms.pointSize.value).toBe(2);
    expect(points.material.uniforms.opacity.value).toBe(0.3);
  });

  it("不透明度だけを指定したとき、点の大きさは元の値のまま残る", () => {
    const basic = createPointsWithBasicMaterial();
    basic.material.size = 3;
    const shader = createPointsWithShaderMaterial();
    shader.material.uniforms.pointSize.value = 3;

    applyAppearanceToMaterials(groupOf(basic, shader), { opacity: 40 });

    expect(basic.material.size).toBe(3);
    expect(shader.material.uniforms.pointSize.value).toBe(3);
    expect(basic.material.opacity).toBeCloseTo(0.4);
  });

  it("点の大きさと不透明度の両方を指定したとき、どちらも書き換わる", () => {
    const points = createPointsWithBasicMaterial();

    applyAppearanceToMaterials(groupOf(points), { pointSize: 2, opacity: 50 });

    expect(points.material.size).toBe(2);
    expect(points.material.opacity).toBeCloseTo(0.5);
  });

  it("不透明度を 100% 未満にしたとき、透過フラグが有効になる", () => {
    const points = createPointsWithBasicMaterial();

    applyAppearanceToMaterials(groupOf(points), { opacity: 60 });

    expect(points.material.transparent).toBe(true);
  });

  it("不透明度を 100% 未満にしたあと 100% に戻したとき、透過フラグは有効のまま残る", () => {
    const points = createPointsWithBasicMaterial();

    applyAppearanceToMaterials(groupOf(points), { opacity: 60 });
    applyAppearanceToMaterials(groupOf(points), { opacity: 100 });

    expect(points.material.opacity).toBe(1);
    expect(points.material.transparent).toBe(true);
  });

  it("マテリアルを持たないオブジェクトが混ざっていても、マテリアルを持つ子には適用される", () => {
    const plain = new Object3D();
    const points = createPointsWithBasicMaterial();

    expect(() =>
      applyAppearanceToMaterials(groupOf(plain, points), { pointSize: 2, opacity: 50 })
    ).not.toThrow();
    expect(points.material.size).toBe(2);
  });

  it("uniforms を持つマテリアルに適用したとき、uniforms の点の大きさと不透明度が書き換わる", () => {
    const points = createPointsWithShaderMaterial();

    applyAppearanceToMaterials(groupOf(points), { pointSize: 2, opacity: 40 });

    expect(points.material.uniforms.pointSize.value).toBe(2);
    expect(points.material.uniforms.opacity.value).toBeCloseTo(0.4);
  });

  it("uniforms を持たないマテリアルに適用したとき、size と opacity が書き換わる", () => {
    const points = createPointsWithBasicMaterial();

    applyAppearanceToMaterials(groupOf(points), { pointSize: 2, opacity: 40 });

    expect(points.material.size).toBe(2);
    expect(points.material.opacity).toBeCloseTo(0.4);
    expect("uniforms" in points.material).toBe(false);
  });

  it("点の大きさに 5 を超える値を指定したとき、5 に丸められる", () => {
    const points = createPointsWithBasicMaterial();

    applyAppearanceToMaterials(groupOf(points), { pointSize: 10 });

    expect(points.material.size).toBe(5);
  });

  it("点の大きさに負の値を指定したとき、0 に丸められる", () => {
    const points = createPointsWithBasicMaterial();

    applyAppearanceToMaterials(groupOf(points), { pointSize: -1 });

    expect(points.material.size).toBe(0);
  });

  it("不透明度に 100 を超える値を指定したとき、1 に丸められる", () => {
    const points = createPointsWithBasicMaterial();

    applyAppearanceToMaterials(groupOf(points), { opacity: 150 });

    expect(points.material.opacity).toBe(1);
  });

  it("不透明度に負の値を指定したとき、0 に丸められる", () => {
    const points = createPointsWithBasicMaterial();

    applyAppearanceToMaterials(groupOf(points), { opacity: -20 });

    expect(points.material.opacity).toBe(0);
    expect(points.material.transparent).toBe(true);
  });

  it("適用先のオブジェクトが null のとき、何も起こらず例外にもならない", () => {
    expect(() => applyAppearanceToMaterials(null, { pointSize: 2, opacity: 50 })).not.toThrow();
  });

  it("点の大きさも不透明度も指定しないとき、マテリアルは一切書き換わらない", () => {
    const points = createPointsWithBasicMaterial();
    points.material.size = 3;
    points.material.opacity = 0.3;

    applyAppearanceToMaterials(groupOf(points), {});

    expect(points.material.size).toBe(3);
    expect(points.material.opacity).toBe(0.3);
  });
});
