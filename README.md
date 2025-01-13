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

