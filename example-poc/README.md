# RCDE PoC Viewer

RCDE Frontend SDK のサンプルアプリケーション。Client ID と Client Secret だけで動作する軽量版。

## 特徴

- **Docker / DB 不要**: `npm install && npm run dev` だけで起動
- **2-legged / 3-legged 認証**: どちらの認証方式もサポート
- **clientSecret の保護**: サーバーサイド（API Route）でのみ使用、ブラウザに露出しない
- **統合 SDK**: `@i-con/frontend-sdk` のみで 3D ビューア + API 操作が可能
- **現場・契約の自動作成**: 2-legged API 経由でテストデータをワンクリック作成（受注者アカウントや承認フロー不要）

---

## クイックスタート

### 1. RCDE 側の準備（3ステップ）

#### 1-1. RCDE アカウント + 企業の作成

1. https://rcde.jp にアクセス
2. 「新規登録」からアカウントを作成する
3. メールアドレス認証を完了し、ログインする
4. 初回ログイン後、企業の作成を求められるので、企業名を入力して作成する（例: `テスト企業`）

> 企業は OAuth アプリや現場を管理する単位です。PoC を試すには 1 つ必要です。

#### 1-2. OAuth アプリケーションの登録

1. 管理画面の「API連携」や「OAuth アプリケーション」メニューを開く
2. 「新規作成」をクリック
3. アプリ名（例: `PoC Viewer`）を入力して作成
4. 作成後に表示される **Client ID** と **Client Secret** を控える

> **Client Secret は一度しか表示されない場合があるので、必ずこの時点で控えること。**

#### 1-3. （3-legged 認証のみ）Redirect URI の登録

3-legged 認証を使う場合は、作成した OAuth アプリの設定画面で Redirect URI を追加する:

```
http://localhost:3000/api/auth/callback
```

2-legged 認証のみ使う場合はこのステップは不要。

#### RCDE 側の準備チェックリスト

| 項目 | 必要か | 備考 |
|---|---|---|
| RCDE アカウント | **必要** | 新規登録 |
| 企業 | **必要** | 初回ログイン時に作成を求められる |
| OAuth アプリ | **必要** | Client ID / Secret を取得 |
| Redirect URI | 3-legged のみ | `http://localhost:3000/api/auth/callback` |
| 現場（Construction） | **不要** | アプリ内で自動作成 |
| 契約項目（Contract） | **不要** | アプリ内で自動作成 |

> **現場・契約の手動作成は不要です。** PoC アプリのログイン後、現場が存在しない場合は「テストデータを作成」ボタンが表示され、ワンクリックで現場と契約が自動作成されます。2-legged API では受注者アカウントや承認フローは不要です（バックエンド側でダミーユーザーが自動設定され、承認も自動で完了します）。

---

### 2. 前提条件

- Node.js 22.x（`node -v` で確認）
- npm 10.x

Docker やデータベースは不要。

### 3. SDK のビルド

本プロジェクトはローカルの SDK（`@i-con/frontend-sdk`）を参照しているため、先に SDK をビルドする:

```bash
# リポジトリルート（rcde-frontend-sdk/）で実行
npm install --legacy-peer-deps
npm run build
```

> `--legacy-peer-deps` が必要な理由: `pcd-viewer` パッケージが `three@^0.161.0` を要求しているが、SDK は `three@^0.171.0` を使用しているため peer dependency の競合が発生する。`--legacy-peer-deps` でこの競合チェックをスキップして問題なく動作する。

### 4. PoC プロジェクトのセットアップ

```bash
cd example-poc
npm install
```

### 5. 環境変数の設定

```bash
cp .env.example .env
```

`.env` を編集し、RCDE で取得した値を設定:

```bash
# サーバーサイドのみ（ブラウザに露出しない）
RCDE_CLIENT_ID=取得したClient ID
RCDE_CLIENT_SECRET=取得したClient Secret
RCDE_API_BASE_URL=https://api.rcde.jp
AUTH_TYPE=2legged

# クライアントサイド（ブラウザに公開）
NEXT_PUBLIC_RCDE_API_BASE_URL=https://api.rcde.jp
```

#### AUTH_TYPE の選択

| 値 | 対象 | 動作 |
|---|---|---|
| `2legged` | 開発・テスト向け | Client ID + Secret で直接トークン取得。ユーザーのログイン画面なし。OAuth アプリに紐づく企業全体の権限でアクセス |
| `3legged` | エンドユーザー向け | ユーザーが RCDE のログイン画面で個人認証。そのユーザーがアクセス権を持つ現場のみ表示される |

まずは `2legged` で動作確認するのが簡単。

### 6. 開発サーバーの起動

```bash
npm run dev
```

### 7. ブラウザでアクセス

1. http://localhost:3000 を開く
2. ログイン画面が表示される
3. **「2-legged 認証でログイン」** ボタンをクリック
4. 認証が成功すると `/viewer` にリダイレクトされる
5. **現場・契約の選択画面**が表示される:
   - 現場がまだ無い場合 → **「テストデータを作成」ボタン**をクリック → 現場+契約が自動作成される
   - 現場がある場合 → 現場一覧から選択 → 契約を選択
6. 3D 点群ビューアが表示される

---

## 環境変数

| 変数名 | サイド | 説明 |
|---|---|---|
| `RCDE_CLIENT_ID` | サーバー | RCDE OAuth Client ID |
| `RCDE_CLIENT_SECRET` | サーバー | RCDE OAuth Client Secret |
| `RCDE_API_BASE_URL` | サーバー | RCDE API ベース URL |
| `AUTH_TYPE` | サーバー | 認証方式（`2legged` or `3legged`） |
| `NEXT_PUBLIC_RCDE_API_BASE_URL` | クライアント | ブラウザ向け RCDE API URL |

`NEXT_PUBLIC_` プレフィックスが付いた変数のみブラウザに公開される。`RCDE_CLIENT_SECRET` にこのプレフィックスを付けないこと。

---

## トラブルシューティング

| 症状 | 原因・対処 |
|---|---|
| `Module not found: @i-con/frontend-sdk` | SDK ルート（`rcde-frontend-sdk/`）で `npm run build` が未実行 |
| ログインボタンクリック後に認証エラー | `.env` の `RCDE_CLIENT_ID` / `RCDE_CLIENT_SECRET` が未設定または間違い |
| 「テストデータを作成」でエラー | 2-legged 認証でログインしていることを確認。3-legged では自動作成未対応 |
| ビューアが真っ白 | 指定した `constructionId` / `contractId` が RCDE 上に存在しない |
| 3-legged でコールバックエラー | RCDE 管理画面の Redirect URI に `http://localhost:3000/api/auth/callback` を登録 |
| SDK の `npm install` で peer dependency エラー | `npm install --legacy-peer-deps` を実行（`pcd-viewer` と `three` のバージョン競合のため） |
| `npm install` でその他のエラー | Node.js 22.x であることを確認（`node -v`） |

---

## 設計ドキュメント

詳細な設計については [docs/](docs/README.md) を参照。

| ID | カテゴリ | 内容 |
|---|---|---|
| [A](docs/A_設計思想/) | 設計思想 | PoC の目的、設計判断 |
| [B](docs/B_アーキテクチャ/) | アーキテクチャ | システム構成、フォルダ構成 |
| [C](docs/C_認証設計/) | 認証設計 | 2-legged / 3-legged 認証フロー |
| [D](docs/D_SDK統合設計/) | SDK統合設計 | api-sdk 統合方針 |
| [E](docs/E_ビューア統合/) | ビューア統合 | RCDE コンポーネント |
| [F](docs/F_開発ガイド/) | 開発ガイド | セットアップ、機能差分 |
