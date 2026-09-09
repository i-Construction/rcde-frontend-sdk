# サンプルアプリ

`@i-con/frontend-sdk` を使う側と、R-CDE からの通知を受ける側で 3 つのサンプルがあります。
いずれも Next.js アプリで、Docker や DB は要りません。

| サンプル                                          | 使う場面                                           | SDK 依存              | ポート |
| ------------------------------------------------- | -------------------------------------------------- | --------------------- | ------ |
| [`standalone/`](standalone/README.md)             | ブラウザから R-CDE の点群を表示・アップロードする  | あり（`link:../../`） | 3000   |
| [`showcase/`](showcase/README.md)                 | SDK の公開 API 全機能を 1 画面で動かして確認する   | あり（`link:../../`） | 3000   |
| [`webhook-receiver/`](webhook-receiver/README.md) | R-CDE の点群処理の完了通知を自分のサーバーで受ける | なし                  | 8765   |

`webhook-receiver/` はポートが別なので、他のどちらかと同時に起動して突き合わせられます。
`standalone/` と `showcase/` は同じ 3000 番なので同時には起動できません。

## どちらを見るか

点群を画面に出す、アップロードする、現場や契約を切り替える、といったブラウザ側の実装を
知りたいなら [`standalone/`](standalone/README.md) です。SDK のコンポーネントとフックを
そのまま使っています。

ある API の呼び方を具体的に知りたい、あるいは SDK に何ができるのかを一覧で把握したいなら
[`showcase/`](showcase/README.md) です。export しているコンポーネント・フック・クラス・
ユーティリティ・型を余さず使い、公開 API と使用箇所の対応表
（[showcase/docs/FEATURE_COVERAGE.md](showcase/docs/FEATURE_COVERAGE.md)）を付けています。
実務向けの最小構成というより、機能を網羅した動く仕様書として使う想定です。

アップロードした点群の処理がいつ終わったかを知りたいなら
[`webhook-receiver/`](webhook-receiver/README.md) です。R-CDE は完了時に Webhook を送るので、
受けるのはブラウザではなく自分のサーバーになります。こちらは SDK に依存しません。

## 共通の要件

- Node.js **24.x**（リポジトリルートの Volta 設定: 24.18.0）
- パッケージマネージャは yarn

`standalone/` はローカルの SDK をシンボリックリンクで参照するため、先にリポジトリルートで
`yarn install && yarn build` を実行してください。`showcase/` も同じくルートで `yarn install`
が要りますが、SDK を `dist` ではなく `../../src` へ alias しているのでルートの `yarn build`
は不要です。`webhook-receiver/` はそのまま起動できます。
