# E02: ViewerBridge

## 1. 概要

ViewerBridge は、RCDE ビューアを外部から制御するための `postMessage` ベースの API を提供する。

## 2. 使用方法

```tsx
import { viewerBridge } from '@i-con/frontend-sdk';

// 座標変換の設定
viewerBridge.postMessage({
  type: 'SET_TRANSFORM',
  payload: {
    offset: { x: 100, y: 200, z: 50 },
    rotation: { x: 0, y: 0, z: 0 },
  },
});

// 表示設定の変更
viewerBridge.postMessage({
  type: 'SET_APPEARANCE',
  payload: {
    pointSize: 2,
    colorMode: 'height',
  },
});

// リセット
viewerBridge.postMessage({ type: 'RESET' });
```

## 3. サポートするメッセージ

| メッセージタイプ | 説明 | ペイロード |
|---|---|---|
| `SET_TRANSFORM` | 座標変換の設定 | `{ offset, rotation }` |
| `SET_APPEARANCE` | 表示設定の変更 | `{ pointSize, colorMode }` |
| `RESET` | 設定のリセット | なし |

## 4. PoC での活用

PoC ではビューア内部の操作は RCDE コンポーネントが処理するため、ViewerBridge の直接利用は必須ではない。カスタマイズが必要な場合に参照すること。

参照: [SDK 06_viewer_bridge.md](../../../../my-document_rcde-frontend-sdk/機能一覧仕様書/06_viewer_bridge.md)
