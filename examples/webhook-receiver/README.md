# RCDE Frontend SDK Example（Webhook 受信型）

R-CDE から送られてくる Webhook を自分のサーバーで受け取るサンプルです。
点群ファイルの PCLOD 処理が完了したときの通知（`contract_file.processing.completed`）を受け、
封筒（リクエスト本体とヘッダー）が期待どおりの形になっているかを判定します。

`@i-con/frontend-sdk` には依存しません。SDK はブラウザ側で点群を扱うためのもので、
Webhook を受けるのはサーバー側の仕事だからです。SDK をブラウザから使うサンプルは
`../standalone/` を参照してください。

## 要件

- Node.js **24.x**（リポジトリルートの Volta 設定: 24.18.0）
- Docker / DB 不要

## 何を受けるか

R-CDE は次の形の JSON を POST します。

```json
{
  "id": "<eventId>",
  "type": "contract_file.processing.completed",
  "createdAt": "2026-08-31T00:00:00Z",
  "data": { "contractFileId": 123 }
}
```

ヘッダーに `X-RCDE-Event-Id` が付き、本体の `id` と同じ値になります。
`data.constructionId` はオプショナルで、届かないこともあります。

同じ `X-RCDE-Event-Id` の通知が再送されることがあるため、受信側は
イベント ID で重複を判定できるようにしておく必要があります。

## 起動

```bash
cd examples/webhook-receiver
cp .env.example .env
yarn install
yarn dev
```

`http://localhost:8765` で待ち受けます（`../standalone/` の 3000 とは別なので同時に起動できます）。

## 受信を確認する

```bash
curl -sS -D - -o /dev/null \
  -H 'Content-Type: application/json' \
  -H 'X-RCDE-Event-Id: evt_local_1' \
  -d '{"id":"evt_local_1","type":"contract_file.processing.completed","createdAt":"2026-08-31T00:00:00Z","data":{"contractFileId":1}}' \
  http://localhost:8765/api/inbox/recv1
```

200 が返り、受け取った封筒は次で確認できます。

```bash
curl -sS http://localhost:8765/api/inbox/recv1/events
```

## API

| メソッド・パス                             | 用途                                                        |
| ------------------------------------------ | ----------------------------------------------------------- |
| `POST /api/inbox/<token>`                  | 通知を受け取る。設定した応答（200 / 400 / 500）と遅延を返す |
| `GET /api/inbox/<token>/events`            | 受信済みの封筒を新しい順に返す                              |
| `DELETE /api/inbox/<token>/events?seq=<n>` | 受信した 1 件を消す                                         |
| `GET /api/inbox/<token>/settings`          | 現在の応答設定を返す                                        |
| `PUT /api/inbox/<token>/settings`          | 次の応答ステータスと遅延を変える                            |
| `GET /api/inbox/<token>/stream`            | 受信を SSE で流す                                           |
| `GET /api/inbox/public-origin`             | ローカルで動いている cloudflared から公開 URL を取る        |

受信ログはプロセスメモリに置きます。`next` を再起動すると消え、`INBOX_REPLY_*` の初期値に戻ります。
1 つの token につき直近 100 件まで保持します。

## 環境変数

`.env.example` をコピーして使います。

| 変数                  | 用途                                                               |
| --------------------- | ------------------------------------------------------------------ |
| `INBOX_TOKENS`        | 受け付ける token のカンマ区切り                                    |
| `INBOX_TOKEN`         | token が 1 本だけのときの秘密。`INBOX_TOKENS` があるときは使わない |
| `INBOX_REPLY_<token>` | その token の初期応答。`200` / `400` / `500` のみ。未設定は 200    |

どちらの token 変数も空なら、空でない token をすべて通します。ローカル以外では必ず設定してください。

`.env.example` では動作確認しやすいよう 4 本の token を用意しています。
`recv4xx` だけは起動時から 400 を返すので、エラー応答時の挙動を確かめられます。
