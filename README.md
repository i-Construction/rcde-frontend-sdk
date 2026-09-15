# @i-con/frontend-sdk

[![npm version](https://img.shields.io/npm/v/@i-con/frontend-sdk.svg)](https://www.npmjs.com/package/@i-con/frontend-sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-included-3178c6.svg)](https://www.npmjs.com/package/@i-con/frontend-sdk)

R-CDE の点群ビューアと契約ファイル API を、React アプリケーションから使うための SDK です。

React Three Fiber をベースに、点群表示、契約ファイルの一覧・アップロード、ビューア外 UI からの表示制御を提供します。TypeScript の型定義はパッケージに含まれます。

アクセストークンの発行は SDK の役割ではありません。利用側が発行したトークンだけを渡してください。`clientId` / `clientSecret` はブラウザに置かず、サーバー側でトークンを発行します。

公開エントリポイントは `@i-con/frontend-sdk` の 1 つだけです。サブパス import は提供していません。サーバー側から R-CDE API を直接叩く場合は、別パッケージの [`@i-con/api-sdk`](https://www.npmjs.com/package/@i-con/api-sdk) を使います。

## 目次

- [動作環境](#動作環境)
- [インストール](#インストール)
- [事前準備](#事前準備)
- [クイックスタート](#クイックスタート)
- [主な機能](#主な機能)
- [`memoryMonitoring` の使い方](#memorymonitoring-の使い方)
- [ViewerBridge の使い方](#viewerbridge-の使い方)
- [RCDEClient の使い方](#rcdeclient-の使い方)
- [React Three Fiber との組み合わせ](#react-three-fiber-との組み合わせ)
- [基準点（Reference Point）](#基準点reference-point)
- [距離計測](#距離計測)
- [ファイル一覧の操作](#ファイル一覧の操作usecontractfileactions)
- [依存関係の注意](#依存関係の注意)
- [ライセンス](#ライセンス)

## 動作環境

| 項目 | 内容 |
| ---- | ---- |
| React | 18.3 以上（19 でも動作します。下の peer 依存の注記を参照） |
| ブラウザ | WebGL が使える環境。サーバーサイドでは描画しません |
| TypeScript | 型定義同梱。利用側での追加パッケージは不要です |
| モジュール | ESM（`import`）と CJS（`require`）の両方 |

Next.js には依存していません。Next.js App Router から使う場合は、SDK のコンポーネントを描画する側に `"use client"` を付けてください。

## インストール

peer 依存も利用側アプリで入れてください。

```bash
npm install @i-con/frontend-sdk react react-dom three @react-three/fiber @react-three/drei
# or
yarn add @i-con/frontend-sdk react react-dom three @react-three/fiber @react-three/drei
# or
pnpm add @i-con/frontend-sdk react react-dom three @react-three/fiber @react-three/drei
```

| パッケージ           | バージョン範囲 | 備考                                     |
| -------------------- | -------------- | ---------------------------------------- |
| `react`              | `^18.3.1`      | 下の注記も参照                           |
| `react-dom`          | `^18.3.1`      | `react` と同じメジャーバージョンに揃える |
| `three`              | `^0.171.0`     | 3D 描画本体                              |
| `@react-three/fiber` | `^8.17.10`     | 下の注記も参照                           |
| `@react-three/drei`  | `^9.120.4`     | `@react-three/fiber` の系列に揃える      |

React 19 の構成（`@react-three/fiber` 9 系 / `@react-three/drei` 10 系）でも動作しますが、上の `peerDependencies` はその範囲を含んでいません。挙動はパッケージマネージャで分かれます。

| パッケージマネージャ | 挙動                                                                                                           | 回避方法                                                                 |
| -------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| npm 7 以降           | `ERESOLVE` で失敗                                                                                              | `--legacy-peer-deps`、または `package.json` の `overrides`               |
| pnpm                 | 既定では警告のみ（v8 以降は `strict-peer-dependencies` の既定が false）。v7 以前や明示的に有効化した場合は失敗 | 失敗する場合は `strict-peer-dependencies=false`、または `pnpm.overrides` |
| yarn                 | 警告のみで継続                                                                                                 | 対応不要                                                                 |

揃えるべきなのは React と React DOM、および `@react-three/fiber` と `@react-three/drei` の対応関係です（React 18 なら fiber 8 系、React 19 なら fiber 9 系）。ここがずれると `react-reconciler` 関連の型エラーや実行時エラーが発生します。

## 事前準備

1. [R-CDE のアプリケーション作成手順](https://github.com/i-Construction/rcde-api-sdk?tab=readme-ov-file#%E4%BA%8B%E5%89%8D%E6%BA%96%E5%82%99) に従って `clientId` / `clientSecret` を発行します。
2. サーバー側でアクセストークンを発行し、ブラウザへはトークンだけを渡します。
3. ブラウザから R-CDE API を直接呼ぶと CORS で失敗するため、同一オリジンの API プロキシ（例: `/api/rcde`）を用意し、SDK の `baseUrl` にそのパスを指定します。

トークン発行とプロキシは SDK の外の責務です。Next.js App Router なら、例えば次のように分けます。

```ts
// app/api/auth/token/route.ts（サーバー側。シークレットはここだけが読む）
export async function GET() {
  const res = await fetch("https://api.rcde.jp/ext/v2/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId: process.env.RCDE_CLIENT_ID,
      clientSecret: process.env.RCDE_CLIENT_SECRET,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    return Response.json({ error: "token request failed" }, { status: 502 });
  }
  const data = (await res.json()) as { accessToken: string };
  return Response.json({ accessToken: data.accessToken });
}
```

```ts
// app/api/rcde/[...path]/route.ts
const RCDE_API_BASE = (process.env.RCDE_API_BASE_URL ?? "https://api.rcde.jp").replace(/\/$/, "");

async function proxy(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return Response.json({ error: "Authorization ヘッダーがありません" }, { status: 401 });
  }

  const incoming = new URL(request.url);
  const url = `${RCDE_API_BASE}/${path.join("/")}${incoming.search}`;
  const headers = new Headers({ Authorization: authorization });
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  const init: RequestInit = { method: request.method, headers, cache: "no-store" };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  const upstream = await fetch(url, init);
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
      "Cache-Control": "no-store",
    },
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
```

`RCDEClient` は `baseUrl` の後ろに `/ext/v2/authenticated/...`（`3legged` のときは `/ext/v2/userAuthenticated/...`）を付けるので、`baseUrl` を `/api/rcde` にすればパスがそのままプロキシへ乗ります。

2-legged のトークンはアプリ単位の権限を持ちます。開発中は上のようにブラウザへトークンを渡して構いませんが、本番ではトークンをブラウザに出さずプロキシ側で `Authorization` を付ける、あるいはユーザー単位の 3-legged 認証を検討してください。

## クイックスタート

`RCDE` にアクセストークンを含む `app` 設定と、表示したい現場 ID・契約 ID を渡します。

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
  // 参照が変わるたびに初期化の effect が再実行されるためメモ化する。
  // 設定値が同じなら内部で早期 return するので RCDEClient は作り直されないが、
  // 無駄な再実行は避けられる
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

トークンは `RCDEClient` のインスタンスがメモリ上に保持するだけで、SDK は Cookie や localStorage へ保存しません。取得・保管・失効時の再取得は利用側アプリの責務です。

`RCDE` と `Viewer` は同じ props を受け取ります。よく使うものは次のとおりです。

| Prop | 内容 |
| ---- | ---- |
| `constructionId` / `contractId` | 表示する現場と契約 |
| `app` | API 接続設定 |
| `contractFileIds` | 初回ロード時に表示するファイル ID。省略すると全件表示。ロード後の差し替えでは表示状態は変わりません |
| `children` | React Three Fiber のシーン内に描画する子要素 |
| `auxiliaryContent` | キャンバスの外（同じラッパー内）に置く HTML。ファイル一覧などを重ねるときに使う |
| `positionOffsetComponent` | 基準点オフセットを加算した位置に置く R3F 要素 |
| `r3f` | `canvas` / `map` / `light` / `grid` / `gizmo` / `referencePointAxis` の表示切り替え |
| `onObjectClick` / `onObjectHover` | 点群のクリック・ホバー。`SET_TRANSFORM` 後の当たり判定には移動前の Bounding Box が使われます |
| `memoryMonitoring` | メモリ監視。詳細は後述 |
| `clickEnabled` | `false` でクリック選択を無効化。計測モード中に使います。既定は `true` |

最小構成は `RCDE` を 1 つ置くだけです。ビューアとファイル一覧を横並びにしたい場合は、後述の [ファイル一覧の操作](#ファイル一覧の操作usecontractfileactions) のとおり `Viewer` と Provider を自前で組んでください。

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
| `MeasurementHandler`          | 点群上の距離計測。計測点の追加と確定線の描画を扱う                         |
| `deriveFileStatus` ほか状態値 | アップロード / PCLOD の状態判定ユーティリティ                              |

## `memoryMonitoring` の使い方

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
      sampleIntervalMs: 10000,
      thresholds: {
        estimate: {
          warningBytes: 256 * MEBIBYTE,
          criticalBytes: 384 * MEBIBYTE,
          hysteresisBytes: 32 * MEBIBYTE,
        },
        jsHeap: {
          warningBytes: 512 * MEBIBYTE,
          criticalBytes: 768 * MEBIBYTE,
        },
        page: {
          warningBytes: 1024 * MEBIBYTE,
          criticalBytes: 1536 * MEBIBYTE,
        },
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
- `sampleIntervalMs`: 定期サンプリングの基準間隔です。未指定時は `10000` ミリ秒です。短くしすぎるとブラウザ負荷が上がるため、`10000` から `30000` ミリ秒程度を推奨します。下限は `1000` ミリ秒にクランプされます。精密メモリ計測が解決したタイミングでは、この間隔とは別に追加サンプルが発火することがあります。
- `thresholds`: 監視対象ごとの閾値です。`estimate`（`estimatedViewerBytes`）、`jsHeap`（`jsHeapBytes`）、`page`（`pageBytes`）の 3 つを個別に設定でき、指定した対象だけが判定されます。3 つの値はどの設定でも常に取得され、`onSample` から参照できます。
- `thresholds.<対象>.warningBytes`: その対象の警告レベルの閾値です。
- `thresholds.<対象>.criticalBytes`: その対象の危険レベルの閾値です。
- `thresholds.<対象>.hysteresisBytes`: 閾値付近で警告が連続発火しないようにする戻り幅です。省略時は 32 MiB です。
- `onSample`: サンプル取得時のコールバックです。
- `onAlert`: 閾値超過時のコールバックです。
- `onAlertLevelChange`: アラートレベルが変化したときのコールバックです。`undefined` を受け取ったときは警告解除に利用できます。解除時に渡される `sample` は直前に発火した値のため、`sample.timestamp` が現在時刻より古い場合があります。`memoryMonitoring` プロップを外して無効化した場合、解除通知は最後に有効だった時点のコールバックが呼ばれます。

`onAlert` で受け取れる `ViewerMemoryAlert` は、対象ごとの判定結果をまとめた形になっています。

- `level`: 超過した対象のうち最も高いレベルです。`onAlertLevelChange` に渡るレベルと一致します。
- `breaches`: 閾値を超えた対象の一覧です。各要素は `target`（`"estimate" | "jsHeap" | "page"`）、`level`、`thresholdBytes`、`observedBytes` を持ちます。レベルと超過幅の大きい順に並ぶため、代表値として `breaches[0]` を使えます。
- `observedBytes`: そのサンプルで観測した 3 値（`estimateBytes` / `jsHeapBytes` / `pageBytes`）です。取得できなかった値は `undefined` です。
- `sample`: 判定に使った `ViewerMemorySample` です。

判定とヒステリシスは対象ごとに独立して動きます。たとえば `jsHeap` が warning のまま `page` が critical に達した場合、通知されるレベルは `critical` になり、`breaches` には両方が含まれます。

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
> - `page` や `jsHeap` に閾値を設定しても、その値を取得できない環境では判定がスキップされます。どの環境でも必ず判定させたい場合は `estimate` にも閾値を設定してください。
> - 3 つの値は測る対象が異なります（Viewer 推定値 < JS ヒープ < ページ全体）。同じ数値を 3 つに設定すると `page` だけが先に発火し続けるため、対象ごとに桁を分けて設定してください。
> - ブラウザから GPU / WebGL メモリを厳密に取得することは難しいため、SDK では Viewer 推定値をベースに監視します。
> - `estimatedViewerBytes` は PNG キャッシュ保持量ベースのため、ファイルのアンマウントまたは `meta.version` 変更時にリセットされます。
> - タイル集計の flush は `requestAnimationFrame` ベースのため、バックグラウンドタブでは推定値更新が遅延または停止することがあります。
> - アラート表示 UI は SDK ではなく、`onAlert` / `onAlertLevelChange` を使ってアプリケーション側で `Snackbar` や `Alert` を出す構成を推奨します。

## ViewerBridge の使い方

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
  // 同じチャンネルへ送られたコマンドを購読する（戻り値は購読解除関数）
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

### 主な API 一覧

| メソッド                                       | 機能概要                                                                     |
| ---------------------------------------------- | ---------------------------------------------------------------------------- |
| `setTransform(tx: ViewerTransform)`            | `tx.fileId` のファイルに平行移動と回転を適用する                             |
| `setAppearance(app: ViewerAppearance)`         | 点サイズ・不透明度・カメラの上方向・座標系を設定する                         |
| `reset()`                                      | 位置・回転・見た目・カメラの上方向を初期値へ戻す                             |
| `addListener(handler: (cmd: Command) => void)` | 同チャンネルへ送られたコマンドを購読する。戻り値の関数を呼ぶと購読を解除する |

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

`addListener` が受け取るのは同じチャンネルへ送られたコマンドで、自分が
`setTransform` などで送ったものも届きます。`Viewer` は購読する側であり、
コマンドを送り返すことはありません。

### 補足

`setTransform` で移動・回転したファイルは、`onContractFileClick` / `onObjectClick` /
`onObjectHover` の当たり判定に反映されません。判定には移動前のバウンディングボックスが
使われます。

## RCDEClient の使い方

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

// アクセストークンはサーバー側で発行し、props や API 経由でクライアントへ渡す。
// ブラウザから読める env（Next.js の NEXT_PUBLIC_*）に置くとバンドルへ埋め込まれるため使わない
export function createRCDEClient(accessToken: string) {
  return new RCDEClient({
    accessToken,
    baseUrl: "/api/rcde",
    authType: "2legged",
  });
}
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
| `createContract(params)`                                            | レスポンス JSON         | 契約を作成する（`2legged` のみ）                   |

いずれも 2xx 以外のレスポンスを受けた時点で `Error` を throw します（戻り値で失敗を返しません）。

#### `createContract` の制約

```ts
await client.createContract({
  constructionId,
  name: "契約A",
  contractedAt: new Date().toISOString(), // ISO 8601 の日時
  unitPrice: 1200,
  unitVolume: 34,
});
```

- **`2legged` のみ対応**です。`authType: "3legged"` のクライアントで呼ぶと、リクエストを送る前に `Error` を throw します。R-CDE の 3-legged 契約作成 API は `contracteeEmail` / `contractorEmail` のどちらか一方を必須にし、さらにどちらを渡したかで呼び出し元が受注者か注文者かも変わるため、その引数を SDK がまだ持っていません。
- `contractedAt` は **ISO 8601 の日時**で渡してください。R-CDE 側が `time.Time` のため、`2024-11-19` のような日付だけの文字列はリクエストの解釈時点で 400 になります。
- `unitPrice` / `unitVolume` は **1 以上**を渡してください。R-CDE 側が符号なし整数の必須項目で、`0` は「未指定」と同じ扱いになり 400 になります。

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
失敗したパートの自動リトライは行いません。再試行は利用側で行ってください。

アップロード完了後、R-CDE 側で PCLOD 変換が非同期に走ります。
表示できるようになったかどうかは `getContractFileList` の
`batchProcessingResult` か、[`useContractFileActions`](#ファイル一覧の操作usecontractfileactions) の
`getFileStatus` / `isPclodCompleted` で判定してください。

## React Three Fiber との組み合わせ

RCDE では three.js の React 向けライブラリである React Three Fiber を利用して、WebGL での 3 次元オブジェクトの描画を行っています。
このため、3 次元空間上に何かを配置する場合、React Three Fiber のコンポーネントを利用することになります。

RCDE コンポーネントの子要素に配置された React コンポーネントはすべて、
React Three Fiber の Canvas の子要素として描画されます。

```tsx
<RCDE constructionId={constructionId} contractId={contractId} app={app}>
  <mesh>
    <boxGeometry />
    <meshBasicMaterial color="red" />
  </mesh>
</RCDE>
```

## 基準点（Reference Point）

点群ファイルには極端に大きな座標値、例えば数百万規模の値が含まれることがあります。
これを例えばそのまま React Three Fiber のコンポーネントを利用して描画しようとすると、
WebGL の 32 bit 浮動小数点数の精度の都合上、
極端に大きな座標値では正しく描画できないことがあります。

（浮動小数による問題の例 https://x.com/BigVinegar/status/1239181197172826112）

これに対応するために、RCDE では基準点という概念を用いています。

描画したい対象の点群ファイルについて、点群の Bounding box の中心座標を基準点として設定し、その基準点が 3 次元空間上の原点（0, 0, 0）に位置するようにオフセットをかけます。
そうすると、該当の点群が持つ各点の座標値は、基準点座標が引かれた（オフセットされた）座標値になり、
それによって、極端に大きな座標値でも 0 近傍に収まるようになります。

この基準点座標は、RCDE コンポーネントの子要素に配置されたコンポーネントにおいて、
`useReferencePoint` フックを用いて取得することができます。

```ts
const { point } = useReferencePoint();
```

この `point` は three.js の `Vector3` オブジェクトであり、x, y, z の 3 つの座標値を持っています。

例えば、基準点位置の変化に合わせて配置したいオブジェクトがある場合、
そのオブジェクトの座標に対して `point` を加算することで、基準点位置と同期して配置することができます。

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

```tsx
<Viewer r3f={{ referencePointAxis: false }} ... />
```

`ReferencePointAxis` を単体で使う場合は `Viewer` の子要素として配置できます。

`ReferencePointAxis` は常にワールド原点に描画されます。描画位置を指定する prop はありません。

カスタムオブジェクトを基準点オフセットの変化に追従させたい場合は、軸ギズモとは別に `<group position={point}>` でラップしてください（上記 Example 参照）。

## 距離計測

点群上の 2 点間距離を測るには、`RCDE` / `Viewer` の子要素として `MeasurementHandler` を置きます。キャンバスのクリックを消費するため、計測モードのときだけマウントしてください。置きっぱなしにするとファイル選択（`onObjectClick`）が動きません。

```tsx
"use client";

import { useState } from "react";
import { MeasurementHandler, MeasurementView } from "@i-con/frontend-sdk";
import type { Vector3 } from "three";

function MeasurementLayer({ enabled }: { enabled: boolean }) {
  const [points, setPoints] = useState<Vector3[]>([]);
  if (!enabled) return null;

  return (
    <>
      <MeasurementHandler onChange={setPoints} />
      {points.length >= 2 && <MeasurementView points={points} edit={false} />}
    </>
  );
}
```

- `MeasurementHandler` は計測点を内部 state で持ち、編集中の線も描画します。2 点確定のあと約 2 秒で内部 state はリセットされます。
- 確定済みの計測線を残すには、`onChange` で受け取った点を `MeasurementView` に渡します。`MeasurementHandler` が返す座標は基準点オフセット済みのワールド座標なので、`MeasurementView` に `referencePoint` は渡さないでください（二重加算になります）。
- 計測中にファイル選択も止めたい場合は、`Viewer` に `clickEnabled={false}` を渡します。

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

以前のバージョンにあった `Viewer` 内蔵のファイル一覧サイドバー（`showLeftSider` / `showRightSider` / `leftSiderHeaderActions`）は削除されています。同等の機能は `useContractFileActions` と `useReferencePoint` で利用側が組み立ててください。`RCDE` 利用時のマウント先は `auxiliaryContent` になるため一覧はキャンバスへの重ね描きになります。

ビューアと横並びに配置したい場合は、Provider の入れ子順を守って `Viewer` を自前で構成してください。`ReferencePointProvider` は内部で `useClient` と `useContractFiles` を呼ぶため、この順序は入れ替えられません。

```tsx
import {
  ClientProvider,
  ContractFilesProvider,
  ReferencePointProvider,
  Viewer,
} from "@i-con/frontend-sdk";

function Layout({ app, constructionId, contractId }) {
  return (
    <ClientProvider>
      <ContractFilesProvider>
        <ReferencePointProvider>
          <div style={{ display: "flex", height: "100%" }}>
            <aside>
              <FileList />
            </aside>
            <Viewer constructionId={constructionId} contractId={contractId} app={app} />
          </div>
        </ReferencePointProvider>
      </ContractFilesProvider>
    </ClientProvider>
  );
}
```

## 依存関係の注意

- `three` / `@react-three/fiber` / `@react-three/drei` / `react` / `react-dom` はライブラリのバンドルから external にしています。利用側アプリの依存が 1 つだけ解決されるようにしてください。同じパッケージが二重に読み込まれると R3F のコンテキストが分かれて描画されません。
- `@react-three/fiber` と `@react-three/drei` は対応する系列同士で使ってください（React 18 なら fiber 8 系 + drei 9 系、React 19 なら fiber 9 系 + drei 10 系）。
- `ViewerBridge` は Three.js を直接制御しません。`window.postMessage` でコマンドを送り、`Viewer` の内部 state を経由して描画へ反映されます。
- バージョン不一致でビルドエラーが出る場合は、`node_modules` を削除して再インストールしてください。


リポジトリ: [i-Construction/rcde-frontend-sdk](https://github.com/i-Construction/rcde-frontend-sdk)
Issue: [GitHub Issues](https://github.com/i-Construction/rcde-frontend-sdk/issues)
