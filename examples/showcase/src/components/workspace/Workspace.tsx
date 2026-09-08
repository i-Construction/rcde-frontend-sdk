"use client";

import { useMemo, useState } from "react";
import { RCDEClient, type RCDEAppConfig, type RCDEClientOptions } from "@i-con/frontend-sdk";
import { AppHeader } from "@/components/layout/AppHeader";
import { InspectorPanel } from "@/components/inspector/InspectorPanel";
import { SimpleRcdeDialog } from "@/components/SimpleRcdeDialog";
import { FileListSidebar } from "@/components/sidebar/FileListSidebar";
import { UploadModal } from "@/components/sidebar/UploadModal";
import { ViewerCanvas } from "@/components/viewer/ViewerCanvas";
import { ViewerToolbar } from "@/components/viewer/ViewerToolbar";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useWorkspace } from "@/components/workspace/WorkspaceProvider";

/**
 * 3ペインシェル本体（左: ファイル一覧 / 中央: ビューア / 右: インスペクタ）。
 *
 * `ViewerProviders` の内側でレンダーされる前提。SDK の Context を使う
 * 子コンポーネント（`ViewerToolbar` など）は、そのプロバイダ配下に置く必要がある。
 */
export function Workspace({ app }: { app: RCDEAppConfig }) {
  const { constructionId, contractId } = useWorkspace();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [simpleOpen, setSimpleOpen] = useState(false);

  // ヘッダーの現場/契約セレクタは Viewer 初期化前にも動く必要がある。
  // SDK の `useClient()` のインスタンスは `Viewer` が `initialize(app)` を
  // 呼ぶまで生成されないため、一覧取得用のクライアントは自前で作る。
  const client = useMemo(() => {
    // `fetchImpl` を渡すとリクエストを差し替えられる（テストやログ差し込み用）。
    // ここでは既定の `fetch` に任せるため指定しない。
    const options: RCDEClientOptions = {
      accessToken: app.token,
      baseUrl: app.baseUrl,
      authType: app.authType,
    };
    return new RCDEClient(options);
  }, [app]);

  return (
    <TooltipProvider>
      <div className="flex h-screen flex-col overflow-hidden">
        <AppHeader
          client={client}
          onOpenUpload={() => setUploadOpen(true)}
          onOpenSimpleDialog={() => setSimpleOpen(true)}
        />

        <div className="min-h-0 flex-1">
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={24} minSize={16}>
              <FileListSidebar onOpenUpload={() => setUploadOpen(true)} />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={51} minSize={30}>
              <div className="relative h-full w-full overflow-hidden bg-gray-50">
                <ViewerCanvas app={app} />
                <ViewerToolbar />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={25} minSize={18}>
              <InspectorPanel />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        <UploadModal open={uploadOpen} onOpenChange={setUploadOpen} />
        <SimpleRcdeDialog
          app={app}
          open={simpleOpen}
          onOpenChange={setSimpleOpen}
          defaultConstructionId={constructionId}
          defaultContractId={contractId}
        />
      </div>
    </TooltipProvider>
  );
}
