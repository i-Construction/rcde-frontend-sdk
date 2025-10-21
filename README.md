# @i-con/frontend-sdk

## 概要

RCDEの機能をフロントエンドアプリケーションで利用するためのSDKです。

本SDKは、RCDE連携型モニタリングアプリのフロントエンド共通機能を提供します。  
Next.js（App Router構成）および React Three Fiber をベースとし、点群ビューア、認証、契約項目管理、ファイルアップロードなどを統合します。

このSDKはReact環境(バージョン18以上)で使用することを前提としています。

---

## 開発環境要件

| 項目 | バージョン | 備考 |
|------|-------------|------|
| Node.js | 20.x 以上 | LTS推奨 |
| React | **18.3.1 固定** | Three.js互換のため他バージョン不可 |
| Next.js | **14.2.5 固定** | Three.js／React Three Fiber間の依存制約あり |
| Vite | ^5.x | ライブラリビルド用 |
| TypeScript | ^5.x | 型定義完全対応 |
| Three.js | ^0.164.x | `@react-three/fiber` 依存 |

> ⚠️ **React/Nextバージョンは厳密固定です。**
>
> Three.js と React 18.3.1 / Next.js 14.2.5 の組み合わせでのみビルドが安定します。  
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
npm install

# 開発ビルド
npm run dev

# ライブラリビルド
npm run build
```

---

## 構成概要

```
packages/
└── @i-con/frontend-sdk/
    ├── src/
    │   ├── components/       # 汎用コンポーネント（FileUploadModal, ViewerPanel等）
    │   ├── contexts/         # グローバルステート管理
    │   ├── hooks/            # カスタムフック（useViewer, useAuth等）
    │   ├── lib/              # RCDE API連携ロジック
    │   └── types/            # 共通型定義
    ├── dist/                 # ビルド成果物
    ├── package.json
    └── tsconfig.json
```

---

## 主な機能

| モジュール | 概要 |
|-----------|------|
| ViewerBridge | Three.jsビューワーとReact間のブリッジ処理 |
| useViewer | 点群・基準面の表示制御用フック |
| useAuth | RCDE OAuth 3-legged認証対応 |
| FileUploadModal | S3/RCDE両対応のアップロードモーダル |
| contractFiles | 契約項目別ファイル管理用コンテキスト |

---

## 事前準備

RCDEのサイトでアプリケーションを作成します。
以下の手順に従ってください。

[RCDE API SDK](https://github.com/i-Construction/rcde-api-sdk?tab=readme-ov-file#%E4%BA%8B%E5%89%8D%E6%BA%96%E5%82%99)

---

## 基本的な使用方法

RCDEコンポーネントを配置することでビューワを表示することができます。
RCDEコンポーネントには[事前準備](#事前準備)で作成したアプリケーションの情報と、
表示したい現場のIDと契約IDを渡します。

```typescript
import { RCDE, RCDEProps } from "@i-con/frontend-sdk";

const App = () => {
  // 事前準備で作成したアプリケーションの情報 (clientId, clientSecret)
  const app = useMemo(() => {
    return {
      clientId: "client id",
      clientSecret: "client secret",
    };
  }, []);

  return (
    <RCDE
      constructionId={constructionId}
      contractId={contractId}
      app={app}
    />
  );
};
```

---

## ViewerBridgeの使い方

ViewerBridge は、Three.jsベースの3DビューワーとReactコンポーネント間のブリッジとして動作します。
ReactからThree.jsのシーン制御・カメラ操作・モデルロードを直接行うための統一インターフェースです。

### 基本構成

```tsx
"use client";
import { useEffect, useRef } from "react";
import { ViewerBridge } from "@i-con/frontend-sdk";

export default function ViewerPanel() {
  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!viewerRef.current) return;

    // 初期化
    ViewerBridge.init(viewerRef.current, {
      backgroundColor: "#000",
      gridVisible: true,
    });

    // モデルロード例
    ViewerBridge.loadPointCloud({
      url: "/example-data/sample.las",
      color: "#00ff00",
    });

    // カメラ操作例
    ViewerBridge.setCamera({
      position: [5, 10, 15],
      target: [0, 0, 0],
    });

    // 回転アニメーション例
    ViewerBridge.animate((time) => {
      ViewerBridge.setRotation({ x: 0, y: time * 0.001, z: 0 });
    });

    return () => {
      ViewerBridge.dispose();
    };
  }, []);

  return (
    <div
      ref={viewerRef}
      style={{ width: "100%", height: "600px", background: "#111" }}
    />
  );
}
```

### 主なAPI一覧

| メソッド | 機能概要 |
|---------|---------|
| `init(container: HTMLElement, options?: ViewerOptions)` | ビューワー初期化 |
| `loadPointCloud({ url, color })` | 点群データをロード |
| `setTransform({ translation, rotation, scale })` | オブジェクトの位置・回転・拡縮設定 |
| `setCamera({ position, target })` | カメラ位置と注視点を設定 |
| `resetCamera()` | カメラを初期位置に戻す |
| `animate(callback: (time: number) => void)` | 毎フレーム呼ばれるアニメーション関数登録 |
| `dispose()` | ビューワー破棄とメモリ解放 |

### 補足

ViewerBridge は React Three Fiber 経由で Three.js にアクセスしており、
React 18.3.1 固定で動作します。
それ以外のバージョンでは Reconciler の内部構造が異なるため動作しません。

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

```typescript
import { RCDE, RCDEProps, useReferencePoint } from "@i-con/frontend-sdk";

const Example: FC = () => {
  const { point } = useReferencePoint();
  return <group position={point}>
    <mesh>
      <boxGeometry />
      <meshBasicMaterial color="red" />
    </mesh>
  </group>;
};

const App = () => {
  // 事前準備で作成したアプリケーションの情報 (clientId, clientSecret)
  const app = useMemo(() => {
    return {
      clientId: "client id",
      clientSecret: "client secret",
    };
  }, []);

  return (
    <RCDE
      constructionId={constructionId}
      contractId={contractId}
      app={app}
    >
      <Example />
    </RCDE>
  );
};
```

---

## 認証（RCDE OAuth）

本SDKは RCDE の 3-legged OAuth 認証 に対応しており、
`/api/auth/rcde-access-token` エンドポイント経由で Token-on-Demand 方式を採用しています。

詳細仕様は `FNC001_認証機能.md` を参照してください。

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

| バージョン | 日付 | 内容 |
|-----------|------|------|
| 1.0.0 | 2025-07-30 | 初版作成 |
| 1.1.0 | 2025-10-21 | React 18.3.1 / Next 14.2.5 固定明記、Three.js依存性追記、ViewerBridge使用例追加、RCDE認証要約追加 |