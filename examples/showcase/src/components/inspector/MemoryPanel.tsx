"use client";

import type {
  ViewerMemoryAlertLevel,
  ViewerMemorySample,
  ViewerMemorySource,
  ViewerMemoryThresholdTarget,
} from "@i-con/frontend-sdk";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  MEMORY_TARGETS,
  MEMORY_TARGET_LABELS,
  useWorkspace,
  type MemoryTargetConfig,
} from "@/components/workspace/WorkspaceProvider";
import { formatBytes, formatNumber, formatTime } from "@/lib/format";

/** 監視対象ごとの注意点。`page` / `jsHeap` はブラウザ依存で取得できないことがある。 */
const TARGET_NOTES: Record<ViewerMemoryThresholdTarget, string> = {
  estimate:
    "SDK が PNG キャッシュ保持量から算出した推定値です。どの環境でも必ず取得できるため、判定を確実に効かせたい場合はこの対象に閾値を置きます。",
  jsHeap:
    "`performance.memory.usedJSHeapSize` が使える場合の JS ヒープ量です（Chromium 系）。取得できないブラウザでは判定がスキップされます。",
  page: "`performance.measureUserAgentSpecificMemory()` に依存し、ブラウザによっては取得できません。取得できない場合は判定がスキップされます。",
};

/**
 * `ViewerMemorySample.source`（= `ViewerMemorySource`）は、そのサンプルで実際に使えた
 * 計測手段を示す。閾値の対象を表す `ViewerMemoryThresholdTarget` とは別の型。
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

  const updateTarget = (
    target: ViewerMemoryThresholdTarget,
    patch: Partial<MemoryTargetConfig>
  ) => {
    setMemoryConfig({
      ...memoryConfig,
      targets: {
        ...memoryConfig.targets,
        [target]: { ...memoryConfig.targets[target], ...patch },
      },
    });
  };

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
            SDK 既定は 10000 ミリ秒で、最低 1000 ミリ秒にクランプされます。推奨は 10000〜30000
            ミリ秒です。精密メモリ計測が解決したタイミングでは、この間隔とは別に追加サンプルが
            発火することがあります。
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

        <p className="text-muted-foreground text-xs">
          閾値は estimate / jsHeap / page の 3 値それぞれに設定します。判定とヒステリシスは対象ごと
          に独立し、`onAlertLevelChange` には最も高いレベルが渡ります。対象を OFF にするとその
          キーごと `thresholds` から外れ、判定対象になりません。
        </p>

        {MEMORY_TARGETS.map((target) => (
          <MemoryTargetFields
            key={target}
            target={target}
            config={memoryConfig.targets[target]}
            disabled={!memoryConfig.thresholdsEnabled}
            observedBytes={resolveSampleBytes(lastSample, target)}
            onChange={(patch) => updateTarget(target, patch)}
          />
        ))}

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
                  再通知されません。`level` は `breaches` のうち最も高いレベルです。
                </p>
              </AlertDescription>
            </Alert>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>超過した対象</TableHead>
                  <TableHead>レベル</TableHead>
                  <TableHead>観測値 / 閾値</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lastAlert.breaches.map((breach) => (
                  <TableRow key={breach.target}>
                    <TableCell className="text-xs">{breach.target}</TableCell>
                    <TableCell className="text-xs">{breach.level}</TableCell>
                    <TableCell className="text-xs whitespace-normal">
                      {formatBytes(breach.observedBytes)} / {formatBytes(breach.thresholdBytes)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>フィールド</TableHead>
                  <TableHead>値</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <SampleRow label="level" value={lastAlert.level} />
                <SampleRow
                  label="observedBytes.estimateBytes"
                  value={formatBytes(lastAlert.observedBytes.estimateBytes)}
                />
                <SampleRow
                  label="observedBytes.jsHeapBytes"
                  value={formatBytes(lastAlert.observedBytes.jsHeapBytes)}
                />
                <SampleRow
                  label="observedBytes.pageBytes"
                  value={formatBytes(lastAlert.observedBytes.pageBytes)}
                />
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
            3 値は閾値の設定に関わらず毎サンプル取得されます。`estimatedViewerBytes` は PNG
            キャッシュ保持量ベースのため、LOD タイルの表示/非表示だけでは減りません。`pageBytes`
            は計測完了を待つ都合で、最新サンプル時刻より古い値の場合があります
            （`pageBytesMeasuredAt` で確認できます）。
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
              <SampleRow label="jsHeapBytes" value={formatBytes(lastSample.jsHeapBytes)} />
              <SampleRow label="pageBytes" value={formatBytes(lastSample.pageBytes)} />
              <SampleRow
                label="pageBytesMeasuredAt"
                value={formatTime(lastSample.pageBytesMeasuredAt)}
              />
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

/** 対象ごとの現在値。設定欄の隣に出して、閾値をどこに置くべきか判断できるようにする。 */
function resolveSampleBytes(
  sample: ViewerMemorySample | undefined,
  target: ViewerMemoryThresholdTarget
): number | undefined {
  if (sample === undefined) {
    return undefined;
  }
  switch (target) {
    case "estimate":
      return sample.estimatedViewerBytes;
    case "jsHeap":
      return sample.jsHeapBytes;
    case "page":
      return sample.pageBytes;
  }
}

function MemoryTargetFields({
  target,
  config,
  disabled,
  observedBytes,
  onChange,
}: {
  target: ViewerMemoryThresholdTarget;
  config: MemoryTargetConfig;
  disabled: boolean;
  observedBytes: number | undefined;
  onChange: (patch: Partial<MemoryTargetConfig>) => void;
}) {
  const fieldsDisabled = disabled || !config.enabled;

  return (
    <div className="flex flex-col gap-2 rounded-md border p-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col">
          <Label className="text-xs">{MEMORY_TARGET_LABELS[target]}</Label>
          <span className="text-muted-foreground text-xs">
            現在値: {formatBytes(observedBytes)}
          </span>
        </div>
        <Switch
          checked={config.enabled}
          disabled={disabled}
          onCheckedChange={(checked) => onChange({ enabled: checked })}
          aria-label={`${MEMORY_TARGET_LABELS[target]} の閾値を設定`}
        />
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <div className="flex flex-col gap-1">
          <Label className="text-xs" htmlFor={`memory-warning-${target}`}>
            警告 MiB
          </Label>
          <Input
            id={`memory-warning-${target}`}
            type="number"
            min={0}
            className="h-8 text-xs"
            disabled={fieldsDisabled}
            value={config.warningMiB}
            onChange={(event) => onChange({ warningMiB: toFiniteNumber(event.target.value) })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs" htmlFor={`memory-critical-${target}`}>
            危険 MiB
          </Label>
          <Input
            id={`memory-critical-${target}`}
            type="number"
            min={0}
            className="h-8 text-xs"
            disabled={fieldsDisabled}
            value={config.criticalMiB}
            onChange={(event) => onChange({ criticalMiB: toFiniteNumber(event.target.value) })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs" htmlFor={`memory-hysteresis-${target}`}>
            戻り幅 MiB
          </Label>
          <Input
            id={`memory-hysteresis-${target}`}
            type="number"
            min={0}
            className="h-8 text-xs"
            disabled={fieldsDisabled}
            value={config.hysteresisMiB}
            onChange={(event) => onChange({ hysteresisMiB: toFiniteNumber(event.target.value) })}
          />
        </div>
      </div>

      <p className="text-muted-foreground text-xs">{TARGET_NOTES[target]}</p>
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
