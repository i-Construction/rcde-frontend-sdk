# E01: RCDE コンポーネント

## 1. 概要

`RCDE` コンポーネントは `@i-con/frontend-sdk` が提供するメインのビューアコンポーネント。3D 点群表示、ファイルアップロード、基準点管理、ファイルリストなど包括的な機能を備える。

## 2. 使用方法

```tsx
'use client';
import { RCDE, type RCDEAppConfig } from '@i-con/frontend-sdk';

function ViewerPage({ token, constructionId, contractId, authType }) {
  const app: RCDEAppConfig = {
    token,
    baseUrl: 'https://api.rcde.jp',
    authType,
  };

  return (
    <RCDE
      app={app}
      constructionId={constructionId}
      contractId={contractId}
    />
  );
}
```

## 3. Props

### RCDEAppConfig

| プロパティ | 型 | 説明 |
|---|---|---|
| `token` | `string` | RCDE API のアクセストークン |
| `baseUrl` | `string` | RCDE API のベース URL |
| `authType` | `"2legged" \| "3legged"` | 認証方式 |

### RCDE コンポーネント Props

| プロパティ | 型 | 説明 |
|---|---|---|
| `app` | `RCDEAppConfig` | アプリケーション設定 |
| `constructionId` | `number` | 現場 ID |
| `contractId` | `number` | 契約 ID |

## 4. SDK が提供する機能

| 機能 | コンポーネント | 説明 |
|---|---|---|
| 3D ビューア | `Viewer` | 点群の 3D 表示・操作（回転・ズーム・パン） |
| ファイルアップロード | `FileUploadModal` | LAS/LAZ ファイルのアップロード + PCLoD 変換 |
| ファイルリスト | `ContractFileView` | 契約ファイルの一覧表示 |
| 基準点管理 | `ReferencePointView` | 基準点の設定・表示 |
| 左サイドバー | `LeftSider` | ファイルツリー |
| 右サイドバー | `RightSider` | 基準点・設定パネル |

## 5. PoC での使い方

本 PoC では `ViewerClient.tsx` で RCDE コンポーネントをラップし、SSR で取得したトークンと ID を渡す:

1. `viewer/page.tsx`（サーバーコンポーネント）で Cookie からトークンを取得
2. `ViewerClient.tsx`（クライアントコンポーネント）に `token`, `constructionId`, `contractId` を渡す
3. RCDE コンポーネントが自動的にビューアを描画

参照:
- [SDK 03_pointcloud_lod.md](../../../../my-document_rcde-frontend-sdk/機能一覧仕様書/03_pointcloud_lod.md)
- [SDK 07_file_upload.md](../../../../my-document_rcde-frontend-sdk/機能一覧仕様書/07_file_upload.md)
