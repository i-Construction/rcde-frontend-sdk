import { Box } from "@mui/material";
import {
  GizmoHelper,
  GizmoViewport,
  Grid,
  MapControls,
} from "@react-three/drei";
import { Canvas, CanvasProps } from "@react-three/fiber";
import { PointCloudMeta } from "pcd-viewer";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { Box3, Color, DoubleSide, Quaternion, Vector3 } from "three";
import { ClientContextType, useClient } from "../contexts/client";
import { ContractFile, useContractFiles } from "../contexts/contractFiles";
import { useReferencePoint } from "../contexts/referencePoint";
import { ContractFileProps, ContractFileView } from "./ContractFileView";
import { LeftSider } from "./LeftSider";
import { ReferencePointView } from "./ReferencePointView";
import { RightSider } from "./right/RightSider";

type R3FProps = {
  canvas?: CanvasProps;
  map?: boolean;
  light?: boolean;
  grid?: boolean;
  gizmo?: boolean;
};

export type ViewerProps = {
  app: Parameters<ClientContextType["initialize"]>[0];
  constructionId: number;
  contractId: number;
  r3f?: R3FProps;
  children?: React.ReactNode;
};

const Viewer: FC<ViewerProps> = (props) => {
  const { load, containers } = useContractFiles();
  const { app, constructionId, contractId, r3f, children } = props;
  const { initialize, client, project, setProject } = useClient();
  const { point, onChange } = useReferencePoint();
  const [views, setViews] = useState<
    (ContractFileProps & { boundingBox: Box3 })[]
  >([]);

  useEffect(() => {
    initialize(app);
  }, [app, initialize]);

  useEffect(() => {
    setProject({
      constructionId,
      contractId,
    });
  }, [constructionId, contractId, setProject]);

  const fetchContractFiles = useCallback(() => {
    client
      ?.getContractFileList({
        contractId,
      })
      .then(({ contractFiles }) => {
        load(contractFiles ?? []);
      });
  }, [client, contractId, load]);

  useEffect(() => {
    fetchContractFiles();
  }, [fetchContractFiles]);

  const camera = useMemo(() => {
    return {
      fov: 40,
      position: new Vector3(1, 2, 1).multiplyScalar(1e2),
      up: new Vector3(0, 0, 1),
      near: 1e-1,
      far: 1e3 * 5,
    };
  }, []);

  useEffect(() => {
    if (project === undefined) return;
    const promises = containers
      .filter((c) => c.visible)
      .map((c) => {
        const id = c.file.id;
        if (id === undefined) return Promise.resolve(undefined);
        return client
          ?.getContractFileMetadata({
            ...project,
            contractFileId: id,
          })
          .then((d) => {
            const meta = d as unknown as PointCloudMeta;

            const { min, max } = meta.bounds;
            const boundingBox = new Box3(
              new Vector3().fromArray(min),
              new Vector3().fromArray(max)
            );

            return {
              file: c.file,
              meta,
              boundingBox,
            };
          });
      });
    Promise.all(promises).then((vs) => {
      setViews(vs.filter((v) => v !== undefined));
    });
  }, [containers, project, client]);

  const handleFileFocus = useCallback(
    (file: ContractFile) => {
      const view = views.find((v) => v.file.id === file.id);
      if (view === undefined) return;
      const { boundingBox } = view;
      const center = boundingBox.getCenter(new Vector3());
      onChange(center.negate());
    },
    [views, onChange]
  );

  const handleFileDelete = useCallback((file: ContractFile) => {
    console.log(file);
  }, []);

  return (
    <Box width={1} height={1} display="flex">
      <LeftSider contractId={contractId} />
      <Box width={1} height={1} flex={1} position="relative" overflow="hidden">
        <Canvas camera={camera} {...r3f?.canvas}>
          {r3f?.map !== false && <MapControls makeDefault screenSpacePanning />}
          {r3f?.light !== false && <ambientLight intensity={0.5} />}
          {r3f?.grid !== false && (
            <Grid
              args={[10, 10]}
              quaternion={new Quaternion().setFromAxisAngle(
                new Vector3(1, 0, 0),
                Math.PI / 2
              )}
              infiniteGrid={true}
              followCamera={true}
              fadeDistance={1e3}
              cellSize={1e1}
              sectionSize={1e1 * 5}
              sectionColor={new Color("#6f6f6f")}
              side={DoubleSide}
            />
          )}
          {r3f?.gizmo !== false && (
            <GizmoHelper alignment="top-right" margin={[80, 80]}>
              <GizmoViewport
                axisColors={["#9d4b4b", "#2f7f4f", "#3b5b9d"]}
                labelColor="white"
              />
            </GizmoHelper>
          )}
          {views.map((view) => {
            return (
              <ContractFileView
                key={view.file.id}
                file={view.file}
                meta={view.meta}
                referencePoint={point}
              />
            );
          })}
          {children}
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
          {/*
            <Tooltip title="表示状態のデータの可視範囲に移動">
              <IconButton
                sx={{
                  marginRight: 1,
                }}
                onClick={handleFocusCenter}
              >
                <ZoomInMap />
              </IconButton>
            </Tooltip>
              */}
          <ReferencePointView point={point} />
        </Box>
      </Box>
      <RightSider
        onFileFocus={handleFileFocus}
        onFileDelete={handleFileDelete}
      />
    </Box>
  );
};

export { Viewer };
