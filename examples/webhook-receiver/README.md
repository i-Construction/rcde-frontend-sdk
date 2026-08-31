# RCDE Frontend SDK Example（Webhook 受信型）

R-CDE から送られてくる Webhook を自分のサーバーで受け取るサンプルです。
点群ファイルの PCLOD 処理が完了したときの通知（`contract_file.processing.completed`）を受け、
envelope（リクエスト本体とヘッダー）が期待どおりの形になっているかを判定します。

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

## 画面

トップ `http://localhost:8765` に `.env` で用意した token の一覧が出ます。
それぞれの初期応答と用途が並び、リンクから確認画面へ移動します。

確認画面 `http://localhost:8765/t/recv1` では次を扱います。

- **通知先 URL** — R-CDE に登録する URL。cloudflared を起動していれば公開ホストが自動で入ります（後述）。手で書き換えることもでき、`localhost` は通知先にできないのでコピーボタンは無効になります
- **次の応答 / 遅延 ms** — 次に受ける通知へ返すステータス（200 / 400 / 500）と、応答を返すまでの待ち時間。隣のシーケンス図が現在の設定どおりに描き変わります
- **受信一覧** — 届いた通知が新しい順に並びます。各行に「整合 / 不整合」「重複」「無視」のバッジが付きます
- **整合チェック** — 選んだ通知の envelope が期待どおりかを項目ごとに OK / NG で出します
- **生 JSON とヘッダー** — 受け取った本体そのものと、`X-RCDE-Event-Id` / `Content-Type`

一覧と整合チェックは SSE（`/api/inbox/<token>/stream`）で更新するので、手動リロードは要りません。

## 受信を確認する

```bash
curl -sS -D - -o /dev/null \
  -H 'Content-Type: application/json' \
  -H 'X-RCDE-Event-Id: evt_local_1' \
  -d '{"id":"evt_local_1","type":"contract_file.processing.completed","createdAt":"2026-08-31T00:00:00Z","data":{"contractFileId":1}}' \
  http://localhost:8765/api/inbox/recv1
```

200 が返り、受け取った envelope は次で確認できます。

```bash
curl -sS http://localhost:8765/api/inbox/recv1/events
```

## API

| メソッド・パス                             | 用途                                                        |
| ------------------------------------------ | ----------------------------------------------------------- |
| `POST /api/inbox/<token>`                  | 通知を受け取る。設定した応答（200 / 400 / 500）と遅延を返す |
| `GET /api/inbox/<token>/events`            | 受信済みの envelope を新しい順に返す                        |
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

どちらの token 変数も空なら、すべてのリクエストを 401 で拒否し、起動ログに理由を出します。
`.env` を置き忘れたまま公開 URL に出しても、未知の token が素通りすることはありません。

`.env.example` では動作確認しやすいよう 4 本の token を用意しています。
`recv4xx` だけは起動時から 400 を返すので、エラー応答時の挙動を確かめられます。

## envelope の整合チェック

確認画面は届いた通知が期待どおりの envelope かを判定します。判定の実体は
`src/lib/envelope.ts` の `assessCompletedEnvelope` で、README はその要約です。
項目を足したいときはこの関数を直してください。

必須（1 つでも欠けると「不整合」）:

- 本体が JSON オブジェクトで、トップレベルが `id` / `type` / `createdAt` / `data` だけ
- `type` が `contract_file.processing.completed`
- `id` と `createdAt` が空でない
- `data.contractFileId` が正の整数
- `X-RCDE-Event-Id` が本体の `id` と一致
- `Content-Type` が JSON
- 署名ヘッダー（`X-RCDE-Signature` / `X-Webhook-Signature` / `Stripe-Signature`）が付いていない

参考（合否には数えない）:

- `data.constructionId` が付いているか

「重複」と「無視」は整合とは別のバッジです。同じ `X-RCDE-Event-Id` を再び受けたら重複、
知らない `type` を受けたら無視になりますが、どちらも不整合にはしません。

## 応答ステータスと再送

配信側は受信サーバーの応答で再送するかどうかを決めます。

| 応答                     | 配信側の扱い     |
| ------------------------ | ---------------- |
| 2xx                      | 受理。再送しない |
| 429                      | 再送する         |
| その他の 4xx             | 再送しない       |
| 5xx                      | 再送する         |
| 応答なし（タイムアウト） | 再送する         |

知らない `type` に 4xx を返すと、対応していないだけの通知が黙って捨てられます。
このサンプルが未知の `type` を常に 200 で受けるのはそのためです。

タイムアウトの挙動を試したいときは、応答設定ではなく `next` か tunnel を止めてください。
遅延（`delayMs`）は最大 30 秒までで、それだけでは配信側のタイムアウトに届かないことがあります。

## 公開 URL（cloudflared）

R-CDE に `http://localhost:8765/...` を通知先として登録することはできません。
ローカルで受け取るには、外から届く HTTPS の URL が要ります。

```bash
brew install cloudflared
cloudflared tunnel --url http://localhost:8765
```

出てきた `https://xxxx.trycloudflare.com` が公開ホストです。
確認画面は起動中の cloudflared のメトリクスポート（`127.0.0.1:20241`〜`20245`）に問い合わせて
このホストを自動で拾い、通知先 URL の欄に入れます。拾えないときは手で貼れます。

このホストは cloudflared を起動し直すたびに変わります。変わったら R-CDE 側の通知先 URL も
新しいホストで登録し直してください。確認画面自体は localhost のまま開きます。

## トラブルシューティング

### `listen EADDRINUSE: address already in use :::8765`

8765 を既に誰かが掴んでいます。多くは別ターミナルの `yarn dev` か、落とし損ねた `next` です。
cloudflared は 8765 を listen しないので、このエラーの相手は `next` です。

先に `http://localhost:8765` を開いてください。画面が出るなら二重起動しようとしているだけなので、
そのプロセスをそのまま使います。

止めたいときだけ listen しているプロセスを終了してから立て直します。受信ログはメモリなので、
止めた時点で消えます。

```bash
lsof -nP -iTCP:8765 -sTCP:LISTEN
kill <PID>
```

### 通知先 URL が空、または localhost のまま

確認画面は localhost で開き、通知先 URL だけを cloudflared から拾います。
tunnel が起動していない、または Cloudflare 側との回線が切れていると空のままになります。
`cloudflared tunnel --url http://localhost:8765` を立てて数秒待ってください。

古いホストのまま変わらないときは、前の cloudflared がメトリクスポートに残っています。
確認画面は `/ready` が 200 を返す tunnel だけを採用します。

```bash
lsof -nP -iTCP:20241-20245 -sTCP:LISTEN
kill <PID>
```

### cloudflared が `control stream encountered a failure` を繰り返す

Cloudflare 側との制御回線が切れています。スリープ・ネットワーク切り替え・長時間の放置で起きます。
プロセスを止めて打ち直してください。**ホストが変わる**ので、R-CDE 側の通知先 URL も登録し直します。

### 届いたはずの通知が画面に出ない

Cloudflare のブラウザチャレンジが POST を弾いていることがあります。
`GET /api/inbox/<token>/events` にも出ていないなら、そもそも配信が届いていません。
同じ URL を複数のアプリに登録していると、通知が 1 通にまとまることもあります。
確認したい経路ごとに別の token を使ってください。
