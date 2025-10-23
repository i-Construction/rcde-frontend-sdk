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
VITE_API_BASE_URL=http://localhost:8000
```

> ※ 認証エンドポイント `/api/auth/rcde-access-token` をバックエンド側に用意している場合、
> ここで指定した `VITE_*` 環境変数を `useClient()` 初期化に使用できます。

## 注意点
- three は Vite の `optimizeDeps.include` に含めています。
- SDK側の `ViewerBridge` は React 18.3.1 前提です。バージョンを変えると Reconciler 差異で動作しない可能性があります。
