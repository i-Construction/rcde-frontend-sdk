"use client";

import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Workspace } from "@/components/workspace/Workspace";
import { WorkspaceProvider } from "@/components/workspace/WorkspaceProvider";
import { ViewerProviders } from "@/components/viewer/ViewerProviders";
import { useRcdeSession } from "@/hooks/useRcdeSession";
import { DEFAULT_CONSTRUCTION_ID, DEFAULT_CONTRACT_ID } from "@/lib/env";

const SETUP_SNIPPET = `cp .env.example .env

# .env を編集して以下を設定する
RCDE_CLIENT_ID=<発行したクライアントID>
RCDE_CLIENT_SECRET=<発行したクライアントシークレット>
RCDE_API_BASE_URL=https://api.rcde.jp`;

/**
 * 認証状態に応じて画面全体を切り替えるルートコンポーネント。
 *
 * トークンが取れたときだけ `WorkspaceProvider` → `ViewerProviders` →
 * `Workspace` を組み立てる。`app`（`RCDEAppConfig`）が確定する前に
 * `Viewer` をマウントすると初期化が空振りするため。
 */
export function AppShell() {
  const session = useRcdeSession();

  if (session.status === "loading") {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
        <p className="text-muted-foreground text-sm">RCDE に接続しています…</p>
      </div>
    );
  }

  if (session.status === "missing-credentials") {
    return (
      <div className="flex h-screen items-center justify-center p-6">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-base">環境変数の設定が必要です</CardTitle>
            <CardDescription>{session.message}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm">
                プロジェクト直下の <code>.env.example</code> をコピーして <code>.env</code>{" "}
                を作り、2-legged 認証用の値を設定してください。
              </p>
              <pre className="bg-muted overflow-x-auto rounded-md p-3 text-xs leading-relaxed">
                {SETUP_SNIPPET}
              </pre>
            </div>

            <p className="text-sm">
              クライアントID / シークレットは RCDE
              でアプリケーションを作成すると発行されます。手順は{" "}
              <a
                href="https://github.com/i-Construction/rcde-api-sdk?tab=readme-ov-file#事前準備"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                rcde-api-sdk の「事前準備」
              </a>{" "}
              を参照してください。
            </p>

            <Button onClick={session.reload}>再読み込み</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (session.status === "error") {
    return (
      <div className="flex h-screen items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-xl">
          <AlertTitle>RCDE への接続に失敗しました</AlertTitle>
          <AlertDescription>
            <p>{session.message}</p>
            <Button variant="outline" size="sm" onClick={session.reload}>
              再試行
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <WorkspaceProvider
      initialConstructionId={DEFAULT_CONSTRUCTION_ID}
      initialContractId={DEFAULT_CONTRACT_ID}
    >
      <ViewerProviders>
        <Workspace app={session.app} />
      </ViewerProviders>
    </WorkspaceProvider>
  );
}
