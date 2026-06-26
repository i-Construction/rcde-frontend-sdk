# RCDE Frontend SDK Example

`@i-con/frontend-sdk` の動作確認用 Next.js サンプルアプリです。
3D 点群ビューア、ファイルアップロード、ファイルステータスツールチップ（PCLOD / アップロード状況）を確認できます。

## 要件

- Node.js **24.x**（リポジトリルートの Volta 設定: 24.18.0）
- Docker / DB 不要

## クイックスタート

### 1. RCDE 側の準備

1. https://rcde.jp でアカウント・企業を作成する
2. OAuth アプリケーションを登録し **Client ID** / **Client Secret** を控える

### 2. SDK のビルド

本サンプルはローカル SDK（`link:../`）をシンボリックリンク参照します。
開発時は `next.config.js` の webpack alias により SDK は `../src`、点群ローダーは example の `@i-con/pcd-viewer@0.0.27`（React 19 対応）を直接参照します。
認証は example 内の `src/lib/rcde-client-2-legged.ts` で 2-legged OAuth を実装しており、SDK の `api-server` サブパスは使用しません。

```bash
# リポジトリルート（rcde-frontend-sdk/）で実行
yarn install
yarn build
```

### 3. example のセットアップ

```bash
cd example
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

## ファイルステータスツールチップの確認

右サイドバーのファイル名にマウスホバーすると、以下が表示されます。

| 行           | 内容                   |
| ------------ | ---------------------- |
| PCLOD処理    | 待機中 / 処理中 / 完了 |
| アップロード | アップロード中 / 完了  |

点群をアップロードしたあと、DevTools の Network タブで `contractFile` が約 3 秒間隔でポーリングされ、PCLOD 完了後に停止することを確認できます。

## 基準点ツールバー（example のみ）

ビューワー **下部中央** のツールバーから **基準点** ボタンを押すとモーダルが開きます。
X/Y/Z を入力して「保存」で `useReferencePoint().change()` が呼ばれます（DB 保存なし）。

左サイドバーのファイルフォーカス（`focusFileById`）でも基準点オフセットを変更できます。

## 環境変数

| 変数名                          | 説明                              |
| ------------------------------- | --------------------------------- |
| `RCDE_CLIENT_ID`                | OAuth Client ID（サーバー側）     |
| `RCDE_CLIENT_SECRET`            | OAuth Client Secret（サーバー側） |
| `RCDE_API_BASE_URL`             | RCDE API ベース URL（サーバー側） |
| `NEXT_PUBLIC_RCDE_API_BASE_URL` | ブラウザ向け API URL              |

## トラブルシューティング

| 症状                                    | 対処                                                                           |
| --------------------------------------- | ------------------------------------------------------------------------------ |
| `Module not found: @i-con/frontend-sdk` | ルートで `yarn build` を実行する                                               |
| 認証エラー                              | `.env` の Client ID / Secret を確認する                                        |
| ビューアが真っ白                        | 現場・契約 ID が存在するか確認する                                             |
| peer dependency エラー                  | Node 24.x であることを確認し、`yarn install` を再実行する                      |
| `ENOSPC` / `yarn install` が異常に長い  | 下記「ディスク不足・再帰インストール」を参照                                   |
| `camera-controls` の engine エラー      | Node 24.x を使用する（Volta 推奨）。一時的には `yarn install --ignore-engines` |

### ディスク不足・再帰インストール

`file:../` だと SDK 全体が Yarn キャッシュへコピーされ、`example/node_modules` 内に再帰的な `@i-con/frontend-sdk` が生成されてディスクを枯渇することがあります。
本リポジトリでは `link:../`（シンボリックリンク）を使用しています。

再発時は次を実行してください。

```bash
# 1. 再帰的に膨らんだ node_modules を削除
rm -rf /Users/shota-hashimoto/rcde-frontend-sdk/example/node_modules

# 2. 古い Yarn キャッシュを削除（数 GB 解放されることが多い）
yarn cache clean

# 3. 再インストール
cd /Users/shota-hashimoto/rcde-frontend-sdk/example
yarn install
```

## 補足

- `node_modules/`、`.next/`、`.env` は git 管理外です（ルート `.gitignore` 参照）。
- 詳細な設計ドキュメントは [docs/](docs/README.md) を参照してください。
