"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiPlaygroundPanel } from "@/components/inspector/ApiPlaygroundPanel";
import { AppearancePanel } from "@/components/inspector/AppearancePanel";
import { EventLogPanel } from "@/components/inspector/EventLogPanel";
import { MemoryPanel } from "@/components/inspector/MemoryPanel";
import { ReferencePointPanel } from "@/components/inspector/ReferencePointPanel";
import { TransformPanel } from "@/components/inspector/TransformPanel";

/** 右ペインは 300〜400px 程度しかないため、タブ内容は縦積み・`text-xs` を基本にする。 */
const TAB_CONTENT_CLASS = "min-h-0 flex-1 overflow-y-auto p-3";

/** 6 つのタブは 1 行に収まらないので `grid grid-cols-3` を 2 段にして並べる。 */
const TAB_TRIGGER_CLASS = "h-7 text-xs";

/**
 * 右ペインのインスペクタ。
 *
 * SDK の公開 API を機能ごとにタブへ分割している。
 * - 表示: `ViewerBridge.setAppearance` / `r3f` フラグ / 自前 `ReferencePointAxis`
 * - Transform: `ViewerBridge.setTransform` / `ViewerBridge.reset`
 * - 基準点: `useReferencePoint`
 * - メモリ: `memoryMonitoring`
 * - イベント: `onObjectClick` / `onObjectHover` / `ViewerBridge.addListener`
 * - API: `RCDEClient` の各メソッド
 */
export function InspectorPanel() {
  return (
    <div className="bg-card flex h-full w-full flex-col overflow-hidden border-l">
      <div className="flex h-10 shrink-0 items-center border-b px-3">
        <h2 className="text-sm font-semibold">インスペクタ</h2>
      </div>

      <Tabs defaultValue="appearance" className="flex min-h-0 flex-1 flex-col gap-0">
        <div className="shrink-0 border-b p-2">
          <TabsList className="grid h-auto w-full grid-cols-3 gap-1">
            <TabsTrigger value="appearance" className={TAB_TRIGGER_CLASS}>
              表示
            </TabsTrigger>
            <TabsTrigger value="transform" className={TAB_TRIGGER_CLASS}>
              Transform
            </TabsTrigger>
            <TabsTrigger value="reference" className={TAB_TRIGGER_CLASS}>
              基準点
            </TabsTrigger>
            <TabsTrigger value="memory" className={TAB_TRIGGER_CLASS}>
              メモリ
            </TabsTrigger>
            <TabsTrigger value="events" className={TAB_TRIGGER_CLASS}>
              イベント
            </TabsTrigger>
            <TabsTrigger value="api" className={TAB_TRIGGER_CLASS}>
              API
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="appearance" className={TAB_CONTENT_CLASS}>
          <AppearancePanel />
        </TabsContent>
        <TabsContent value="transform" className={TAB_CONTENT_CLASS}>
          <TransformPanel />
        </TabsContent>
        <TabsContent value="reference" className={TAB_CONTENT_CLASS}>
          <ReferencePointPanel />
        </TabsContent>
        <TabsContent value="memory" className={TAB_CONTENT_CLASS}>
          <MemoryPanel />
        </TabsContent>
        <TabsContent value="events" className={TAB_CONTENT_CLASS}>
          <EventLogPanel />
        </TabsContent>
        <TabsContent value="api" className={TAB_CONTENT_CLASS}>
          <ApiPlaygroundPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
