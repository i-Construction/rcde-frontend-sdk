# サイドバー機能 確認チェックリスト

レフト/ライトサイドバーから切り出した機能（`useContractFileActions` フック / example の `ContractFileSidebar`）の動作確認項目。

- 確認場所: example アプリ `/viewer` → 現場・契約を選択後の画面
- 前提: PCLOD 済みの点群ファイルを含む契約
- 関連ロジックの自動テスト: `src/hooks/useContractFileActions.test.ts`

## 1. ファイル一覧表示（`rows`）

- [ ] 登録済みファイルが一覧に表示される
- [ ] 各行にファイル名が表示され、長い名前は省略（...）される
- [ ] ファイルが無い場合「ファイルがありません」と表示される
- [ ] アップロード中ファイル（pending）が一覧末尾に表示される
- [ ] アップロード完了後、pending 行が登録済み行に置き換わる（重複しない）

## 2. ステータス表示（`getFileStatus`）

`getFileStatus` は日本語ラベルではなく状態値（`upload`: `uploading` / `uploaded`、`pclod`: `none` / `waiting` / `processing` / `completed` / `failed` / `unknown`）を返す。文言は example 側の写像で決まる。

- [ ] 各行に「アップロード: xxx」チップが表示される
- [ ] 各行に「PCLOD: xxx」チップが表示される
- [ ] アップロード追跡中の行は `upload: uploading` / `pclod: none` になる（表示は「アップロード中」「-」）
- [ ] PCLOD が失敗したファイルは `pclod: failed` になり、表示が「失敗」になる
- [ ] `pclod: failed` の行は表示切替・フォーカスとも無効のままで、待機中の表示に戻らない

## 3. 表示/非表示切替（`toggleVisibility`）

- [ ] 目のアイコンで表示/非表示が切り替わる
- [ ] 非表示にすると行が薄く（opacity 低下）表示される
- [ ] PCLOD 未完了（`isPclodCompleted` が false）の行はボタンが無効（グレーアウト）

## 4. フォーカス（`focusFile`）

- [ ] フォーカスアイコン押下でビューアが該当ファイルの中心へ移動する（基準点移動）
- [ ] 非表示中・PCLOD 未完了の行ではフォーカスボタンが無効

## 5. ダウンロード（`downloadFile`）

- [ ] 「その他（︙）」メニュー →「ダウンロード」で署名付きURLが別タブで開く
- [ ] URL取得失敗時にクラッシュせず、コンソールにエラーが出る（別タブは開かない）

## 6. PCLOD完了判定（`isPclodCompleted`）

- [ ] PCLOD 完了ファイルのみ表示/フォーカス操作が有効になる

## 7. アップロード起点（`SidebarUploadButton`）

- [ ] サイドバーヘッダーの「アップロード」ボタンからファイル選択・アップロードが開始できる
- [ ] アップロード開始直後に pending 行として一覧に現れる

---

補足:

- 項目 1・2・6 はロジックが自動テスト済み。上記は実UI/ビューア連携の目視確認用。
