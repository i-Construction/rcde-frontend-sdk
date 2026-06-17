# D01: API SDK 統合方針

## 1. 背景

従来 RCDE には 2 つの SDK パッケージが存在していた:

| パッケージ | 役割 |
|---|---|
| `@i-con/api-sdk` | API クライアント（認証、CRUD、アップロード、ステータス） |
| `@i-con/frontend-sdk` | ビューアコンポーネント（RCDE, Viewer, ContractFileView） |

利用者は 2 つのパッケージを個別にインストール・管理する必要があり、導入コストが高かった。

## 2. 統合方針

`@i-con/api-sdk` のソースコードを `@i-con/frontend-sdk` の `src/api/` ディレクトリに移動し、1 パッケージに統合する。

### 統合対象ファイル

| 元ファイル（api-sdk） | 統合先（frontend-sdk） | 内容 |
|---|---|---|
| `src/client-2-legged.ts` | `src/api/client-2-legged.ts` | 2-legged 認証クライアント |
| `src/client-3-legged.ts` | `src/api/client-3-legged.ts` | 3-legged 認証クライアント |
| `src/common.ts` | `src/api/common.ts` | 共通型定義 |
| `src/chunk-uploader.ts` | `src/api/chunk-uploader.ts` | チャンクアップロード |
| `src/api-2-legged.ts` | `src/api/api-2-legged.ts` | Swagger 生成コード |
| `src/api-3-legged.ts` | `src/api/api-3-legged.ts` | Swagger 生成コード |

### OpenAPI 仕様

| 元ファイル | 統合先 |
|---|---|
| `docs/ext-v2-prod.yaml` | `docs/ext-v2-prod.yaml` |
| `docs/ext-3legged-v2-prod.yaml` | `docs/ext-3legged-v2-prod.yaml` |

## 3. ブラウザ互換修正

api-sdk は Node.js 環境向けに書かれていたため、ブラウザで動作するよう以下を修正:

### client-2-legged.ts

- `import { ReadStream } from "fs"` を削除
- `import { Buffer } from "buffer"` を削除
- `buffer: Buffer | ReadStream` を `buffer: ArrayBuffer | Blob` に変更

### client-3-legged.ts

- `import { ReadStream } from "fs"` を削除
- `import { Buffer } from "buffer"` を削除
- `file: Chunkable | File | ReadStream | Buffer` を `file: Chunkable | File` に変更

### chunk-uploader.ts

変更不要（既にブラウザ互換: `Blob`, `ArrayBuffer`, `ReadableStream` を使用）

## 4. Swagger コード再生成

### スクリプト

```bash
npm run generate:2legged   # docs/ext-v2-prod.yaml → src/api/api-2-legged.ts
npm run generate:3legged   # docs/ext-3legged-v2-prod.yaml → src/api/api-3-legged.ts
```

### 再生成が必要なタイミング

- RCDE API の仕様が更新されたとき
- OpenAPI YAML ファイルが更新されたとき

## 5. 依存関係の追加

| パッケージ | 種類 | 理由 |
|---|---|---|
| `axios` | dependencies | api-sdk が使用する HTTP クライアント |
| `swagger-typescript-api` | devDependencies | API コード再生成用 |

### ビルド設定

`vite.config.ts` の `rollupOptions.external` に `axios` を追加し、バンドルから除外。
