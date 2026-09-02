import { describe, expect, it } from "vitest";
import { createContainers, mergeContainersPreservingVisibility } from "./contractFileContainers";

type TestFile = { id?: number; name: string };

const fileA: TestFile = { id: 1, name: "a.las" };
const fileB: TestFile = { id: 2, name: "b.las" };
const fileC: TestFile = { id: 3, name: "c.las" };

/** ファイル名と表示状態だけを取り出して比較しやすくする */
const toVisibilityByName = (containers: { file: TestFile; visible: boolean }[]) =>
  Object.fromEntries(containers.map((container) => [container.file.name, container.visible]));

describe("createContainers（初回ロード）", () => {
  it("表示したいファイル ID を渡すとき、その ID を持つファイルだけが表示になる", () => {
    const containers = createContainers([fileA, fileB, fileC], [1, 3]);

    expect(toVisibilityByName(containers)).toEqual({
      "a.las": true,
      "b.las": false,
      "c.las": true,
    });
  });

  it("表示したいファイル ID を渡さないとき、すべてのファイルが表示になる", () => {
    const containers = createContainers([fileA, fileB]);

    expect(toVisibilityByName(containers)).toEqual({ "a.las": true, "b.las": true });
  });

  it("表示したいファイル ID として空の一覧を渡すとき、すべてのファイルが非表示になる", () => {
    const containers = createContainers([fileA, fileB], []);

    expect(toVisibilityByName(containers)).toEqual({ "a.las": false, "b.las": false });
  });

  it("ID を持たないファイルは、表示したいファイル ID を渡したとき非表示になる", () => {
    const fileWithoutId: TestFile = { name: "no-id.las" };

    const containers = createContainers([fileWithoutId], [1]);

    expect(toVisibilityByName(containers)).toEqual({ "no-id.las": false });
  });
});

describe("mergeContainersPreservingVisibility（再取得）", () => {
  it("再取得の前に表示していたファイルは、再取得したあとも表示のままになる", () => {
    const previous = [{ file: fileA, visible: true }];

    const containers = mergeContainersPreservingVisibility(previous, [fileA]);

    expect(toVisibilityByName(containers)).toEqual({ "a.las": true });
  });

  it("再取得の前に非表示にしていたファイルは、再取得したあとも非表示のままになる", () => {
    const previous = [{ file: fileA, visible: false }];

    const containers = mergeContainersPreservingVisibility(previous, [fileA]);

    expect(toVisibilityByName(containers)).toEqual({ "a.las": false });
  });

  it("再取得で新しく現れたファイルは、表示の状態で一覧に加わる", () => {
    const previous = [{ file: fileA, visible: false }];

    const containers = mergeContainersPreservingVisibility(previous, [fileA, fileB]);

    expect(toVisibilityByName(containers)).toEqual({ "a.las": false, "b.las": true });
  });

  it("再取得で消えたファイルは、一覧から取り除かれる", () => {
    const previous = [
      { file: fileA, visible: true },
      { file: fileB, visible: true },
    ];

    const containers = mergeContainersPreservingVisibility(previous, [fileB]);

    expect(containers.map((container) => container.file.name)).toEqual(["b.las"]);
  });

  it("再取得で同じ ID のファイルの内容が変わったとき、表示状態は保ったまま内容だけが新しくなる", () => {
    const previous = [{ file: fileA, visible: false }];
    const renamedFileA: TestFile = { id: 1, name: "a-processed.las" };

    const containers = mergeContainersPreservingVisibility(previous, [renamedFileA]);

    expect(containers).toEqual([{ file: renamedFileA, visible: false }]);
  });
});
