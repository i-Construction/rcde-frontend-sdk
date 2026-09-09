# showcase

[`@i-con/frontend-sdk`](https://github.com/i-Construction/rcde-frontend-sdk) の**公開 API 全機能**を 1 つの画面で試せるサンプルアプリです。

SDK が export しているコンポーネント・フック・クラス・ユーティリティ・型を余さず使い、それぞれが「どこで・どう呼ばれているか」をコード上で追えるようにしてあります。網羅の対応表は [docs/FEATURE_COVERAGE.md](docs/FEATURE_COVERAGE.md) にまとめました。

## 目次

- [できること](#できること)
- [セットアップ](#セットアップ)
- [画面構成](#画面構成)
- [アーキテクチャ](#アーキテクチャ)
- [SDK の参照方法](#sdk-の参照方法)
- [ディレクトリ構成](#ディレクトリ構成)
- [開発コマンド](#開発コマンド)
- [つまずきやすいポイント](#つまずきやすいポイント)

## できること

| 分類              | 内容                                                                                                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 点群ビューア      | `Viewer` を `contractFileIds` 以外の全 prop 指定で表示。地図 / ライト / グリッド / ギズモ / 基準点軸の各 R3F オプションをツールバーから切り替え                      |
| ファイル一覧      | `useContractFileActions` の全メンバー（表示切替・フォーカス・ダウンロード・ステータス判定）と、`useContractFiles` の `load` / `updateFiles` の違い                   |
| ステータス表示    | `deriveFileStatus` / `isPclodCompleted` / `isFileStatusActive` / `isBatchProcessingStatus` を使い、アップロード状態と PCLOD 変換状態を区別して表示                   |
| アップロード      | `uploadContractFile`（単発）と `uploadContractFileMultipart`（分割＋進捗）を選んで実行。アップロード中のファイルは一覧に仮の行として並ぶ                             |
| 距離計測          | `MeasurementHandler` で点を打ち、`MeasurementView` で確定線を常時表示                                                                                                |
| 基準点            | `useReferencePoint` の `point` / `change` / `focusFileById`。`ReferencePointAxis` を自前で描画して長さ・太さを変更                                                   |
| 表示・Transform   | `ViewerBridge` の `setAppearance` / `setTransform` / `reset` / `addListener`。`window.postMessage` 経由で外部から制御できることを確認できる                          |
| メモリ監視        | `memoryMonitoring` の全オプション。サンプリング間隔と estimate / jsHeap / page それぞれの閾値を変更しながら、サンプル / アラート / レベル変化の 3 コールバックを観察 |
| イベント          | `onObjectClick` / `onObjectHover` / レガシーの `onContractFileClick` / `ViewerBridge.addListener` を 1 つのログに時系列で流す                                        |
| REST API          | `RCDEClient` の全 12 メソッドを引数を編集して実行し、レスポンス JSON をそのまま確認                                                                                  |
| 独自 R3F レイヤー | `Viewer` の `children` / `positionOffsetComponent` / `auxiliaryContent` に自前の要素を差し込む。`ContractFileView` を単体で使ったコピー描画も含む                    |
| 最小構成デモ      | `RCDE` コンポーネントを 1 つ置くだけの構成をダイアログで別途表示。プロバイダを自分で並べる版との差が比較できる                                                       |

## セットアップ

### 1. 認証情報を用意する

RCDE でアプリケーションを作成し、クライアント ID とシークレットを発行します。手順は [rcde-api-sdk の「事前準備」](https://github.com/i-Construction/rcde-api-sdk?tab=readme-ov-file#事前準備) を参照してください。

### 2. 環境変数を設定する

```bash
cp .env.example .env
```

`.env` を編集します。

| 変数                                  | 公開範囲     | 説明                                                                    |
| ------------------------------------- | ------------ | ----------------------------------------------------------------------- |
| `RCDE_CLIENT_ID`                      | サーバーのみ | 必須。RCDE で発行したクライアント ID                                    |
| `RCDE_CLIENT_SECRET`                  | サーバーのみ | 必須。同シークレット                                                    |
| `RCDE_API_BASE_URL`                   | サーバーのみ | RCDE API の URL。既定 `https://api.rcde.jp`                             |
| `NEXT_PUBLIC_RCDE_PROXY_BASE_URL`     | ブラウザ     | SDK の `app.baseUrl` に渡す値。既定 `/api/rcde`（後述のプロキシを指す） |
| `NEXT_PUBLIC_DEFAULT_CONSTRUCTION_ID` | ブラウザ     | 任意。起動直後に開く現場 ID。未指定ならヘッダーのセレクタで選ぶ         |
| `NEXT_PUBLIC_DEFAULT_CONTRACT_ID`     | ブラウザ     | 任意。同じく契約 ID                                                     |

シークレットは `NEXT_PUBLIC_` を付けない変数に置いてください。付けるとバンドルに埋め込まれてブラウザから読めてしまいます。

### 3. 起動する

```bash
yarn install
yarn dev
```

<http://localhost:3000> を開きます。認証情報が未設定のときは、画面に設定手順が表示されます。

## 画面構成

```
┌──────────────────────────────────────────────────────────────┐
│ ヘッダー: 現場 / 契約セレクタ、アップロード、最小構成デモ    │
├────────────┬────────────────────────────┬────────────────────┤
│ 左ペイン   │ 中央ペイン                 │ 右ペイン           │
│            │                            │                    │
│ ファイル   │ Viewer + ツールバー        │ インスペクタ       │
│ 一覧       │ (計測 / R3F フラグ /       │ (6 タブ)           │
│            │  メモリ監視トグル)         │                    │
└────────────┴────────────────────────────┴────────────────────┘
```

ペインの幅は境界をドラッグして変えられます（`react-resizable-panels`）。

- **左ペイン** ([FileListSidebar](src/components/sidebar/FileListSidebar.tsx)): 契約ファイルの一覧。行ごとに表示切替・フォーカス・ダウンロード、選択するとステータス判定ユーティリティの結果を並べたカードが開きます。処理中のファイルがある間は一覧を自動で取り直します。
- **中央ペイン** ([ViewerCanvas](src/components/viewer/ViewerCanvas.tsx) / [ViewerToolbar](src/components/viewer/ViewerToolbar.tsx)): 点群ビューア本体と、その上に重ねたツールバー。
- **右ペイン** ([InspectorPanel](src/components/inspector/InspectorPanel.tsx)): 表示 / Transform / 基準点 / メモリ / イベント / API の 6 タブ。

## アーキテクチャ

### 2-legged 認証と API プロキシ

`clientId` / `clientSecret` はサーバー側に閉じ込め、ブラウザにはアクセストークンだけを渡します。RCDE API はブラウザからの直接呼び出しに CORS 許可を出していないため、同一オリジンのプロキシを経由します。

```
ブラウザ                     Next.js サーバー                  RCDE API
   │                              │                              │
   │ GET /api/auth/token          │                              │
   ├─────────────────────────────>│ POST /ext/v2/auth/token      │
   │                              ├─────────────────────────────>│
   │  { token }                   │  { accessToken, expiresAt }  │
   │<─────────────────────────────┤<─────────────────────────────┤
   │                              │                              │
   │ RCDEClient の各リクエスト     │                              │
   │ GET /api/rcde/ext/v2/...     │ Authorization を転送         │
   ├─────────────────────────────>├─────────────────────────────>│
   │<─────────────────────────────┤<─────────────────────────────┤
```

| ファイル                                                                   | 役割                                                                                                            |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| [src/lib/rcde-2legged.ts](src/lib/rcde-2legged.ts)                         | トークン取得とプロセス内キャッシュ。期限が近いときだけ再取得し、同時呼び出しは 1 本にまとめる                   |
| [src/app/api/auth/token/route.ts](src/app/api/auth/token/route.ts)         | ブラウザにアクセストークンだけを返す。シークレットは返さない                                                    |
| [src/app/api/rcde/[...path]/route.ts](src/app/api/rcde/[...path]/route.ts) | RCDE API への転送プロキシ。`Authorization` をそのまま中継する                                                   |
| [src/hooks/useRcdeSession.ts](src/hooks/useRcdeSession.ts)                 | トークンを取得して `RCDEAppConfig` を組み立てる。`app` の参照が変わると SDK が再初期化するため `useMemo` で固定 |

`RCDEClient` は `baseUrl` の後ろに `/ext/v2/authenticated/...` を組み立てるので、`baseUrl` を `/api/rcde` にすればパスがそのままプロキシへ乗ります。

> **本番アプリでこの構成をそのまま使わないでください。**
> SDK は `app.token` を受け取る設計なので、このサンプルは `/api/auth/token` でアクセストークンをブラウザへ渡しています。しかし 2-legged トークンは**アプリ全体の権限**を持つため、ブラウザに露出させるとそのアプリで見える全データにアクセスできてしまいます。実運用では、トークンをブラウザに渡さずプロキシ側で `Authorization` を注入する、あるいはユーザー単位の 3-legged 認証を使う構成を検討してください。

### 状態管理

SDK の Context（`ClientProvider` / `ContractFilesProvider` / `ReferencePointProvider`）は、ファイル一覧・表示状態・基準点といった SDK 内部の関心事を持ちます。一方でツールバーとインスペクタとビューアで共有したい UI 状態（R3F フラグ、メモリ監視設定、計測点、選択中ファイル、再取得トリガーなど）は SDK の管轄外なので、[WorkspaceProvider](src/components/workspace/WorkspaceProvider.tsx) にまとめました。

```
AppShell                      … 認証状態で画面を切り替える
└─ WorkspaceProvider          … アプリ側の UI 状態
   └─ ViewerProviders         … SDK の Context 3 種
      └─ Workspace            … 3 ペインシェル
         ├─ FileListSidebar
         ├─ ViewerCanvas + ViewerToolbar
         └─ InspectorPanel
```

`ReferencePointProvider` は内部で `useClient` と `useContractFiles` を呼ぶため、この 3 つは**この順序で**ネストする必要があります。

## SDK の参照方法

このリポジトリ内のサンプルなので、`examples/standalone` と同じくリポジトリルートをシンボリックリンクで参照します。

```json
"@i-con/frontend-sdk": "link:../../"
```

参照するのは `dist` ではなく `src` です。[next.config.mjs](next.config.mjs) で `../../src` を指す alias を張り、`transpilePackages` に加えてビルド対象にしています。ルートで `yarn build` を先に走らせる必要はなく、SDK 側を編集すればそのまま反映されます。

SDK が npm へ公開されたら、次のように差し替えられます。

1. `package.json` の依存をバージョン指定（例 `"@i-con/frontend-sdk": "^0.1.0"`）に変更する
2. `next.config.mjs` から `@i-con/frontend-sdk` の alias と `transpilePackages` のエントリを削除する（`dist` が入るため不要）
3. `tsconfig.json` の `paths` から `@i-con/frontend-sdk` の 2 エントリを削除する
4. SDK が直接 import している `@mui/material` / `@emotion/react` / `@emotion/styled` / `chroma-js` / `js-quadtree` / `pngjs` は SDK 自身の依存として解決されるので、本プロジェクトの依存から外せる
5. [src/types/pngjs-browser.d.ts](src/types/pngjs-browser.d.ts) も不要になる（`pngjs/browser` の型を補うためのファイル）

## ディレクトリ構成

```
src/
├── app/
│   ├── api/auth/token/route.ts      2-legged トークン発行
│   ├── api/rcde/[...path]/route.ts  RCDE API プロキシ
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── AppShell.tsx                 認証状態による画面切り替え
│   ├── SimpleRcdeDialog.tsx         RCDE コンポーネントの最小構成デモ
│   ├── layout/AppHeader.tsx         現場 / 契約セレクタ
│   ├── workspace/
│   │   ├── Workspace.tsx            3 ペインシェル
│   │   └── WorkspaceProvider.tsx    アプリ側の共有 UI 状態
│   ├── sidebar/
│   │   ├── FileListSidebar.tsx      ファイル一覧・ステータス
│   │   └── UploadModal.tsx          単発 / 分割アップロード
│   ├── viewer/
│   │   ├── ViewerProviders.tsx      SDK Context 3 種
│   │   ├── ViewerCanvas.tsx         Viewer 本体
│   │   ├── ViewerToolbar.tsx        計測 / R3F フラグ / メモリ監視
│   │   ├── MeasurementLayer.tsx     距離計測
│   │   ├── CustomR3FLayer.tsx       自前 ReferencePointAxis
│   │   └── CustomContractFileLayer.tsx  ContractFileView 単体利用
│   ├── inspector/
│   │   ├── InspectorPanel.tsx       6 タブ
│   │   ├── AppearancePanel.tsx      setAppearance / 座標系
│   │   ├── TransformPanel.tsx       setTransform / reset
│   │   ├── ReferencePointPanel.tsx  useReferencePoint
│   │   ├── MemoryPanel.tsx          memoryMonitoring
│   │   ├── EventLogPanel.tsx        クリック / ホバー / Bridge
│   │   └── ApiPlaygroundPanel.tsx   RCDEClient 全メソッド
│   └── ui/                          shadcn/ui コンポーネント
├── hooks/useRcdeSession.ts
├── lib/
│   ├── env.ts                       NEXT_PUBLIC_* の読み出し
│   ├── format.ts                    バイト数・座標の整形
│   └── rcde-2legged.ts              サーバー専用の認証処理
└── types/pngjs-browser.d.ts
docs/FEATURE_COVERAGE.md              公開 API と使用箇所の対応表
```

## 開発コマンド

| コマンド            | 内容                         |
| ------------------- | ---------------------------- |
| `yarn dev`          | 開発サーバー（webpack）      |
| `yarn build`        | 本番ビルド（webpack）        |
| `yarn start`        | ビルド結果の起動             |
| `yarn lint`         | ESLint（フラットコンフィグ） |
| `yarn format`       | Prettier で整形              |
| `yarn format:check` | 整形済みかを確認             |

`dev` と `build` に `--webpack` を付けているのは、SDK の `src` 直参照 alias と React インスタンスの一本化を webpack の `resolve.alias` で行っているためです。Turbopack ではこの設定が効きません。

## つまずきやすいポイント

**`Viewer` が初期化されるまで `useClient().client` は `undefined`**
`Viewer` が `app` を受け取って `initialize` を呼んだ時点でクライアントが生成されます。それより前に API を叩きたい場合は [Workspace](src/components/workspace/Workspace.tsx) のように `new RCDEClient(...)` で別途作ってください。ヘッダーの現場 / 契約セレクタはこの方式です。

**`app` の参照は固定する**
`RCDEAppConfig` のオブジェクトを毎レンダー作り直すと、`Viewer` が初期化を繰り返します。`useRcdeSession` は `useMemo` で参照を固定しています。

**React と R3F のインスタンスは 1 つに保つ**
SDK の `src` はリポジトリルート配下にあるため、放っておくとルートの `node_modules`（SDK が開発用に持つ React 18）が解決され、このアプリの React 19 と混ざって `ReactCurrentBatchConfig` 未定義で落ちます。`next.config.mjs` の `resolve.modules` でこのアプリ直下の `node_modules` を探索順の先頭に置き、`tsconfig.json` の `paths` でも React の型を同じ場所へ向けています。`@react-three/fiber` も二重化すると Reconciler が壊れるので同様に alias で固定しています。

ただしサーバービルドで `react` を alias してはいけません。Next が RSC 用に `react-server` 条件付きの実体へ向けている alias を潰してしまい、`useContext` が `null` になります。React の alias はクライアント側だけに掛けています。

**`load` と `updateFiles` の違い**
`useContractFiles.load` は表示状態を作り直します（第 2 引数の `visibleIds` を省略すると全件表示、空配列を渡すと全件非表示）。一覧を取り直しても表示 / 非表示を保ちたい場合は `updateFiles` を使ってください。左ペインの「全表示 / 全非表示」が `load`、「表示状態を保持して差し替え」が `updateFiles` です。なお一覧そのものを RCDE から取り直すのは `contractFilesRefetchKey` の更新（ヘッダーの再取得ボタン）で、これは `Viewer` 側の責務です。

**アップロード完了は一覧に即座には出ない**
RCDE 側で PCLOD 変換が終わるまで表示できません。`isFileStatusActive` が `true` の行が残っている間だけ一覧をポーリングし、すべて落ち着いたら止める、という制御を左ペインで実装しています。

## ライセンス

サンプルコードとして提供しています。
