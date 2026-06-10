import { useEffect, useRef } from "react";
// SDK からインポート（ローカルリンク/ワークスペース時）
import { ViewerBridge } from "@i-con/frontend-sdk";

type ViewerPanelProps = {
  pointCloudUrl?: string;
};

export function ViewerPanel({ pointCloudUrl = "../example-data/sample.las" }: ViewerPanelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 初期化
    ViewerBridge.init(containerRef.current, {
      backgroundColor: "#0b0b0b",
      gridVisible: true,
    });

    // 点群ロード
    ViewerBridge.loadPointCloud({
      url: pointCloudUrl,
      color: "#00ffff",
    });

    // カメラ配置
    ViewerBridge.setCamera({
      position: [10, 10, 10],
      target: [0, 0, 0],
    });

    // ウィンドウリサイズ
    const onResize = () => ViewerBridge.resize();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      ViewerBridge.dispose();
    };
  }, [pointCloudUrl]);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: 8, gap: 8, display: "flex" }}>
        <button onClick={() => ViewerBridge.resetCamera()}>Reset Camera</button>
        <button onClick={() => ViewerBridge.setTransform({ translation: { x: 0, y: 0, z: 0 } })}>Reset Transform</button>
      </div>
      <div ref={containerRef} style={{ flex: 1, background: "#111" }} />
    </div>
  );
}
