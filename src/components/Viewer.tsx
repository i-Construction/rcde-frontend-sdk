import { Box } from "@mui/material";
import {
  GizmoHelper,
  GizmoViewport,
  Grid,
  MapControls,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { PointCloudMeta } from "pcd-viewer";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { Box3, Color, DoubleSide, Quaternion, Vector3 } from "three";
import { useClient } from "../contexts/client";
import { ContractFile, useContractFiles } from "../contexts/contractFiles";
import { ContractFileProps, ContractFileView } from "./ContractFileView";
import { LeftSider } from "./LeftSider";
import { RightSider } from "./RightSider";
import { ReferencePointView } from "./ReferencePointView";

export type ViewerProps = {
  constructionId: number;
  contractId: number;
};

const Viewer: FC<ViewerProps> = (props) => {
  const { load, containers } = useContractFiles();
  const { constructionId, contractId } = props;
  const { client, project, setProject } = useClient();
  const [views, setViews] = useState<
    (ContractFileProps & { boundingBox: Box3 })[]
  >([]);

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
    const promises = containers.map((c) => {
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

  const [referencePoint, setReferencePoint] = useState<Vector3 | undefined>(
    undefined
  );

  const handleFileFocus = useCallback((file: ContractFile) => {
    const view = views.find((v) => v.file.id === file.id);
    if (view === undefined) return;
    const { boundingBox } = view;
    const center = boundingBox.getCenter(new Vector3());
    setReferencePoint(center.negate());
  }, [views]);

  return (
    <Box width={1} height={1} display="flex">
      <LeftSider constructionId={constructionId} contractId={contractId} />
      <Box width={1} height={1} flex={1} position="relative" overflow="hidden">
        <Canvas camera={camera}>
          <MapControls makeDefault screenSpacePanning />
          <ambientLight intensity={0.5} />
          {views.map((view) => {
            return (
              <ContractFileView
                key={view.file.id}
                file={view.file}
                meta={view.meta}
                referencePoint={referencePoint}
              />
            );
          })}
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
          <GizmoHelper alignment="top-right" margin={[80, 80]}>
            <GizmoViewport
              axisColors={["#9d4b4b", "#2f7f4f", "#3b5b9d"]}
              labelColor="white"
            />
          </GizmoHelper>
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
          {
            referencePoint && (
              <ReferencePointView point={referencePoint} />
            )
          }
        </Box>
      </Box>
      <RightSider
        onFileFocus={handleFileFocus}
      />
    </Box>
  );
};

export { Viewer };
