# RCDE Frontend SDK

RCDEの機能をフロントエンドアプリケーションで利用するためのSDKです。

このSDKはReact環境(バージョン18以上)で使用することを前提としています。

## インストール方法

npm、またはyarnを使用してインストールします。

```bash
npm install @i-con/frontend-sdk
# or 
yarn add @i-con/frontend-sdk
```

## 事前準備

RCDEのサイトでアプリケーションを作成します。
以下の手順に従ってください。

[RCDE API SDK](https://github.com/i-Construction/rcde-api-sdk?tab=readme-ov-file#%E4%BA%8B%E5%89%8D%E6%BA%96%E5%82%99)

## 使用方法

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


