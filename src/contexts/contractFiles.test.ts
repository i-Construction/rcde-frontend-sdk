import { describe, expect, it } from "vitest";
import type { ContractFile, ContractFileContainer } from "./contractFiles";
import { toggleContainerVisibility } from "./contractFiles";

const uploadedAt = "2024-11-19T06:56:31Z";

function createContainer(file: ContractFile, visible = true): ContractFileContainer {
  return { file, visible };
}

describe("表示・非表示の切り替え（toggleContainerVisibility）", () => {
  describe("正常系", () => {
    it("ID を持つファイルの表示を切り替えたとき、そのファイルだけ表示状態が反転する", () => {
      const target = createContainer({ id: 1, name: "first.las", uploadedAt });
      const other = createContainer({ id: 2, name: "second.las", uploadedAt });

      const toggled = toggleContainerVisibility([target, other], target);

      expect(toggled.map((container) => container.visible)).toEqual([false, true]);
    });

    it("一覧の再取得でコンテナが作り直されていても、ID が一致するファイルの表示を切り替えられる", () => {
      const clicked = createContainer({ id: 1, name: "first.las", uploadedAt });
      const rebuilt = createContainer({ id: 1, name: "first.las", uploadedAt });
      const other = createContainer({ id: 2, name: "second.las", uploadedAt });

      const toggled = toggleContainerVisibility([rebuilt, other], clicked);

      expect(toggled.map((container) => container.visible)).toEqual([false, true]);
    });
  });

  describe("異常系", () => {
    it("ID を読めないファイルが 2 件あるとき、片方を切り替えても、もう片方の表示状態は変わらない", () => {
      const target = createContainer({ name: "first.las", uploadedAt });
      const other = createContainer({ name: "second.las", uploadedAt });

      const toggled = toggleContainerVisibility([target, other], target);

      expect(toggled.map((container) => container.visible)).toEqual([false, true]);
    });

    it("ID を読めないファイルの表示を切り替えたとき、ID を持つファイルの表示状態は変わらない", () => {
      const target = createContainer({ name: "broken.las", uploadedAt });
      const identified = createContainer({ id: 1, name: "first.las", uploadedAt });

      const toggled = toggleContainerVisibility([target, identified], target);

      expect(toggled.map((container) => container.visible)).toEqual([false, true]);
    });

    it("ID を読めないファイルが 3 件あるとき、切り替えた 1 件だけが非表示になる", () => {
      const containers = [
        createContainer({ name: "first.las", uploadedAt }),
        createContainer({ name: "second.las", uploadedAt }),
        createContainer({ name: "third.las", uploadedAt }),
      ];

      const toggled = toggleContainerVisibility(containers, containers[1]);

      expect(toggled.map((container) => container.visible)).toEqual([true, false, true]);
    });
  });
});
