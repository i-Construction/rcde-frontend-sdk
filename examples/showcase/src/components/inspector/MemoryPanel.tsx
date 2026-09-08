"use client";

import type {
  ViewerMemoryAlertLevel,
  ViewerMemorySource,
  ViewerMemoryThresholdSource,
} from "@i-con/frontend-sdk";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DEFAULT_MEMORY_CONFIG,
  MEMORY_SOURCE_LABELS,
  useWorkspace,
} from "@/components/workspace/WorkspaceProvider";
import { formatBytes, formatNumber, formatTime } from "@/lib/format";

const MEMORY_SOURCES: ViewerMemoryThresholdSource[] = [
  "max-available",
  "estimate",
  "js-heap",
  "page",
];

/** 観測値ごとの注意点。`page` はブラウザ依存で取得できないことがある。 */
const SOURCE_NOTES: Record<ViewerMemoryThresholdSource, string> = {
  "max-available":
    "`pageBytes` / `jsHeapBytes` / `estimatedViewerBytes` の最大値で判定します。どれかが取得できれば必ず値が出るため、既定値になっています。",
  estimate:
    "SDK が PNG キャッシュ保持量から算出した推定値です。LOD タイルの表示/非表示だけでは減りません。",
  "js-heap":
    "`performance.memory.usedJSHeapSize` が使える場合の JS ヒープ量です（Chromium 系）。取得できないブラウザでは判定がスキップされます。",
  page: "`performance.measureUserAgentSpecificMemory()` に依存し、ブラウザによっては取得できません。取得できない場合は判定がスキップされます。",
};

/**
 * `ViewerMemorySample.source`（= `ViewerMemorySource`）は、そのサンプルで実際に使えた
 * 計測手段を示す。閾値判定に使う `ViewerMemoryThresholdSource` とは別の型で、
 * `max-available` は存在しない。
 */
const SAMPLE_SOURCE_LABELS: Record<ViewerMemorySource, string> = {
  "browser-precise": "browser-precise（ページ全体の精密計測が成功）",
  "js-heap": "js-heap（JS ヒープのみ取得できた）",
  estimate: "estimate（SDK の推定値のみ）",
};

/**
 * `memoryMonitoring` の設定 UI と観測結果の表示。
 *
 * `memoryMonitoring`（Viewer に渡すオプション）自体は WorkspaceProvider が `memoryConfig` から
 * 組み立てる。このパネルは `memoryConfig` の編集と、コールバックで受け取った
 * `lastSample` / `lastAlert` / `alertLevel` の表示だけを担当する。
 */
export function MemoryPanel() {
  const { memoryConfig, setMemoryConfig, lastSample, lastAlert, alertLevel } = useWorkspace();

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col">
            <Label className="text-xs">メモリ監視を有効化（enabled）</Label>
            <span className="text-muted-foreground text-xs">
              既定は OFF です。`enabled: true` を明示しない限り監視されません。
            </span>
          </div>
          <Switch
            checked={memoryConfig.enabled}
            onCheckedChange={(checked) => setMemoryConfig({ ...memoryConfig, enabled: checked })}
            aria-label="メモリ監視を有効化"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs" htmlFor="memory-interval">
            サンプリング間隔（sampleIntervalMs）
          </Label>
          <Input
            id="memory-interval"
            type="number"
            step={1000}
            min={0}
            className="h-8 text-xs"
            value={memoryConfig.sampleIntervalMs}
            onChange={(event) =>
              setMemoryConfig({
                ...memoryConfig,
                sampleIntervalMs: toFiniteNumber(event.target.value),
              })
            }
          />
          <p className="text-muted-foreground text-xs">
            SDK 側で最低 1000 ミリ秒にクランプされます。推奨は 10000〜30000 ミリ秒です。精密メモリ
            計測が解決したタイミングでは、この間隔とは別に追加サンプルが発火することがあります。
          </p>
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col">
            <Label className="text-xs">閾値を渡す（thresholds）</Label>
            <span className="text-muted-foreground text-xs">
              OFF にすると `thresholds` を省略します。`onSample` だけが呼ばれ、アラート判定は
              行われません。
            </span>
          </div>
          <Switch
            checked={memoryConfig.thresholdsEnabled}
            onCheckedChange={(checked) =>
              setMemoryConfig({ ...memoryConfig, thresholdsEnabled: checked })
            }
            aria-label="閾値を渡す"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">判定に使う観測値（source）</Label>
          <Select
            value={memoryConfig.source}
            disabled={!memoryConfig.thresholdsEnabled}
            onValueChange={(value) =>
              setMemoryConfig({ ...memoryConfig, source: value as ViewerMemoryThresholdSource })
            }
          >
            <SelectTrigger size="sm" className="w-full text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MEMORY_SOURCES.map((source) => (
                <SelectItem key={source} value={source}>
                  {MEMORY_SOURCE_LABELS[source]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-xs">{SOURCE_NOTES[memoryConfig.source]}</p>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <div className="flex flex-col gap-1">
            <Label className="text-xs" htmlFor="memory-warning">
              警告 MiB
            </Label>
            <Input
              id="memory-warning"
              type="number"
              min={0}
              className="h-8 text-xs"
              disabled={!memoryConfig.thresholdsEnabled}
              value={memoryConfig.warningMiB}
              onChange={(event) =>
                setMemoryConfig({
                  ...memoryConfig,
                  warningMiB: toFiniteNumber(event.target.value),
                })
              }
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs" htmlFor="memory-critical">
              危険 MiB
            </Label>
            <Input
              id="memory-critical"
              type="number"
              min={0}
              className="h-8 text-xs"
              disabled={!memoryConfig.thresholdsEnabled}
              value={memoryConfig.criticalMiB}
              onChange={(event) =>
                setMemoryConfig({
                  ...memoryConfig,
                  criticalMiB: toFiniteNumber(event.target.value),
                })
              }
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs" htmlFor="memory-hysteresis">
              戻り幅 MiB
            </Label>
            <Input
              id="memory-hysteresis"
              type="number"
              min={0}
              className="h-8 text-xs"
              disabled={!memoryConfig.thresholdsEnabled}
              value={memoryConfig.hysteresisMiB}
              onChange={(event) =>
                setMemoryConfig({
                  ...memoryConfig,
                  hysteresisMiB: toFiniteNumber(event.target.value),
                })
              }
            />
          </div>
        </div>
        <p className="text-muted-foreground text-xs">
          単位は MiB で入力し、バイト値へ変換して SDK に渡されます。戻り幅（`hysteresisBytes`）を
          省略すると SDK 既定の 32 MiB が使われ、閾値付近での警告の出入りを抑えます。
        </p>

        <Button
          size="sm"
          variant="outline"
          className="text-xs"
          onClick={() => setMemoryConfig(DEFAULT_MEMORY_CONFIG)}
        >
          既定値に戻す
        </Button>
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-semibold">アラートレベル</h3>
          <AlertLevelBadge level={alertLevel} />
        </div>

        {lastAlert === undefined ? (
          <p className="text-muted-foreground text-xs">
            閾値超過はまだ発生していません（`onAlert` 未発火）。
          </p>
        ) : (
          <>
            <Alert variant={lastAlert.level === "critical" ? "destructive" : "warning"}>
              <AlertTitle className="text-xs">
                {lastAlert.level === "critical" ? "危険域" : "警告"}を検出
              </AlertTitle>
              <AlertDescription className="text-xs">
                <p>
                  `onAlert` はレベルが上がった瞬間だけ発火します。同じレベルに留まっている間は
                  再通知されません。
                </p>
              </AlertDescription>
            </Alert>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>フィールド</TableHead>
                  <TableHead>値</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <SampleRow label="level" value={lastAlert.level} />
                <SampleRow label="thresholdBytes" value={formatBytes(lastAlert.thresholdBytes)} />
                <SampleRow label="observedBytes" value={formatBytes(lastAlert.observedBytes)} />
                <SampleRow
                  label="sample.timestamp"
                  value={formatTime(lastAlert.sample.timestamp)}
                />
              </TableBody>
            </Table>
          </>
        )}
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <div>
          <h3 className="text-xs font-semibold">最新サンプル（ViewerMemorySample）</h3>
          <p className="text-muted-foreground text-xs">
            `estimatedViewerBytes` は PNG キャッシュ保持量ベースのため、LOD タイルの表示/非表示
            だけでは減りません。`pageBytes` は計測完了を待つ都合で、最新サンプル時刻より古い値の
            場合があります（`pageBytesMeasuredAt` で確認できます）。
          </p>
        </div>

        {lastSample === undefined ? (
          <p className="text-muted-foreground text-xs">
            監視を有効にするとサンプルが表示されます。
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>フィールド</TableHead>
                <TableHead>値</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <SampleRow label="timestamp" value={formatTime(lastSample.timestamp)} />
              <SampleRow label="source" value={SAMPLE_SOURCE_LABELS[lastSample.source]} />
              <SampleRow
                label="estimatedViewerBytes"
                value={formatBytes(lastSample.estimatedViewerBytes)}
              />
              <SampleRow label="pageBytes" value={formatBytes(lastSample.pageBytes)} />
              <SampleRow
                label="pageBytesMeasuredAt"
                value={formatTime(lastSample.pageBytesMeasuredAt)}
              />
              <SampleRow label="jsHeapBytes" value={formatBytes(lastSample.jsHeapBytes)} />
              <SampleRow label="loadedFileCount" value={formatNumber(lastSample.loadedFileCount)} />
              <SampleRow label="loadedTileCount" value={formatNumber(lastSample.loadedTileCount)} />
              <SampleRow label="compressedBytes" value={formatBytes(lastSample.compressedBytes)} />
              <SampleRow label="decodedBytes" value={formatBytes(lastSample.decodedBytes)} />
              <SampleRow label="geometryCount" value={formatNumber(lastSample.geometryCount)} />
              <SampleRow label="textureCount" value={formatNumber(lastSample.textureCount)} />
              <SampleRow
                label="visibleFileIds"
                value={
                  lastSample.visibleFileIds.length === 0
                    ? "-"
                    : lastSample.visibleFileIds.join(", ")
                }
              />
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}

function SampleRow({ label, value }: { label: string; value: string }) {
  return (
    <TableRow>
      <TableCell className="text-xs">{label}</TableCell>
      <TableCell className="text-xs whitespace-normal">{value}</TableCell>
    </TableRow>
  );
}

/** `alertLevel` が undefined のときは「正常」を success で表示する。 */
function AlertLevelBadge({ level }: { level: ViewerMemoryAlertLevel | undefined }) {
  if (level === "critical") {
    return <Badge variant="destructive">critical</Badge>;
  }
  if (level === "warning") {
    return <Badge variant="warning">warning</Badge>;
  }
  return <Badge variant="success">正常</Badge>;
}

function toFiniteNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
