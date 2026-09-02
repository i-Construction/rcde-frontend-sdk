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

  it("初回に表示したいファイル ID を渡していないとき、再取得で新しく現れたファイルは表示の状態で一覧に加わる", () => {
    const previous = [{ file: fileA, visible: false }];

    const containers = mergeContainersPreservingVisibility(previous, [fileA, fileB]);

    expect(toVisibilityByName(containers)).toEqual({ "a.las": false, "b.las": true });
  });

  it("初回に表示したいファイル ID として空の一覧を渡していたとき、再取得で新しく現れたファイルは非表示で一覧に加わる", () => {
    const previous = [{ file: fileA, visible: true }];

    const containers = mergeContainersPreservingVisibility(previous, [fileA, fileB], []);

    expect(toVisibilityByName(containers)).toEqual({ "a.las": true, "b.las": false });
  });

  it("初回に表示したいファイル ID へ含めていた ID のファイルが再取得で新しく現れたとき、表示の状態で一覧に加わる", () => {
    const previous = [{ file: fileA, visible: false }];

    const containers = mergeContainersPreservingVisibility(previous, [fileA, fileB], [2]);

    expect(toVisibilityByName(containers)).toEqual({ "a.las": false, "b.las": true });
  });

  it("ID を持たないファイルが複数あるとき、再取得しても互いの表示状態を引き継がない", () => {
    const firstFileWithoutId: TestFile = { name: "no-id-1.las" };
    const secondFileWithoutId: TestFile = { name: "no-id-2.las" };
    const previous = [
      { file: firstFileWithoutId, visible: true },
      { file: secondFileWithoutId, visible: false },
    ];

    const containers = mergeContainersPreservingVisibility(previous, [
      firstFileWithoutId,
      secondFileWithoutId,
    ]);

    expect(toVisibilityByName(containers)).toEqual({ "no-id-1.las": true, "no-id-2.las": true });
  });

  it("初回に表示したいファイル ID を渡していたとき、ID を持たないファイルは再取得しても非表示になる", () => {
    const fileWithoutId: TestFile = { name: "no-id.las" };
    const previous = [{ file: fileWithoutId, visible: true }];

    const containers = mergeContainersPreservingVisibility(previous, [fileWithoutId], [1]);

    expect(toVisibilityByName(containers)).toEqual({ "no-id.las": false });
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
