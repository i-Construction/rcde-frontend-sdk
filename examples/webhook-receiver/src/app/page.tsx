import Link from "next/link";

// .env.example の INBOX_TOKENS と対応する。token を増やすときは両方を直す。
const INBOXES = [
  { token: "recv1", reply: "200", use: "通常の受信確認" },
  { token: "recv2", reply: "200", use: "通知先を 2 つ登録したときの確認" },
  { token: "recv3", reply: "200", use: "予備" },
  { token: "recv4xx", reply: "400", use: "エラー応答を返したときの確認" },
] as const;

export default function Home() {
  return (
    <main className="home">
      <h1>RCDE webhook inbox</h1>
      <p className="muted">
        R-CDE からの通知を受け取る。この画面は localhost で開く。R-CDE に登録する通知先 URL
        は、cloudflared 起動後に確認画面が埋める公開ホスト + /api/inbox/&lt;token&gt;。
      </p>
      <p className="muted">localhost の URL は通知先として登録できない。</p>
      <ul>
        {INBOXES.map((inbox) => (
          <li key={inbox.token}>
            <Link href={`/t/${inbox.token}`}>/t/{inbox.token}</Link>
            {" — "}
            初期 {inbox.reply} / {inbox.use}
          </li>
        ))}
      </ul>
    </main>
  );
}
