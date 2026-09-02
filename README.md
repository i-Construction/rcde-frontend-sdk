# @i-con/frontend-sdk

## 概要

RCDEの機能をフロントエンドアプリケーションで利用するためのSDKです。

本SDKは、RCDE連携型モニタリングアプリのフロントエンド共通機能を提供します。  
Next.js（App Router構成）および React Three Fiber をベースとし、点群ビューア、認証、契約項目管理、ファイルアップロードなどを統合します。

このSDKはReact環境(バージョン18以上)で使用することを前提としています。

---

## 開発環境要件

| 項目       | バージョン      | 備考                                        |
| ---------- | --------------- | ------------------------------------------- |
| Node.js    | **24.x**        | LTS推奨（24.18.0）                          |
| React      | **18.3.1 固定** | Three.js互換のため他バージョン不可          |
| Next.js    | **16.2.9 固定** | Three.js／React Three Fiber間の依存制約あり |
| Vite       | ^6.x            | ライブラリビルド用                          |
| TypeScript | ^5.x            | 型定義完全対応                              |
| Three.js   | ^0.171.0        | `@react-three/fiber` 依存                   |

> ⚠️ **React/Nextバージョンは厳密固定です。**
>
> Three.js と React 18.3.1 / Next.js 16.2.9 の組み合わせでのみビルドが安定します。  
> これ以外のバージョンでは、`react-reconciler` や `r3f` 関連でコンパイルエラーが発生します。

---

## インストール方法

npm、またはyarnを使用してインストールします。

```bash
npm install @i-con/frontend-sdk
# or
yarn add @i-con/frontend-sdk
```

### セットアップ

```bash
# 依存関係インストール
yarn install

# ライブラリビルド
yarn build
```

---

## 構成概要

公開エントリポイントは `src/index.ts` の 1 つだけです。
利用側は常に `@i-con/frontend-sdk` から import します（サブパス import は提供していません）。

```text
src/
├── bridge/       # ViewerBridge（Viewer へのコマンド送信）
├── components/   # RCDE / Viewer / ContractFileView / ReferencePointAxis など
├── contexts/     # ClientProvider / ContractFilesProvider / ReferencePointProvider など
├── hooks/        # useContractFileActions などのカスタムフック
├── lib/          # RCDEClient と R-CDE API 連携・点群読み込みのロジック
├── services/     # ピッキング処理
├── types/        # R-CDE API の共通型定義
└── index.ts      # 公開 API のエントリポイント
```

ビルド成果物は `dist/` に出力され、npm パッケージには `dist/` と `types/` だけが含まれます。

---

## 主な機能

| モジュール                    | 概要                                                                       |
| ----------------------------- | -------------------------------------------------------------------------- |
| `RCDE`                        | Provider 一式と `Viewer` をまとめたルートコンポーネント                    |
| `Viewer`                      | 点群を描画する 3D ビューア本体。Provider を自前構成する場合に使う          |
| `ViewerBridge`                | ビューア外の UI から表示位置・見た目の変更を指示するコマンド送信モジュール |
| `RCDEClient`                  | R-CDE API クライアント（ファイル一覧・メタデータ・アップロードなど）       |
| `useContractFileActions`      | 契約ファイル一覧の行データ生成と表示・フォーカス・ダウンロード操作         |
| `useReferencePoint`           | 基準点座標の取得と更新                                                     |
| `ContractFilesProvider`       | 契約ファイル一覧の保持と表示状態の管理                                     |
| `deriveFileStatus` ほか状態値 | アップロード / PCLOD の状態判定ユーティリティ                              |

---

## サンプルアプリ

`examples/` に 2 つのサンプルがあります。選び分けは [examples/README.md](examples/README.md) を参照してください。

| サンプル                                                         | 使う場面                                           | SDK 依存 |
| ---------------------------------------------------------------- | -------------------------------------------------- | -------- |
| [examples/standalone](examples/standalone/README.md)             | ブラウザから R-CDE の点群を表示・アップロードする  | あり     |
| [examples/webhook-receiver](examples/webhook-receiver/README.md) | R-CDE の点群処理の完了通知を自分のサーバーで受ける | なし     |

`examples/` は公開パッケージには含まれません。

---

## 事前準備

RCDEのサイトでアプリケーションを作成します。
以下の手順に従ってください。

[RCDE API SDK](https://github.com/i-Construction/rcde-api-sdk?tab=readme-ov-file#%E4%BA%8B%E5%89%8D%E6%BA%96%E5%82%99)

---

## 基本的な使用方法

RCDEコンポーネントを配置することでビューワを表示することができます。
RCDEコンポーネントには R-CDE API のアクセストークンを含む `app` 設定と、
表示したい現場のIDと契約IDを渡します。

```tsx
"use client";

import { useMemo } from "react";
import { RCDE, type RCDEAppConfig } from "@i-con/frontend-sdk";

const App = ({
  accessToken,
  constructionId,
  contractId,
}: {
  accessToken: string;
  constructionId: number;
  contractId: number;
}) => {
  // app の参照が変わるたびに内部の RCDEClient が作り直され、
  // ファイル一覧の再取得と表示状態のリセットが起きるためメモ化する
  const app = useMemo<RCDEAppConfig>(
    () => ({
      token: accessToken,
      baseUrl: "/api/rcde",
      authType: "2legged",
    }),
    [accessToken]
  );

  return <RCDE constructionId={constructionId} contractId={contractId} app={app} />;
};
```

`app` に渡す `RCDEAppConfig` のフィールドは次の 3 つです。

| フィールド | 必須 | 内容                                                                                          |
| ---------- | ---- | --------------------------------------------------------------------------------------------- |
| `token`    | 必須 | R-CDE API のアクセストークン。`Authorization: Bearer <token>` として送信されます              |
| `baseUrl`  | 任意 | API のベース URL。省略時は空文字（同一オリジンの相対パス）です                                |
| `authType` | 任意 | `"2legged"`（既定）または `"3legged"`。API パスの接頭辞と一部クエリパラメータが切り替わります |

[事前準備](#事前準備)で作成したアプリケーションの `clientId` / `clientSecret` は、
**SDK には渡しません**。ブラウザに秘匿情報を置かないため、サーバー側でこれらを使って
アクセストークンを発行し、そのトークンだけを `app.token` に渡します。
`examples/standalone` では Next.js の Route Handler がトークン発行と API プロキシを担い、
`baseUrl` にそのプロキシのパス（`/api/rcde`）を指定しています。
ブラウザから R-CDE API を直接呼ぶと CORS で失敗するため、プロキシ経由の構成を推奨します。

### `memoryMonitoring` の使い方

`RCDE` / `Viewer` には、3D 表示まわりのメモリ使用量を監視するための `memoryMonitoring` オプションを渡せます。
点群タイルの読み込み量から算出した推定メモリ量を定期サンプリングし、閾値を超えた場合にアラートを発火できます。

```tsx
"use client";

import { useMemo, useState } from "react";
import {
  RCDE,
  type ViewerMemoryAlert,
  type ViewerMemoryMonitoringOptions,
  type ViewerMemorySample,
} from "@i-con/frontend-sdk";

const MEBIBYTE = 1024 * 1024;

const App = () => {
  const [lastSample, setLastSample] = useState<ViewerMemorySample | undefined>(undefined);
  const [lastAlert, setLastAlert] = useState<ViewerMemoryAlert | undefined>(undefined);

  const memoryMonitoring = useMemo<ViewerMemoryMonitoringOptions>(
    () => ({
      enabled: true,
      sampleIntervalMs: 15000,
      thresholds: {
        warningBytes: 256 * MEBIBYTE,
        criticalBytes: 384 * MEBIBYTE,
        source: "max-available",
        hysteresisBytes: 32 * MEBIBYTE,
      },
      onSample: (sample) => {
        setLastSample(sample);
      },
      onAlert: (alert) => {
        setLastAlert(alert);
      },
      onAlertLevelChange: (level) => {
        if (level === undefined) {
          setLastAlert(undefined);
        }
      },
    }),
    []
  );

  return (
    <RCDE
      constructionId={constructionId}
      contractId={contractId}
      app={app}
      memoryMonitoring={memoryMonitoring}
    />
  );
};
```

主な設定項目は以下の通りです。

- `enabled`: `true` を明示した場合のみ監視を有効化します。省略時は無効です。
- `sampleIntervalMs`: 定期サンプリングの基準間隔です。短くしすぎるとブラウザ負荷が上がるため、`10000` から `30000` ミリ秒程度を推奨します。精密メモリ計測が解決したタイミングでは、この間隔とは別に追加サンプルが発火することがあります。
- `thresholds.warningBytes`: 警告レベルの閾値です。
- `thresholds.criticalBytes`: 危険レベルの閾値です。
- `thresholds.source`: 閾値判定に使う値です。`"estimate"`、`"js-heap"`、`"page"`、`"max-available"` を選べます。未指定時は `"max-available"` として扱います。
- `thresholds.hysteresisBytes`: 閾値付近で警告が連続発火しないようにする戻り幅です。
- `onSample`: サンプル取得時のコールバックです。
- `onAlert`: 閾値超過時のコールバックです。
- `onAlertLevelChange`: アラートレベルが変化したときのコールバックです。`undefined` を受け取ったときは警告解除に利用できます。解除時に渡される `sample` は直前に発火した値のため、`sample.timestamp` が現在時刻より古い場合があります。`memoryMonitoring` プロップを外して無効化した場合、解除通知は最後に有効だった時点のコールバックが呼ばれます。

`onSample` で受け取れる `ViewerMemorySample` には、主に以下の値が含まれます。

- `estimatedViewerBytes`: SDK が推定した Viewer 単位のメモリ量です。PNG キャッシュ保持量ベースであり、LOD タイルの表示/非表示だけでは減少しません。
- `pageBytes`: `performance.measureUserAgentSpecificMemory()` が利用できる場合のページ全体メモリ量です。
- `pageBytesMeasuredAt`: `pageBytes` を取得した時刻（Unix time ミリ秒）です。`pageBytes` は最新サンプル時刻より古い場合があります。
- `jsHeapBytes`: `performance.memory.usedJSHeapSize` が利用できる場合の JS ヒープ量です。
- `loadedFileCount`: メモリ推定対象として読み込み済みのファイル数です。
- `loadedTileCount`: 読み込み済み点群タイル数です。
- `geometryCount`, `textureCount`: Three.js / WebGL の統計情報です。
- `source`: 実際に取得できたメモリ値の種別です。

> 注意:
>
> - `pageBytes` を返す `performance.measureUserAgentSpecificMemory()` はブラウザ依存で、利用できない環境があります。
> - `thresholds.source` に `"page"` や `"js-heap"` を指定しても、その値を取得できない環境では閾値判定は発火しません。
> - `"max-available"` はブラウザや実行環境に応じて `pageBytes` / `jsHeapBytes` / `estimatedViewerBytes` のどれを使うかが変わるため、同じ閾値でも挙動が一致しないことがあります。
> - ブラウザから GPU / WebGL メモリを厳密に取得することは難しいため、SDK では Viewer 推定値をベースに監視します。
> - `estimatedViewerBytes` は PNG キャッシュ保持量ベースのため、ファイルのアンマウントまたは `meta.version` 変更時にリセットされます。
> - タイル集計の flush は `requestAnimationFrame` ベースのため、バックグラウンドタブでは推定値更新が遅延または停止することがあります。
> - アラート表示 UI は SDK ではなく、`onAlert` / `onAlertLevelChange` を使ってアプリケーション側で `Snackbar` や `Alert` を出す構成を推奨します。

---

## ViewerBridgeの使い方

`ViewerBridge` は、すでに描画されている `RCDE` / `Viewer` に対して、
ビューア外の UI（ツールバー、ダイアログ、サイドバーなど）から表示指示を送るためのモジュールです。

Three.js のシーンやカメラを直接触るオブジェクトではありません。
実体は `window.postMessage` の薄いラッパーで、`RCDE_VIEWER_CMD` というチャンネル名を付けた
コマンドを送るだけです。`Viewer` が同じチャンネルの `message` イベントを購読しており、
受け取ったコマンドに応じて内部の state を更新します。
このため React のツリーをまたいでいても、Provider の外からでも呼び出せます。

`Viewer` を描画していない状態で呼んでも例外にはならず、受け手がいないため何も起こりません。
サーバーサイドレンダリング時（`window` が無い環境）も同様に無視されます。

### 基本構成

```tsx
"use client";

import { useEffect } from "react";
import {
  CoordinateSystem,
  ViewerBridge,
  type ViewerAppearance,
  type ViewerTransform,
} from "@i-con/frontend-sdk";

export function ViewerToolbar({ fileId }: { fileId: number }) {
  // Viewer が送るコマンドを購読する（戻り値は購読解除関数）
  useEffect(() => {
    return ViewerBridge.addListener((cmd) => {
      console.log(cmd.type);
    });
  }, []);

  const moveFile = () => {
    const transform: ViewerTransform = {
      // 対象ファイルは fileId で指定する（省略できない）
      fileId,
      translation: { x: 10, y: 0, z: 0 },
      // 単位は度（degree）
      rotation: { x: 0, y: 0, z: 90 },
    };
    ViewerBridge.setTransform(transform);
  };

  const changeAppearance = () => {
    const appearance: ViewerAppearance = {
      pointSize: 3,
      opacity: 80,
      upAxis: "Z",
      coordinateSystem: CoordinateSystem.RightHandedZUp,
      // fileId を省略するとビューア全体（後方互換）の見た目に適用される
      fileId,
    };
    ViewerBridge.setAppearance(appearance);
  };

  return (
    <div>
      <button onClick={moveFile}>移動・回転</button>
      <button onClick={changeAppearance}>見た目を変更</button>
      <button onClick={() => ViewerBridge.reset()}>初期状態に戻す</button>
    </div>
  );
}
```

### 主なAPI一覧

| メソッド                                       | 機能概要                                                             |
| ---------------------------------------------- | -------------------------------------------------------------------- |
| `setTransform(tx: ViewerTransform)`            | `tx.fileId` のファイルに平行移動と回転を適用する                     |
| `setAppearance(app: ViewerAppearance)`         | 点サイズ・不透明度・カメラの上方向・座標系を設定する                 |
| `reset()`                                      | 位置・回転・見た目・カメラの上方向を初期値へ戻す                     |
| `addListener(handler: (cmd: Command) => void)` | 同チャンネルのコマンドを購読する。戻り値の関数を呼ぶと購読を解除する |

`ViewerTransform` は `{ translation, rotation, fileId }` です。
`fileId` は R-CDE に登録されている契約ファイルの ID で、**必須**です。
`translation` / `rotation` は `{ x, y, z }` の数値で、`rotation` の単位は度です。
拡縮（`scale`）は扱いません。

`ViewerAppearance` は `{ pointSize, opacity, upAxis?, coordinateSystem?, fileId? }` です。
`pointSize` は 0〜5、`opacity` は 0〜100 に丸められます。
`fileId` を指定するとそのファイルだけに、省略するとビューア全体に適用されます。
`upAxis` は `"Y"` / `"Z"` で、カメラの上方向にのみ効きます。
`coordinateSystem` には `CoordinateSystem` 定数（`RightHandedZUp` など 6 種）を渡します。

`reset()` は点サイズ 2・不透明度 100・カメラ上方向 Z にリセットし、
`setTransform` / `setAppearance` でファイル単位に積んだ設定をすべて破棄します。

### 補足

`setTransform` で移動・回転したファイルは、`onContractFileClick` / `onObjectClick` /
`onObjectHover` の当たり判定に反映されません。判定には移動前のバウンディングボックスが
使われます。

---

## RCDEClientの使い方

`RCDEClient` は R-CDE API を叩くクライアントです。
契約ファイルの一覧取得、点群メタデータの取得、ファイルのアップロード、
現場・契約の一覧取得などを提供します。

`RCDE` を使っている場合、`app` の内容から生成済みのインスタンスを
`useClient()` で取り出せます。こちらが通常の使い方です。

```tsx
"use client";

import { useClient } from "@i-con/frontend-sdk";

function ContractFileCount({ contractId }: { contractId: number }) {
  const { client } = useClient();

  const load = async () => {
    // Provider のマウント直後は client が undefined になりうる
    if (!client) return;
    const { contractFiles } = await client.getContractFileList({ contractId });
    console.log(contractFiles.length);
  };

  return <button onClick={load}>件数を数える</button>;
}
```

ビューアを描画せず API だけを使う場合は、直接生成することもできます。

```ts
import { RCDEClient } from "@i-con/frontend-sdk";

const client = new RCDEClient({
  accessToken,
  baseUrl: "/api/rcde",
  authType: "2legged",
});
```

### コンストラクタのオプション（`RCDEClientOptions`）

すべて任意です。

| オプション    | 既定値             | 内容                                                                                              |
| ------------- | ------------------ | ------------------------------------------------------------------------------------------------- |
| `accessToken` | なし               | 指定すると `Authorization: Bearer <token>` を全リクエストに付与する                               |
| `baseUrl`     | `""`               | API のベース URL。省略時は同一オリジンの相対パスになる                                            |
| `authType`    | `"2legged"`        | `"2legged"` は `/ext/v2/authenticated`、`"3legged"` は `/ext/v2/userAuthenticated` を接頭辞に使う |
| `fetchImpl`   | グローバル `fetch` | 差し替え用の fetch 実装。テストやプロキシ層の差し込みに使う                                       |

`RCDEAppConfig` の `token` がここでは `accessToken` という名前になる点に注意してください。

### 主なメソッド

| メソッド                                                            | 戻り値                  | 内容                                               |
| ------------------------------------------------------------------- | ----------------------- | -------------------------------------------------- |
| `getContractFileList({ contractId })`                               | `{ contractFiles }`     | 契約ファイル一覧。PCLOD のバッチ処理状態を含む     |
| `getContractFileMetadata({ contractId, contractFileId })`           | メタデータ JSON         | 点群の LOD メタデータ                              |
| `getContractFileImagePosition({ contractId, contractFileId, ... })` | `ArrayBuffer`           | 点群タイルの位置バッファ                           |
| `getContractFileImageColor({ contractId, contractFileId, ... })`    | `ArrayBuffer`           | 点群タイルの色バッファ                             |
| `getContractFileDownloadUrl(contractId, fileId)`                    | `{ url, presignedURL }` | ダウンロード用の署名付き URL                       |
| `uploadContractFile(params)`                                        | レスポンス JSON         | 一括アップロード。ファイル全体を 1 回の PUT で送る |
| `uploadContractFileMultipart(params)`                               | `{ contractFileId }`    | 分割アップロード。大容量ファイル向け               |
| `getConstructionList()`                                             | `{ constructions }`     | 現場一覧                                           |
| `getConstruction(constructionId)`                                   | `Construction`          | 現場 1 件                                          |
| `createConstruction(params)`                                        | レスポンス JSON         | 現場を作成する                                     |
| `getContractList({ constructionId })`                               | `{ contracts }`         | 契約一覧                                           |
| `createContract({ constructionId, name, contractedAt })`            | レスポンス JSON         | 契約を作成する                                     |

いずれも 2xx 以外のレスポンスを受けた時点で `Error` を throw します（戻り値で失敗を返しません）。

> `createContract` は R-CDE が必須にしている項目をまだ送っていないため、現時点では 400 で失敗します。

### 大容量ファイルの分割アップロード（`uploadContractFileMultipart`）

`uploadContractFile` はファイル全体を 1 回の PUT で送るため、大きな点群ファイルでは
タイムアウトしやすくなります。`uploadContractFileMultipart` はファイルをチャンクへ分割し、
パートごとに署名付き URL へ送信します。

```ts
import type { RCDEClient } from "@i-con/frontend-sdk";

const MEBIBYTE = 1024 * 1024;

async function upload(client: RCDEClient, contractId: number, file: File) {
  const buffer = await file.arrayBuffer();

  const { contractFileId } = await client.uploadContractFileMultipart({
    contractId,
    name: file.name,
    buffer,
    // 1 パートのサイズ。省略時は 100 MiB
    chunkSize: 50 * MEBIBYTE,
    // 契約ファイルが採番された直後に呼ばれる。アップロード中の行を一覧へ出すのに使う
    onContractFileCreated: (createdId) => {
      console.log("registered", createdId);
    },
    onUploadProgress: (completedParts, totalParts) => {
      console.log(`${completedParts}/${totalParts}`);
    },
  });

  return contractFileId;
}
```

`params` は `uploadContractFile` と共通の
`{ contractId, name, buffer, pointCloudAttribute?, onContractFileCreated? }` に、
`chunkSize?` と `onUploadProgress?` を加えたものです。
`buffer` は `ArrayBuffer` なので、`File` からは `await file.arrayBuffer()` で取得します。
パートは並行して送信されるため、`onUploadProgress` の第 1 引数は完了したパート数であり、
何番目のパートが完了したかは示しません。
途中で失敗した場合は開始済みのマルチパートアップロードを破棄してから元のエラーを throw します。

アップロード完了後、R-CDE 側で PCLOD 変換が非同期に走ります。
表示できるようになったかどうかは `getContractFileList` の
`batchProcessingResult` か、[`useContractFileActions`](#ファイル一覧の操作usecontractfileactions) の
`getFileStatus` / `isPclodCompleted` で判定してください。

---

## React three fiberとの組み合わせ

RCDEではthree.jsのReact向けライブラリであるreact three fiberを利用して、WebGLでの3次元オブジェクトの描画を行っています。
このため、3次元空間上に何かを配置する場合、react three fiberのコンポーネントを利用することになります。

RCDEコンポーネントの子要素に配置されたreact componentはすべて、
react three fiberのCanvasの子要素として描画されます。

```typescript
<RCDE
  constructionId={constructionId}
  contractId={contractId}
  app={app}
>
  <mesh>
    <boxGeometry />
    <meshBasicMaterial color="red" />
  </mesh>
</RCDE>
```

---

## Reference Point (基準点)について

点群ファイルには極端に大きな座標値、例えば数百万規模の値が含まれることがあります。
これを例えばそのままreact three fiberのコンポーネントを利用して描画しようとすると、
WebGLの32 bitの浮動小数点数の精度の都合上、
極端に大きな座標値では正しく描画できないことがあります。

（浮動小数による問題の例 https://x.com/BigVinegar/status/1239181197172826112）

これに対応するために、RCDEでは基準点という概念を用いています。

描画したい対象の点群ファイルについて、点群のBounding boxの中心座標を基準点として設定し、その基準点が3次元空間上の原点（0, 0, 0）に位置するようにオフセットをかけます。
そうすると、該当の点群が持つ各点の座標値は、基準点座標が引かれた（オフセットされた）座標値になり、
それによって、極端に大きな座標値でも0近傍に収まるようになります。

この基準点座標は、RCDEコンポーネントの子要素に配置されたコンポーネントにおいて、
`useReferencePoint`フックを用いて取得することができます。

```typescript
const { point } = useReferencePoint();
```

この`point`は、three.jsの`Vector3`オブジェクトであり、x, y, zの3つの座標値を持っています。

例えば、基準点位置の変化に合わせて配置したいオブジェクトがある場合、
そのオブジェクトの座標に対して`point`を加算することで、基準点位置と同期して配置することができます。

```tsx
"use client";

import { FC, useMemo } from "react";
import { RCDE, type RCDEAppConfig, useReferencePoint } from "@i-con/frontend-sdk";

const Example: FC = () => {
  const { point } = useReferencePoint();
  return (
    <group position={point}>
      <mesh>
        <boxGeometry />
        <meshBasicMaterial color="red" />
      </mesh>
    </group>
  );
};

const App = ({
  accessToken,
  constructionId,
  contractId,
}: {
  accessToken: string;
  constructionId: number;
  contractId: number;
}) => {
  const app = useMemo<RCDEAppConfig>(
    () => ({ token: accessToken, baseUrl: "/api/rcde", authType: "2legged" }),
    [accessToken]
  );

  return (
    <RCDE constructionId={constructionId} contractId={contractId} app={app}>
      <Example />
    </RCDE>
  );
};
```

### ReferencePointAxis（基準点軸ギズモ）

基準点は点群座標に `point` オフセットを加算した結果、**シフト後のワールド原点 (0, 0, 0)** に固定されます。
`ReferencePointAxis` はこの基準点位置に X/Y/Z 軸矢印を表示するコンポーネントです。

`Viewer` ではデフォルトで原点に軸が表示されます。SDK 利用者が追加実装なしで基準点軸を使えることを想定した挙動です。

独自に `ReferencePointAxis` を描画している既存アプリでは、二重表示を避けるため `r3f.referencePointAxis` を `false` に指定してください。

```typescript
<Viewer r3f={{ referencePointAxis: false }} ... />
```

`ReferencePointAxis` を単体で使う場合は `Viewer` の子要素として配置できます。

`ReferencePointAxis` は常にワールド原点に描画されます。`point` prop を渡しても位置は変わりません（後方互換のため prop 自体は残しています）。

カスタムオブジェクトを基準点オフセットの変化に追従させたい場合は、軸ギズモとは別に `<group position={point}>` でラップしてください（上記 Example 参照）。

---

## ファイル一覧の操作（useContractFileActions）

契約ファイル一覧の表示・操作ロジックを UI から切り離したフックです。行データの生成、表示/非表示切替、フォーカス（基準点移動）、ダウンロード、ステータス判定を提供します。UI は利用側で自由に組み立てます。

`ClientProvider` / `ContractFilesProvider` / `ReferencePointProvider` の配下（`RCDE` の `children` / `auxiliaryContent`、または各 Provider を自前構成したツリー）でのみ利用できます。プロバイダ外で呼ぶと throw します。

> **メモ化に関する注意**: `rows` / `getFileStatus` / 戻り値オブジェクトは `pendingUploads` を依存にメモ化されています。`useContractFileActions({ ... })` のように**レンダーごとに新しいリテラル**を渡すとメモ化が毎回無効になります。`pendingUploads` は `useState` の値など**参照が安定したもの**を渡してください（更新しない場合は引数を省略すると内部の空定数が使われます）。

```tsx
"use client";
import { useContractFileActions } from "@i-con/frontend-sdk";

function FileList({ pendingUploads }) {
  const { rows, toggleVisibility, focusFile, downloadFile, getFileStatus, isPclodCompleted } =
    useContractFileActions(pendingUploads);

  return (
    <ul>
      {rows.map((row) => {
        if (row.type === "pending") {
          // pending 行も getFileStatus に通せば登録済み行と同じ状態値で扱える
          // （pending 行の id は必ず pendingUploads に存在するため upload:"uploading" / pclod:"none"）
          const pending = getFileStatus({ id: row.contractFileId, name: row.name });
          return (
            <li key={`pending-${row.contractFileId}`}>
              {row.name}（{pending.upload} / {pending.pclod}）
            </li>
          );
        }
        const { file, visible } = row.container;
        const status = getFileStatus(file);
        const canView = isPclodCompleted(file);
        return (
          <li key={file.id}>
            {file.name}（{status.upload} / {status.pclod}）
            <button disabled={!canView} onClick={() => toggleVisibility(row.container)}>
              {visible ? "非表示" : "表示"}
            </button>
            <button disabled={!canView || !visible} onClick={() => focusFile(file)}>
              フォーカス
            </button>
            <button onClick={() => downloadFile(file)}>ダウンロード</button>
          </li>
        );
      })}
    </ul>
  );
}
```

戻り値の各メソッド:

| 名前               | 概要                                                                                         |
| ------------------ | -------------------------------------------------------------------------------------------- |
| `rows`             | 登録済みファイルとアップロード中ファイルをマージした一覧行                                   |
| `toggleVisibility` | 表示/非表示の切り替え                                                                        |
| `focusFile`        | 対象ファイルの Bounding Box 中心へ基準点を移動しフォーカス（成功可否を `boolean` で返す）    |
| `downloadFile`     | 署名付き URL を取得し別タブで開く（`noopener,noreferrer` 付与、成功可否を `boolean` で返す） |
| `getFileStatus`    | アップロード/PCLOD の状態値を導出（アップロード中判定は `pendingUploads` から内部で行う）    |
| `isPclodCompleted` | PCLOD 処理が完了しているか                                                                   |

`getFileStatus` が返す `FileStatus` は表示用の文言ではなく状態値です。文言・アイコン・色はアプリ側で決めてください。

| `upload`    | 意味                                                       |
| ----------- | ---------------------------------------------------------- |
| `uploading` | アップロード中（クライアント追跡中またはサーバー側未完了） |
| `uploaded`  | アップロード完了                                           |

| `pclod`      | 意味                                                            |
| ------------ | --------------------------------------------------------------- |
| `none`       | アップロード追跡中の行で、まだ PCLOD の対象になっていない       |
| `waiting`    | PCLOD 未着手                                                    |
| `processing` | PCLOD 処理中（R-CDE のバッチステータス 1: 開始 / 2: 進行中）    |
| `completed`  | PCLOD 完了（同 3）。この状態でのみ点群を表示できる              |
| `failed`     | PCLOD 失敗（同 4）。再アップロードが必要                        |
| `unknown`    | R-CDE が SDK の知らないステータスを返した。SDK の更新漏れを示す |

`isFileStatusActive(status)` はポーリングを続けるべきかを返します。`failed` / `unknown` は確定状態として `false` になるため、失敗したファイルを永久にポーリングし続けることはありません。

### 移行手順（サイドバー UI 廃止）

`Viewer` に組み込まれていた一覧サイドバー UI と関連 props を廃止しました。**破壊的変更**です。

- 削除された props: `showLeftSider` / `showRightSider` / `leftSiderHeaderActions`
- 削除された内蔵 UI: レフト/ライトサイドバーのファイル一覧・基準点編集パネル

これまでサイドバーで得ていた機能は `useContractFileActions` と `useReferencePoint` を使って利用側で UI を組み立ててください。`RCDE` 利用時のマウント先は `auxiliaryContent` になるため一覧はキャンバスへの重ね描きになります。ビューアと横並びに配置したい場合は `Viewer` と各 Provider を自前で構成してください。

---

## Three.js／R3F統合に関する注意

- Three.js オブジェクトは React Reconciler 18.3.1 に依存します。
- `three` は Vite の `optimizeDeps.include` に追加しておく必要があります。
- ViewerBridge は直接 three.js のカメラ・シーン・マテリアルを制御します。
- `react-three-fiber` と `three` のバージョン不一致によりビルドエラーが出る場合は、
  `node_modules` を削除して再インストールしてください。

---

## 開発時の注意事項

- Next.js App Router 構成に準拠しています（`src/app/` 配下に各画面を配置）。
- クライアント側コンポーネントには `"use client"` 指定を付与してください。
- RCDEトークンはセッション内で管理され、クライアントでの永続保存は禁止されています。
- 大容量ファイルのアップロードには分割処理とリトライ機構を実装済みです。

---

## ライセンス

© 2025 AMDlab. All rights reserved.

---

## 更新履歴

| バージョン | 日付       | 内容                                                                                              |
| ---------- | ---------- | ------------------------------------------------------------------------------------------------- |
| 1.0.0      | 2025-07-30 | 初版作成                                                                                          |
| 1.1.0      | 2025-10-21 | React 18.3.1 / Next 14.2.5 固定明記、Three.js依存性追記、ViewerBridge使用例追加、RCDE認証要約追加 |
| 1.2.0      | 2026-06-25 | Node.js 24 / Next.js 16.2.9 対応、同梱 example 削除                                               |
| 1.3.0      | 2026-08-31 | サンプルを examples/ 配下の 2 タイプ（standalone / webhook-receiver）に整理                       |
