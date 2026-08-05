import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// フックが依存する 3 つのコンテキストは差し替える（重い three 系の読み込みも回避するため factory で完全置換）
vi.mock("../contexts/client", () => ({ useClient: vi.fn() }));
vi.mock("../contexts/contractFiles", () => ({ useContractFiles: vi.fn() }));
vi.mock("../contexts/referencePoint", () => ({ useReferencePoint: vi.fn() }));

import { useClient } from "../contexts/client";
import type { ContractFile, ContractFileContainer } from "../contexts/contractFiles";
import { useContractFiles } from "../contexts/contractFiles";
import { useReferencePoint } from "../contexts/referencePoint";
import { deriveFileStatusLabels, type PendingUploads } from "../lib/contractFileStatus";
import { useContractFileActions } from "./useContractFileActions";

/**
 * useEffect を持たないフックなので、SSR の単発レンダリングで戻り値を捕捉すれば十分。
 * useMemo / useCallback / useState はいずれもマウント時に評価される。
 */
function captureHook<T>(useHook: () => T): T {
  let captured: T | undefined;
  const Probe = () => {
    captured = useHook();
    return null;
  };
  renderToStaticMarkup(createElement(Probe));
  return captured as T;
}

const uploadedAt = "2024-11-19T06:56:31Z";

/** PCLOD 完了済みファイル */
const completedFile: ContractFile = {
  id: 1,
  name: "completed.las",
  uploadedAt,
  batchProcessingResult: { id: 100, status: 3 },
};

const toggleVisibilityMock = vi.fn();
const focusFileByIdMock = vi.fn<(fileId: number) => Promise<boolean>>();
const getContractFileDownloadUrlMock =
  vi.fn<(contractId: number, contractFileId: number) => Promise<{ presignedURL?: string }>>();
const windowOpenMock = vi.fn();

function makeContainer(file: ContractFile, visible: boolean): ContractFileContainer {
  return { file, visible };
}

/** テスト対象のコンテキスト戻り値をデフォルト状態に設定する */
function setupMocks(overrides?: {
  containers?: ContractFileContainer[];
  client?: unknown;
  project?: { constructionId: number; contractId: number };
}) {
  vi.mocked(useContractFiles).mockReturnValue({
    containers: overrides?.containers ?? [],
    toggleVisibility: toggleVisibilityMock,
    // 未使用だが型を満たすためのダミー
    load: vi.fn(),
    updateFiles: vi.fn(),
  });
  vi.mocked(useReferencePoint).mockReturnValue({
    point: undefined as never,
    change: vi.fn(),
    save: vi.fn(),
    focusFileById: focusFileByIdMock,
  });
  vi.mocked(useClient).mockReturnValue({
    client:
      "client" in (overrides ?? {})
        ? (overrides?.client as never)
        : ({ getContractFileDownloadUrl: getContractFileDownloadUrlMock } as never),
    project:
      "project" in (overrides ?? {}) ? overrides?.project : { constructionId: 1, contractId: 5 },
    initialize: vi.fn(),
    setProject: vi.fn(),
  } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
  focusFileByIdMock.mockResolvedValue(true);
  getContractFileDownloadUrlMock.mockResolvedValue({ presignedURL: "https://dl.example.com/file" });
  vi.stubGlobal("window", { open: windowOpenMock });
  setupMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// テストは元 UI のサイドバー機能リスト 1〜5 の順に並べている。
// サイドバー機能リストは以下の通り。
// 1. ファイル一覧の行データ生成（登録済み containers ＋ アップロード中 pendingUploads のマージ）
// 2. ステータス判定（アップロード状況・PCLOD状況・完了判定）
// 3. 表示/非表示トグル
// 4. フォーカス（バウンディングボックス中心へ基準点移動 = focusFileById へ委譲）
// 5. ダウンロード（署名付きURL取得 → 別タブ表示）

// ---------------------------------------------------------------------------
// 1: ファイル一覧の行データ生成（登録済み containers ＋ アップロード中 pendingUploads のマージ）
// テスト内容は以下の通り。
// 1.【正常系】登録済みファイルとアップロード中ファイルをマージして返す
// 2.【正常系】すでに登録済みの ID と重複するアップロード中エントリは除外する
// 3.【正常系】引数を省略した場合は空の pendingUploads として扱う
// ---------------------------------------------------------------------------
describe("1 ファイル一覧の行データ生成（rows）", () => {
  // 【正常系】
  it("登録済みファイルとアップロード中ファイルをマージして返す", () => {
    setupMocks({ containers: [makeContainer(completedFile, true)] });
    const pendingUploads: PendingUploads = { 99: { name: "pending.las" } };

    const { rows } = captureHook(() => useContractFileActions(pendingUploads));

    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ type: "container", container: makeContainer(completedFile, true) });
    expect(rows[1]).toEqual({ type: "pending", contractFileId: 99, name: "pending.las" });
  });

  // 【正常系】
  it("すでに登録済みの ID と重複するアップロード中エントリは除外する", () => {
    setupMocks({ containers: [makeContainer(completedFile, true)] });
    const pendingUploads: PendingUploads = { 1: { name: "dup.las" }, 2: { name: "new.las" } };

    const { rows } = captureHook(() => useContractFileActions(pendingUploads));

    // id=1 は登録済みなので pending からは除外され、id=2 のみ残る
    expect(rows).toHaveLength(2);
    expect(rows.filter((r) => r.type === "pending")).toEqual([
      { type: "pending", contractFileId: 2, name: "new.las" },
    ]);
  });

  // 【正常系】
  it("引数を省略した場合は空の pendingUploads として扱う", () => {
    setupMocks({ containers: [makeContainer(completedFile, true)] });

    const { rows } = captureHook(() => useContractFileActions());

    expect(rows).toHaveLength(1);
    expect(rows[0].type).toBe("container");
  });
});

// ---------------------------------------------------------------------------
// 2: ステータス表示（getFileStatus）
// ステータスラベルの導出ロジック自体は deriveFileStatusLabels の単体テスト
// （src/lib/contractFileStatus.test.ts）で網羅する。ここではフックが
// pendingUploads から isPendingUpload を内部判定して委譲することのみ確認する。
// テスト内容は以下の通り。
// 1.【正常系】pendingUploads に含まれるファイルは「アップロード中」を返す（内部判定）
// 2.【正常系】pendingUploads に無いファイルは deriveFileStatusLabels(file, false) と一致する
// ---------------------------------------------------------------------------
describe("2 ステータス表示（getFileStatus）", () => {
  // 【正常系】呼び出し側に isPendingUpload を委ねず、フックが pendingUploads から判定する
  it("pendingUploads に含まれるファイルは「アップロード中」を返す", () => {
    setupMocks({ containers: [makeContainer(completedFile, true)] });

    const { getFileStatus } = captureHook(() =>
      useContractFileActions({ 1: { name: "uploading.las" } })
    );

    expect(getFileStatus(completedFile)).toEqual({ upload: "アップロード中", pclod: "-" });
  });

  // 【正常系】pendingUploads 非該当時は deriveFileStatusLabels に委譲した結果を返す
  it("pendingUploads に無いファイルは deriveFileStatusLabels(file, false) と一致する", () => {
    setupMocks({ containers: [makeContainer(completedFile, true)] });

    const { getFileStatus } = captureHook(() => useContractFileActions());

    expect(getFileStatus(completedFile)).toEqual(deriveFileStatusLabels(completedFile, false));
  });
});

// ---------------------------------------------------------------------------
// 3: 表示/非表示トグル
// テスト内容は以下の通り。
// 1.【正常系】コンテキストの toggleVisibility を呼び出す
// ---------------------------------------------------------------------------
describe("3 表示/非表示トグル（toggleVisibility）", () => {
  // 【正常系】
  it("コンテキストの toggleVisibility を呼び出す", () => {
    const container = makeContainer(completedFile, true);
    setupMocks({ containers: [container] });

    const { toggleVisibility } = captureHook(() => useContractFileActions());
    toggleVisibility(container);

    expect(toggleVisibilityMock).toHaveBeenCalledTimes(1);
    expect(toggleVisibilityMock).toHaveBeenCalledWith(container);
  });
});

// ---------------------------------------------------------------------------
// 4: フォーカス（バウンディングボックス中心へ基準点移動 = focusFileById へ委譲）
// テスト内容は以下の通り。
// 1.【正常系】file.id を指定して focusFileById を呼び出す
// 2.【異常系】file.id が undefined のときは focusFileById を呼ばない
// ---------------------------------------------------------------------------
describe("4 フォーカス（focusFile）", () => {
  // 【正常系】
  it("file.id を指定して focusFileById を呼び出し、その結果を返す", async () => {
    const { focusFile } = captureHook(() => useContractFileActions());
    const result = await focusFile(completedFile);

    expect(focusFileByIdMock).toHaveBeenCalledTimes(1);
    expect(focusFileByIdMock).toHaveBeenCalledWith(1);
    expect(result).toBe(true);
  });

  // 【異常系】
  it("file.id が undefined のときは focusFileById を呼ばず false を返す", async () => {
    const { focusFile } = captureHook(() => useContractFileActions());
    const result = await focusFile({ name: "no-id.las" } as ContractFile);

    expect(focusFileByIdMock).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 5: ダウンロード（署名付きURL取得 → 別タブ表示）
// テスト内容は以下の通り。
// 1.【正常系】署名付き URL を取得して別タブで開く
// 2.【正常系/境界値】contractFileId が 0 でも URL 取得を行う
// 3.【異常系】presignedURL が undefined のときは開かない
// 4.【異常系】presignedURL が空文字のときは開かない
// 5.【異常系】レスポンスが undefined のときは例外を投げず開かない
// 6.【異常系】getContractFileDownloadUrl が reject しても例外を投げず握りつぶす
// 7.【異常系】project が未設定のときは URL 取得も行わない
// 8.【異常系】client が未初期化のときは URL 取得も行わない
// 9.【異常系】file.id が undefined のときは URL 取得も行わない
// 10.【異常系】file 自体が undefined でも例外を投げず URL 取得も行わない
// ---------------------------------------------------------------------------
describe("5 ダウンロード（downloadFile）", () => {
  // 【正常系】
  it("署名付き URL を取得して別タブで開き true を返す", async () => {
    const { downloadFile } = captureHook(() => useContractFileActions());
    const result = await downloadFile(completedFile);

    expect(getContractFileDownloadUrlMock).toHaveBeenCalledWith(5, 1);
    expect(windowOpenMock).toHaveBeenCalledWith(
      "https://dl.example.com/file",
      "_blank",
      "noopener,noreferrer"
    );
    expect(result).toBe(true);
  });

  // 【正常系/境界値】contractFileId=0 は undefined ではないため通常どおり処理する
  it("contractFileId が 0 でも URL 取得を行う", async () => {
    const { downloadFile } = captureHook(() => useContractFileActions());
    const result = await downloadFile({ id: 0, name: "zero.las" } as ContractFile);

    expect(getContractFileDownloadUrlMock).toHaveBeenCalledWith(5, 0);
    expect(windowOpenMock).toHaveBeenCalledWith(
      "https://dl.example.com/file",
      "_blank",
      "noopener,noreferrer"
    );
    expect(result).toBe(true);
  });

  // 【異常系】
  it("presignedURL が undefined のときは開かず false を返す", async () => {
    getContractFileDownloadUrlMock.mockResolvedValue({});

    const { downloadFile } = captureHook(() => useContractFileActions());
    const result = await downloadFile(completedFile);

    expect(getContractFileDownloadUrlMock).toHaveBeenCalledWith(5, 1);
    expect(windowOpenMock).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });

  // 【異常系】空文字は無効な URL として扱い開かない
  it("presignedURL が空文字のときは開かず false を返す", async () => {
    getContractFileDownloadUrlMock.mockResolvedValue({ presignedURL: "" });

    const { downloadFile } = captureHook(() => useContractFileActions());
    const result = await downloadFile(completedFile);

    expect(getContractFileDownloadUrlMock).toHaveBeenCalledWith(5, 1);
    expect(windowOpenMock).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });

  // 【異常系】レスポンス本体が undefined でも分割代入で落ちない
  it("レスポンスが undefined のときは例外を投げず false を返す", async () => {
    getContractFileDownloadUrlMock.mockResolvedValue(undefined as never);

    const { downloadFile } = captureHook(() => useContractFileActions());

    await expect(downloadFile(completedFile)).resolves.toBe(false);
    expect(windowOpenMock).not.toHaveBeenCalled();
  });

  // 【異常系】API 呼び出しが reject しても呼び出し側へ例外を伝播させず false を返す
  it("getContractFileDownloadUrl が reject しても例外を投げず false を返す", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    getContractFileDownloadUrlMock.mockRejectedValue(new Error("network error"));

    const { downloadFile } = captureHook(() => useContractFileActions());

    await expect(downloadFile(completedFile)).resolves.toBe(false);
    expect(windowOpenMock).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  // 【異常系】
  it("project が未設定のときは URL 取得も行わず false を返す", async () => {
    setupMocks({ project: undefined });

    const { downloadFile } = captureHook(() => useContractFileActions());
    const result = await downloadFile(completedFile);

    expect(getContractFileDownloadUrlMock).not.toHaveBeenCalled();
    expect(windowOpenMock).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });

  // 【異常系】
  it("client が未初期化のときは URL 取得も行わず false を返す", async () => {
    setupMocks({ client: undefined });

    const { downloadFile } = captureHook(() => useContractFileActions());
    const result = await downloadFile(completedFile);

    expect(getContractFileDownloadUrlMock).not.toHaveBeenCalled();
    expect(windowOpenMock).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });

  // 【異常系】
  it("file.id が undefined のときは URL 取得も行わず false を返す", async () => {
    const { downloadFile } = captureHook(() => useContractFileActions());
    const result = await downloadFile({ name: "no-id.las" } as ContractFile);

    expect(getContractFileDownloadUrlMock).not.toHaveBeenCalled();
    expect(windowOpenMock).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });

  // 【異常系】呼び出し側の誤用（file 未指定）でも落ちない
  it("file 自体が undefined でも例外を投げず false を返す", async () => {
    const { downloadFile } = captureHook(() => useContractFileActions());

    await expect(downloadFile(undefined as unknown as ContractFile)).resolves.toBe(false);
    expect(getContractFileDownloadUrlMock).not.toHaveBeenCalled();
    expect(windowOpenMock).not.toHaveBeenCalled();
  });
});
