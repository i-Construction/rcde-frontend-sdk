# @i-con/frontend-sdk Example (Vite)

本ディレクトリは `@i-con/frontend-sdk` の動作例（Vite + React）です。  
**Reactは 18.3.1 固定**で、Three.js との依存関係を安定させています（Next.js を使う場合は **14.2.5** 固定推奨）。

## 要件
- Node.js 20.x 以上（LTS推奨）
- React 18.3.1 固定
- three ^0.171.0
- （Next.js を使用する別例の場合は Next 14.2.5 固定）

## セットアップ
```bash
cd example
npm install
# ローカルのSDKを使う場合（モノレポ開発）
# npm link または pnpm/yarn の workspaces を使用して @i-con/frontend-sdk を解決してください。
npm run dev
```

## 主要画面
- Home（発注者/受注者向けのUIダミー）
- **Viewer**（`ViewerBridge` を使った 3D 表示サンプル）

## Viewer の使い方
`components/ViewerPanel.tsx` を参照してください。

- `ViewerBridge.init(container, options)` で初期化
- `loadPointCloud({ url, color })` で点群ロード
- `setCamera({ position, target })` でカメラ設定
- `resetCamera()` / `setTransform(...)` の操作ボタン付き

## .env
`example/.env.example` をコピーして `.env` を作成してください。

```env
VITE_CLIENT_ID=
VITE_CLIENT_SECRET=
VITE_API_BASE_URL=https://api.rcde.jp
VITE_AUTH_TYPE=2legged
```

> ※ `VITE_CLIENT_ID` と `VITE_CLIENT_SECRET` は、RCDEの企業管理画面で払い出された値を設定してください。
> ※ アプリケーション起動時に自動的にアクセストークンを取得します。
> ※ `VITE_AUTH_TYPE` は `2legged` または `3legged` を指定します（デフォルトは `2legged`、現在は2leggedのみサポート）。

## 注意点
- three は Vite の `optimizeDeps.include` に含めています。
- SDK側の `ViewerBridge` は React 18.3.1 前提です。バージョンを変えると Reconciler 差異で動作しない可能性があります。
