# テストケース一覧

> 自動生成: `npm run test:cases`（手動編集しないでください）

合計: 6 ファイル / 45 テストケース

## サマリー

| ファイル | ケース数 |
|---|--:|
| `src/api/chunk-uploader.test.ts` | 6 |
| `src/api/client-2-legged.test.ts` | 8 |
| `src/api/client-3-legged.test.ts` | 14 |
| `src/api/common.test.ts` | 6 |
| `example-poc/src/lib/auth-store.test.ts` | 4 |
| `example-poc/src/lib/rcde-server.test.ts` | 7 |
| **合計** | **45** |

## src/api/chunk-uploader.test.ts

| # | グループ | テストケース | 備考 |
|--:|---|---|---|
| 1 | chunkedUpload | ArrayBuffer/Uint8Array を chunkSize ごとに分割して upload を呼ぶ |  |
| 2 | chunkedUpload | onProgress に累積送信バイト数と total を渡す |  |
| 3 | chunkedUpload | chunkSize 未指定時は既定 5MiB で 1 チャンクになる（小さいデータ） |  |
| 4 | chunkedUpload | ReadableStream を chunkSize 境界で分割し、余り(carry)を最後に flush する |  |
| 5 | chunkedUpload | ReadableStream の onProgress は total=null で累積バイト数を渡す |  |
| 6 | chunkedUpload | Blob を chunkSize ごとに分割する |  |

## src/api/client-2-legged.test.ts

| # | グループ | テストケース | 備考 |
|--:|---|---|---|
| 1 | RCDEClient2Legged: 認証ガード | 認証前に API メソッドを呼ぶと 'Token is not available' を throw する |  |
| 2 | RCDEClient2Legged: 認証ガード | authenticate がレスポンスの data をトークンとして格納する |  |
| 3 | RCDEClient2Legged: Date → ISO 文字列変換 | createConstruction は period / contractedAt を toISOString に変換して渡す |  |
| 4 | RCDEClient2Legged: Date → ISO 文字列変換 | createContract は contractedAt を toISOString に変換して渡す |  |
| 5 | RCDEClient2Legged.uploadContractFile: エラー分岐 | size を算出できない（0）場合は 'size field is required' を throw する |  |
| 6 | RCDEClient2Legged.uploadContractFile: エラー分岐 | presignedURL が欠落していると throw する |  |
| 7 | RCDEClient2Legged.uploadContractFile: エラー分岐 | contractFileId が欠落していると throw する |  |
| 8 | RCDEClient2Legged.uploadContractFile: エラー分岐 | ArrayBuffer から size を算出し、完了レスポンスの data を返す |  |

## src/api/client-3-legged.test.ts

| # | グループ | テストケース | 備考 |
|--:|---|---|---|
| 1 | RCDEClient3Legged: setToken / getToken | getToken はトークン未設定時に throw する |  |
| 2 | RCDEClient3Legged: setToken / getToken | setToken で設定したトークンを getToken で取得できる |  |
| 3 | RCDEClient3Legged.authenticate | 正常レスポンスでトークンを格納する |  |
| 4 | RCDEClient3Legged.authenticate | 必須フィールド欠落時に throw する |  |
| 5 | RCDEClient3Legged.refreshToken | トークン未設定時は throw する |  |
| 6 | RCDEClient3Legged.refreshToken | refreshToken が空の場合は 'No refresh token' を throw する |  |
| 7 | RCDEClient3Legged.refreshToken | 不正レスポンスで throw する |  |
| 8 | RCDEClient3Legged.refreshToken | 正常時にトークンを更新し refresh_token グラントで送信する |  |
| 9 | RCDEClient3Legged: 自動リフレッシュ境界 (ensureValidAccessToken) | 期限まで 60 秒以内なら API 呼び出し前に refresh が発火する |  |
| 10 | RCDEClient3Legged: 自動リフレッシュ境界 (ensureValidAccessToken) | 期限に余裕があれば refresh せず、既存トークンで API を呼ぶ |  |
| 11 | RCDEClient3Legged: 自動リフレッシュ境界 (ensureValidAccessToken) | トークン未設定なら 'Token is not available' を throw する |  |
| 12 | RCDEClient3Legged.uploadContractFileMultipart | 正常系: partTotal を算出し各パートを PUT、s3Parts を組み立てて complete を呼ぶ |  |
| 13 | RCDEClient3Legged.uploadContractFileMultipart | パートの presignedURL が欠落していると throw する |  |
| 14 | RCDEClient3Legged.uploadContractFileMultipart | 完了に必要な情報（contractFileId 等）が欠落していると throw する |  |

## src/api/common.test.ts

| # | グループ | テストケース | 備考 |
|--:|---|---|---|
| 1 | isExpiringSoon | 期限まで skew より十分余裕があれば false |  |
| 2 | isExpiringSoon | ちょうど skew 秒前（境界 = skew）は true（<= 判定） |  |
| 3 | isExpiringSoon | skew 直前（残り 61 秒）はまだ false |  |
| 4 | isExpiringSoon | 既に期限切れ（負の残り）は true |  |
| 5 | isExpiringSoon | expiresAt が undefined / 0 のときは false（判定不能は更新しない） |  |
| 6 | isExpiringSoon | skew を任意指定できる（既定より大きい skew で true になる） |  |

## example-poc/src/lib/auth-store.test.ts

| # | グループ | テストケース | 備考 |
|--:|---|---|---|
| 1 | storeToken | token / refresh / expires の 3 cookie を共通オプション付きで set する |  |
| 2 | getStoredToken | 全 cookie が揃えば復元し expiresAt を Number に変換する |  |
| 3 | getStoredToken | いずれかの cookie が欠落していたら undefined を返す |  |
| 4 | clearToken | 3 つの cookie を delete する |  |

## example-poc/src/lib/rcde-server.test.ts

| # | グループ | テストケース | 備考 |
|--:|---|---|---|
| 1 | getAuthType | AUTH_TYPE 未設定は '2legged' を既定とする |  |
| 2 | getAuthType | AUTH_TYPE='3legged' のとき '3legged' を返す |  |
| 3 | getAuthType | 想定外の値は '2legged' にフォールバックする |  |
| 4 | resolveAccessToken | セッションが無い場合は undefined を返す |  |
| 5 | resolveAccessToken | 2-legged: authenticate して新しい accessToken を保存・返却する |  |
| 6 | resolveAccessToken | 3-legged: 期限まで 60 秒以下なら refresh し新トークンを保存・返却する |  |
| 7 | resolveAccessToken | 3-legged: 期限に余裕があれば既存 accessToken を再利用する |  |
