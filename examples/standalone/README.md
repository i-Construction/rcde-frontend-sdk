# RCDE Frontend SDK Example（スタンドアロン型）

`@i-con/frontend-sdk` をブラウザから直接使う Next.js サンプルアプリです。
3D 点群ビューア、ヘッダーからの現場・契約切り替え、ファイルアップロード、左サイドバーのファイル一覧・表示切り替え、
ファイルステータスツールチップ（PCLOD / アップロード状況）、基準点ギズモの追従確認ができます。

## 要件

- Node.js **24.x**（リポジトリルートの Volta 設定: 24.18.0）
- Docker / DB 不要

## 設定手順

### 1. RCDE 側の準備

1. https://rcde.jp でアカウント・企業を作成する
2. OAuth アプリケーションを登録し **Client ID** / **Client Secret** を控える

### 2. SDK のビルド

本サンプルはローカル SDK（`link:../../`）をシンボリックリンク参照します。
開発時は `next.config.js` の webpack alias により SDK は `../../src`、点群ローダーはサンプル側の `@i-con/pcd-viewer@0.0.27`（React 19 対応）を直接参照します。
認証はサンプル内の `src/lib/rcde-client-2-legged.ts` で 2-legged OAuth を実装しており、SDK の `api-server` サブパスは使用しません。

```bash
# リポジトリルート（rcde-frontend-sdk/）で実行
yarn install
yarn build
```

### 3. サンプルのセットアップ

```bash
cd examples/standalone
yarn install
cp .env.example .env
```

`.env` を編集します。

```env
RCDE_CLIENT_ID=取得したClient ID
RCDE_CLIENT_SECRET=取得したClient Secret
RCDE_API_BASE_URL=https://api.rcde.jp

NEXT_PUBLIC_RCDE_API_BASE_URL=https://api.rcde.jp
```

`RCDE_CLIENT_SECRET` に `NEXT_PUBLIC_` を付けないこと（サーバー側のみで使用）。

### 4. 開発サーバー起動

```bash
yarn dev
```

ブラウザで http://localhost:3000 を開きます。

### 5. 操作手順

1. トップページ（`/`）を開くと 2-legged 認証が自動的に始まる
2. 認証完了後 `/viewer` へ遷移する
3. 現場が無い場合は「テストデータを作成」で現場・契約を自動作成する
4. 現場・契約を選択してビューアを表示する
5. ビューア表示後は **ヘッダーの現場・契約セレクト**（パンくず部分）から別の現場・契約に切り替えられる

## ファイルアップロード

左サイドバーのヘッダーにある **「アップロード」** ボタンからモーダルを開き、点群ファイル（`.las` / `.laz` / `.csv` / `.txt` / `.xyz` / `.e57`）と点群属性を指定してアップロードできます。
アップロード中は左サイドバーのファイル一覧に処理中表示が出ます。

## 左サイドバー（ファイル一覧・表示切り替え）

左サイドバーには契約ファイル一覧が表示されます。

- ファイル名ホバーで PCLOD 処理・アップロード状況のツールチップを表示（下記参照）
- 各ファイルの目アイコンで **表示 / 非表示を切り替え**（PCLOD 完了後のみ操作可能）
- フォーカスアイコンでそのファイルの中心へ基準点を移動

## ファイルステータスツールチップの確認

左サイドバーのファイル名にマウスホバーすると、以下が表示されます。

| 行           | 内容                   |
| ------------ | ---------------------- |
| PCLOD処理    | 待機中 / 処理中 / 完了 |
| アップロード | アップロード中 / 完了  |

最新のステータスを確認したい場合は、アップロード完了時に `contractFilesRefetchKey` を更新して再取得してください（`handleUploaded` で実施済み）。

## 基準点ギズモ・基準点ツールバー（本サンプルのみ）

`Viewer` はデフォルトで基準点（シフト後ワールド原点）に X/Y/Z 軸ギズモを表示します。

ビューワー **下部中央** のツールバーから **基準点** ボタンを押すとモーダルが開きます。
基準点保存時に `useReferencePoint().change()` を直接呼びます（DB 保存なし）。
点群のみが移動し、軸ギズモは常にワールド原点に留まることを確認できます。

左サイドバーのファイルフォーカス（`focusFileById`）でも基準点オフセットを変更できます。

## 環境変数

| 変数名                          | 説明                              |
| ------------------------------- | --------------------------------- |
| `RCDE_CLIENT_ID`                | OAuth Client ID（サーバー側）     |
| `RCDE_CLIENT_SECRET`            | OAuth Client Secret（サーバー側） |
| `RCDE_API_BASE_URL`             | RCDE API ベース URL（サーバー側） |
| `NEXT_PUBLIC_RCDE_API_BASE_URL` | ブラウザ向け API URL              |

## 補足

- `node_modules/`、`.next/`、`.env` は git 管理外です（ルート `.gitignore` 参照）。
