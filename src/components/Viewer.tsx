import { Box } from "@mui/material";
import {
  GizmoHelper,
  GizmoViewport,
  Grid,
  MapControls,
} from "@react-three/drei";
import { Canvas, CanvasProps } from "@react-three/fiber";
import { PointCloudMeta } from "pcd-viewer";
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box3, Color, DoubleSide, Quaternion, Vector3, Group, PerspectiveCamera, Object3D } from "three";
import { useClient } from "../contexts/client";
import { ContractFile, useContractFiles } from "../contexts/contractFiles";
import { useReferencePoint } from "../contexts/referencePoint";
import { ContractFileProps, ContractFileView } from "./ContractFileView";
import { LeftSider } from "./LeftSider";
import { ReferencePointView } from "./ReferencePointView";
import { RightSider } from "./right/RightSider";

import axios, { AxiosError, AxiosResponse } from "axios";

// === UI → Viewer メッセージ ===
type UpAxis = 'Y' | 'Z';
type ViewerTransform = {
  translation: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number }; // degree
};
type ViewerAppearance = {
  pointSize: number; // 0..5
  opacity: number;   // 0..100
  upAxis?: UpAxis;   // カメラUpのみ
};
type Command =
  | { type: 'SET_TRANSFORM'; payload: ViewerTransform }
  | { type: 'SET_APPEARANCE'; payload: ViewerAppearance }
  | { type: 'RESET' };
const CHANNEL = 'RCDE_VIEWER_CMD';

type R3FProps = {
  canvas?: CanvasProps;
  map?: boolean;
  light?: boolean;
  grid?: boolean;
  gizmo?: boolean;
};

export type RCDEAppConfig = {
  token: string;
  baseUrl?: string;
  authType?: '2legged' | '3legged';
};

export type ViewerProps = {
  app: RCDEAppConfig;
  constructionId: number;
  contractId: number;
  contractFileIds?: number[];
  r3f?: R3FProps;
  children?: React.ReactNode;
  positionOffsetComponent?: React.ReactNode;
  showLeftSider?: boolean;
  showRightSider?: boolean;
  selectedFileId?: number;
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

let _axiosSafePatched = false;
function ensureAxiosSafeOnce() {
  if (_axiosSafePatched) return;
  _axiosSafePatched = true;
  axios.defaults.validateStatus = () => true;
  axios.interceptors.response.use(
    (resp: AxiosResponse) => resp,
    (error: AxiosError) => {
      const resp = error.response;
      if (resp) {
        return Promise.resolve(resp);
      }
      return Promise.resolve({
        status: 0,
        statusText: "AxiosNetworkError",
        data: {
          error: "network_error",
          message: error.message ?? "Network error",
        },
        headers: {},
        config: error.config ?? {},
      } as AxiosResponse);
    }
  );
}

const Viewer: FC<ViewerProps> = (props) => {
  const { load, containers } = useContractFiles();
  const { app, constructionId, contractId, contractFileIds, r3f, children, positionOffsetComponent, showLeftSider = true, showRightSider = true, selectedFileId } = props;
  const { initialize, client, project, setProject } = useClient();
  const { point, change: changeReferencePoint } = useReferencePoint();
  const [views, setViews] = useState<(ContractFileProps & { boundingBox: Box3 })[]>([]);

  const transformRootRef = useRef<Group>(null);
  const cameraRef = useRef<PerspectiveCamera>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);

  const [appearance, setAppearance] = useState<{ pointSize: number; opacity: number }>({
    pointSize: 2,
    opacity: 100,
  });

  // Memoize contractFileIds to prevent unnecessary re-renders
  // Use JSON.stringify to compare array contents rather than reference
  const contractFileIdsKey = contractFileIds ? JSON.stringify(contractFileIds) : undefined;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedContractFileIds = useMemo(() => contractFileIds, [contractFileIdsKey]);

  useEffect(() => {
    ensureAxiosSafeOnce();
    initialize(app);
  }, [app, initialize]);

  useEffect(() => { setProject({ constructionId, contractId }); }, [constructionId, contractId, setProject]);
  
  const fetchContractFiles = useCallback(async () => {
    if (!client || !contractId) return;
    
    try {
      const res = await client.getContractFileList({ contractId });
      const contractFiles = res?.contractFiles ?? [];
      load(contractFiles, memoizedContractFileIds);
    } catch (err) {
      console.warn("[Viewer] getContractFileList threw:", err);
      load([], memoizedContractFileIds);
    }
  }, [client, contractId, memoizedContractFileIds, load]);

  useEffect(() => { 
    if (client && contractId) {
      fetchContractFiles(); 
    }
  }, [client, contractId, fetchContractFiles]);

  const camera = useMemo(() => ({
    fov: 40,
    position: new Vector3(1, 2, 1).multiplyScalar(1e2),
    up: new Vector3(0, 0, 1),
    near: 1e-1,
    far: 1e3 * 5,
  }), []);

  useEffect(() => {
    if (project === undefined) return;
    const promises = containers
      .filter((c) => c.visible)
      .map((c) => {
        const id = c.file.id;
        if (id === undefined) return Promise.resolve(undefined);
        return client
          ?.getContractFileMetadata({ ...project, contractFileId: id })
          .then((d) => {
            const meta = d as unknown as PointCloudMeta;
            const { min, max } = meta.bounds;
            const boundingBox = new Box3(new Vector3().fromArray(min), new Vector3().fromArray(max));
            return { file: c.file, meta, boundingBox };
          })
          .catch((e) => {
            console.error(e);
            return undefined;
          });
      });

    Promise.all(promises).then((vs) => {
      setViews(vs.filter((v): v is ContractFileProps & { boundingBox: Box3 } => v !== undefined));
    });
  }, [containers, project, client]);

  const handleFileFocus = useCallback((file: ContractFile) => {
    const view = views.find((v) => v.file.id === file.id);
    if (!view) return;
    const center = view.boundingBox.getCenter(new Vector3());
    changeReferencePoint(center.negate());
  }, [views, changeReferencePoint]);

  const handleFileDelete = useCallback((file: ContractFile) => { console.log(file); }, []);
  const handleUploaded = useCallback(() => { fetchContractFiles(); }, [fetchContractFiles]);

  const applyAppearanceToScene = useCallback((root: Group | null, ps: number, opPercent: number) => {
    if (!root) return;
    const pointSize = clamp(ps, 0, 5);
    const opacity01 = clamp(opPercent, 0, 100) / 100;

    root.traverse((obj: Object3D) => {
      const mat = (obj as { material?: { size?: number; uniforms?: Record<string, { value?: number }>; opacity?: number; transparent?: boolean; needsUpdate?: boolean } }).material;
      if (!mat) return;

      if (typeof mat.size === "number") {
        mat.size = pointSize;
        mat.needsUpdate = true;
      }
      if (mat.uniforms) {
        if (mat.uniforms.pointSize?.value !== undefined) mat.uniforms.pointSize.value = pointSize;
        if (mat.uniforms.opacity?.value !== undefined) mat.uniforms.opacity.value = opacity01;
      }
      if (typeof mat.opacity === "number") {
        mat.opacity = opacity01;
        if (opacity01 < 1 && mat.transparent !== true) mat.transparent = true;
        mat.needsUpdate = true;
      }
    });
  }, []);

  useEffect(() => {
    applyAppearanceToScene(transformRootRef.current, appearance.pointSize, appearance.opacity);
  }, [appearance, applyAppearanceToScene]);

  useEffect(() => {
    const listener = (e: MessageEvent) => {
      if (!e?.data || e.data.channel !== CHANNEL) return;
      const cmd = e.data.cmd as Command;

      if (cmd.type === 'SET_TRANSFORM') {
        const g = transformRootRef.current;
        if (!g) return;
        const { translation, rotation } = cmd.payload;
        g.position.set(translation.x, translation.y, translation.z);
        const toRad = Math.PI / 180;
        g.rotation.set(rotation.x * toRad, rotation.y * toRad, rotation.z * toRad, 'XYZ');
      } else if (cmd.type === 'SET_APPEARANCE') {
        const up = cmd.payload.upAxis;
        const nextPointSize = clamp(cmd.payload.pointSize ?? appearance.pointSize, 0, 5);
        const nextOpacity   = clamp(cmd.payload.opacity   ?? appearance.opacity,   0, 100);
        setAppearance({ pointSize: nextPointSize, opacity: nextOpacity });

        if (up) {
          const cam = cameraRef.current;
          if (cam) {
            if (up === 'Y') cam.up.set(0, 1, 0);
            else cam.up.set(0, 0, 1);
            cam.updateProjectionMatrix?.();
          }
          controlsRef.current?.update?.();
        }
      } else if (cmd.type === 'RESET') {
        const g = transformRootRef.current;
        if (g) {
          g.position.set(0, 0, 0);
          g.rotation.set(0, 0, 0, 'XYZ');
        }
        setAppearance({ pointSize: 2, opacity: 100 });

        const cam = cameraRef.current;
        if (cam) {
          cam.up.set(0, 0, 1);
          cam.updateProjectionMatrix?.();
        }
        controlsRef.current?.update?.();
      }
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [appearance.pointSize, appearance.opacity]);

  return (
    <Box width={1} height={1} display="flex">
      {showLeftSider && <LeftSider contractId={contractId} onUploaded={handleUploaded} />}
      <Box width={1} height={1} flex={1} position="relative" overflow="hidden">
        <Canvas camera={camera} {...r3f?.canvas}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <perspectiveCamera ref={cameraRef as any} />
          {r3f?.map !== false && <MapControls ref={controlsRef} makeDefault screenSpacePanning />}
          {r3f?.light !== false && <ambientLight intensity={0.5} />}
          {r3f?.grid !== false && (
            <Grid
              args={[10, 10]}
              quaternion={new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2)}
              infiniteGrid
              followCamera
              fadeDistance={1e3}
              cellSize={1e1}
              sectionSize={1e1 * 5}
              sectionColor={new Color("#6f6f6f")}
              side={DoubleSide}
            />
          )}
          {r3f?.gizmo !== false && (
            <GizmoHelper alignment="top-right" margin={[80, 80]}>
              <GizmoViewport axisColors={["#9d4b4b", "#2f7f4f", "#3b5b9d"]} labelColor="white" />
            </GizmoHelper>
          )}

          <group ref={transformRootRef}>
            {views.map((view) => (
              <ContractFileView
                key={view.file.id}
                file={view.file}
                meta={view.meta}
                referencePoint={point}
                selected={view.file.id === selectedFileId}
              />
            ))}
            <group position={point}>{positionOffsetComponent}</group>
            <group>{children}</group>
          </group>
        </Canvas>

        <Box
          component="div"
          sx={{
            position: "absolute",
            bottom: 10,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <ReferencePointView point={point} />
        </Box>
      </Box>
      {showRightSider && <RightSider onFileFocus={handleFileFocus} onFileDelete={handleFileDelete} />}
    </Box>
  );
};

export { Viewer };
