import { Box, Circle, Point, QuadTree } from 'js-quadtree';
import { Camera, Vector3 } from 'three';

const buildTree = (props: {
  camera: Camera;
  points: Vector3[];
}): {
  tree: QuadTree;
} => {
  const { points, camera } = props;

  const tree = new QuadTree(new Box(-1, -1, 2, 2));

  const map = new Map<string, Point>();
  const precision = 1e4;
  let insertedCount = 0;
  let outOfBoundsCount = 0;

  points.forEach((p, id) => {
    const proj = p.clone().project(camera);
    const x = Math.round(proj.x * precision) / precision;
    const y = Math.round(proj.y * precision) / precision;

    // NDC範囲外の点をスキップ
    if (x < -1 || x > 1 || y < -1 || y > 1) {
      outOfBoundsCount++;
      return;
    }

    const key = `${x},${y}`;
    if (!map.has(key)) {
      const pt = new Point(x, y, { id });
      map.set(key, pt);
      tree.insert(pt);
      insertedCount++;
    }
  });

  console.log(`[Picking] buildTree: ${points.length} points, ${insertedCount} inserted, ${outOfBoundsCount} out of bounds`);

  return {
    tree,
  };
};

const pick = (
  position: {
    x: number;
    y: number;
  },
  tree: QuadTree,
  points: Vector3[]
): Vector3 | undefined => {
  // 半径を大きくして検出しやすくする
  const results = tree.query(new Circle(position.x, position.y, 0.05));
  if (results.length > 0) {
    const point = closest(position, results);
    const { id } = point.data;
    return points[id].clone();
  }
  return undefined;
};

const closest = (
  point: {
    x: number;
    y: number;
  },
  points: Point[]
): Point => {
  const distances = points.map((p) => {
    const dx = point.x - p.x;
    const dy = point.y - p.y;
    return dx * dx + dy * dy;
  });
  const d = Math.min(...distances);
  return points[distances.indexOf(d)];
};

export { buildTree, closest, pick };
