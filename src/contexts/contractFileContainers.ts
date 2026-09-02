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
 * 可視ポリシー（visibleIds）を 1 つのファイルへ当てはめる。
 * visibleIds が undefined のときは全件を表示にする。ID を持たないファイルは
 * visibleIds と照合できないため非表示にする。
 */
const isVisibleByPolicy = (file: FileWithId, visibleIds: number[] | undefined): boolean =>
  visibleIds === undefined ? true : file.id !== undefined && visibleIds.includes(file.id);

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
    visible: isVisibleByPolicy(file, visibleIds),
  }));

/**
 * 再取得用。ファイルの中身は最新へ差し替えつつ、表示・非表示は ID で前回から引き継ぐ。
 * 前回にあって今回無いファイルは取り除く。
 *
 * 前回に無かったファイルには、初回ロードで使った可視ポリシー（visibleIds）を当てはめる。
 * 一律で表示にすると、初回に非表示を指定した利用者の意図に反して、再取得で増えたファイルが
 * 勝手に読み込まれてしまうため。
 *
 * ID を持たないファイルは前回の表示状態と結び付けられないので、可視ポリシーだけで決める。
 * ID を Map のキーにすると、ID を持たないファイルが複数あったときに 1 エントリへ潰れ、
 * 無関係なファイルの表示状態を引き継いでしまう。
 */
export const mergeContainersPreservingVisibility = <TFile extends FileWithId>(
  previousContainers: readonly VisibilityContainer<TFile>[],
  files: readonly TFile[],
  visibleIds?: number[]
): VisibilityContainer<TFile>[] => {
  const visibleByFileId = new Map<number, boolean>();
  for (const container of previousContainers) {
    if (container.file.id === undefined) continue;
    visibleByFileId.set(container.file.id, container.visible);
  }
  return files.map((file) => {
    const previousVisible = file.id === undefined ? undefined : visibleByFileId.get(file.id);
    return {
      file,
      visible: previousVisible ?? isVisibleByPolicy(file, visibleIds),
    };
  });
};
