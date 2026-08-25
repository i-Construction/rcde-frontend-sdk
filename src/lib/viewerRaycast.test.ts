import { describe, expect, it } from "vitest";
import { Box3, PerspectiveCamera, Raycaster, Vector2, Vector3 } from "three";
import { rayIntersectBox, raycastViews, type RaycastView } from "./viewerRaycast";

describe("rayIntersectBox", () => {
  const box = new Box3(new Vector3(0, 0, 0), new Vector3(2, 2, 2));

  it("正面からのレイが交差する", () => {
    const ray = {
      origin: new Vector3(1, 1, -5),
      direction: new Vector3(0, 0, 1).normalize(),
    };
    const result = rayIntersectBox(ray, box);
    expect(result).not.toBeNull();
    expect(result!.x).toBeCloseTo(1);
    expect(result!.y).toBeCloseTo(1);
    expect(result!.z).toBeCloseTo(0);
  });

  it("ボックスの外を通るレイは null を返す", () => {
    const ray = {
      origin: new Vector3(5, 5, -5),
      direction: new Vector3(0, 0, 1).normalize(),
    };
    expect(rayIntersectBox(ray, box)).toBeNull();
  });

  it("ボックスの後方を指すレイは null を返す", () => {
    const ray = {
      origin: new Vector3(1, 1, -5),
      direction: new Vector3(0, 0, -1).normalize(),
    };
    expect(rayIntersectBox(ray, box)).toBeNull();
  });

  it("斜め方向のレイが交差する", () => {
    const ray = {
      origin: new Vector3(-5, 1, 1),
      direction: new Vector3(1, 0, 0).normalize(),
    };
    const result = rayIntersectBox(ray, box);
    expect(result).not.toBeNull();
    expect(result!.x).toBeCloseTo(0);
    expect(result!.y).toBeCloseTo(1);
    expect(result!.z).toBeCloseTo(1);
  });

  it("元のボックスを変更しない", () => {
    const original = new Box3(new Vector3(1, 2, 3), new Vector3(4, 5, 6));
    const ray = {
      origin: new Vector3(2, 3, 0),
      direction: new Vector3(0, 0, 1).normalize(),
    };
    rayIntersectBox(ray, original);
    expect(original.min.x).toBe(1);
    expect(original.min.y).toBe(2);
    expect(original.min.z).toBe(3);
  });
});

describe("raycastViews", () => {
  const camera = new PerspectiveCamera(90, 1, 0.1, 1000);
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();

  const raycaster = new Raycaster();

  const makeView = (
    id: number,
    min: [number, number, number],
    max: [number, number, number]
  ): RaycastView & { id: number; boundingBox: Box3 } => ({
    id,
    boundingBox: new Box3(new Vector3(...min), new Vector3(...max)),
  });

  it("NDC 中央からのレイが正面のオブジェクトにヒットする", () => {
    const views = [makeView(1, [-1, -1, -1], [1, 1, 1])];
    const result = raycastViews(new Vector2(0, 0), camera, raycaster, views, new Vector3(0, 0, 0));
    expect(result).not.toBeNull();
    expect(result!.view.id).toBe(1);
  });

  it("何もない方向のレイは null を返す", () => {
    const views = [makeView(1, [100, 100, 100], [101, 101, 101])];
    const result = raycastViews(new Vector2(0, 0), camera, raycaster, views, new Vector3(0, 0, 0));
    expect(result).toBeNull();
  });

  it("複数のオブジェクトでは最も近いものを返す", () => {
    const views = [makeView(1, [-1, -1, 4], [1, 1, 6]), makeView(2, [-1, -1, -1], [1, 1, 1])];
    const result = raycastViews(new Vector2(0, 0), camera, raycaster, views, new Vector3(0, 0, 0));
    expect(result).not.toBeNull();
    expect(result!.view.id).toBe(1);
  });

  it("referencePoint でオフセットされたバウンディングボックスに対してレイキャストする", () => {
    const views = [makeView(1, [10, 10, -1], [12, 12, 1])];
    const offset = new Vector3(-11, -11, 0);
    const result = raycastViews(new Vector2(0, 0), camera, raycaster, views, offset);
    expect(result).not.toBeNull();
    expect(result!.view.id).toBe(1);
  });

  it("intersectionPoint は referencePoint オフセット済みのワールド座標を返す", () => {
    const views = [makeView(1, [10, 10, -1], [12, 12, 1])];
    const offset = new Vector3(-11, -11, 0);
    const result = raycastViews(new Vector2(0, 0), camera, raycaster, views, offset);
    expect(result).not.toBeNull();
    // boundingBox はオフセット前: [10,10,-1] ~ [12,12,1]
    // オフセット後: [-1,-1,-1] ~ [1,1,1]
    // intersectionPoint はオフセット後のボックスとの交差点（ワールド座標）
    expect(result!.intersectionPoint.z).toBeCloseTo(1);

    // intersectionPoint から referencePoint を引くと boundingBox と同じ座標系
    const local = result!.intersectionPoint.clone().sub(offset);
    const box = result!.view.boundingBox;
    expect(local.x).toBeGreaterThanOrEqual(box.min.x - 0.001);
    expect(local.x).toBeLessThanOrEqual(box.max.x + 0.001);
    expect(local.y).toBeGreaterThanOrEqual(box.min.y - 0.001);
    expect(local.y).toBeLessThanOrEqual(box.max.y + 0.001);
    expect(local.z).toBeGreaterThanOrEqual(box.min.z - 0.001);
    expect(local.z).toBeLessThanOrEqual(box.max.z + 0.001);
  });

  it("元の views の boundingBox を変更しない", () => {
    const views = [makeView(1, [5, 5, -1], [7, 7, 1])];
    const offset = new Vector3(-6, -6, 0);
    raycastViews(new Vector2(0, 0), camera, raycaster, views, offset);
    expect(views[0].boundingBox.min.x).toBe(5);
    expect(views[0].boundingBox.min.y).toBe(5);
    expect(views[0].boundingBox.max.x).toBe(7);
    expect(views[0].boundingBox.max.y).toBe(7);
  });

  it("空の views 配列では null を返す", () => {
    const result = raycastViews(new Vector2(0, 0), camera, raycaster, [], new Vector3(0, 0, 0));
    expect(result).toBeNull();
  });
});
