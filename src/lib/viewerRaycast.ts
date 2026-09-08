import { Box3, Camera, Raycaster, Vector2, Vector3 } from "three";

export const rayIntersectBox = (
  ray: { origin: Vector3; direction: Vector3 },
  box: Box3
): Vector3 | null => {
  const invDir = new Vector3(1 / ray.direction.x, 1 / ray.direction.y, 1 / ray.direction.z);
  const t1 = (box.min.x - ray.origin.x) * invDir.x;
  const t2 = (box.max.x - ray.origin.x) * invDir.x;
  const t3 = (box.min.y - ray.origin.y) * invDir.y;
  const t4 = (box.max.y - ray.origin.y) * invDir.y;
  const t5 = (box.min.z - ray.origin.z) * invDir.z;
  const t6 = (box.max.z - ray.origin.z) * invDir.z;

  const tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)), Math.min(t5, t6));
  const tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)), Math.max(t5, t6));

  // direction 成分が 0 のとき NaN が生じうるためガード
  if (Number.isNaN(tmin) || Number.isNaN(tmax)) {
    return null;
  }

  if (tmax < 0 || tmin > tmax) {
    return null;
  }

  const t = tmin > 0 ? tmin : tmax;
  return ray.origin.clone().add(ray.direction.clone().multiplyScalar(t));
};

export type RaycastView = {
  boundingBox: Box3;
  id?: number;
};

type RaycastResult<T extends RaycastView> = {
  view: T;
  distance: number;
  intersectionPoint: Vector3;
};

export const raycastViews = <T extends RaycastView>(
  ndc: Vector2,
  camera: Camera,
  raycaster: Raycaster,
  views: T[],
  referencePoint: Vector3
): RaycastResult<T> | null => {
  raycaster.setFromCamera(ndc, camera);
  const ray = raycaster.ray;

  let closest: RaycastResult<T> | null = null;

  for (const view of views) {
    const offsetBoundingBox = view.boundingBox.clone();
    offsetBoundingBox.translate(referencePoint);

    const intersection = rayIntersectBox(ray, offsetBoundingBox);
    if (intersection) {
      const distance = ray.origin.distanceTo(intersection);
      if (!closest || distance < closest.distance) {
        closest = { view, distance, intersectionPoint: intersection };
      }
    }
  }

  return closest;
};
