/**
 * 契約ファイルの表示状態（コンテナ一覧）を組み立てる純粋関数。
 *
 * ContractFilesProvider（contractFiles.tsx）から使う。contractFiles.tsx を import すると
 * 循環参照になるため、ファイルの具体型ではなく「id を持ちうる」という最小の形だけを要求する。
 */

type FileWithId = { id?: number };

type VisibilityContainer<TFile> = {
  file: TFile;
  visible: boolean;
};

/**
 * 初回ロード用。visibleIds を渡したときは、その ID を持つファイルだけを表示にする。
 * visibleIds が undefined のときは全件を表示にする。
 */
export const createContainers = <TFile extends FileWithId>(
  files: readonly TFile[],
  visibleIds?: number[]
): VisibilityContainer<TFile>[] =>
  files.map((file) => ({
    file,
    visible:
      visibleIds === undefined ? true : file.id !== undefined && visibleIds.includes(file.id),
  }));

/**
 * 再取得用。ファイルの中身は最新へ差し替えつつ、表示・非表示は ID で前回から引き継ぐ。
 * 前回に無かったファイルは表示（既定）にし、前回にあって今回無いファイルは取り除く。
 */
export const mergeContainersPreservingVisibility = <TFile extends FileWithId>(
  previousContainers: readonly VisibilityContainer<TFile>[],
  files: readonly TFile[]
): VisibilityContainer<TFile>[] => {
  const visibleByFileId = new Map(
    previousContainers.map((container) => [container.file.id, container.visible])
  );
  return files.map((file) => ({
    file,
    visible: visibleByFileId.get(file.id) ?? true,
  }));
};
