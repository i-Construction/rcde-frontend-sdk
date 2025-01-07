import { Box } from "@mui/material";
import {
  GizmoHelper,
  GizmoViewport,
  Grid,
  MapControls,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { FC, useCallback, useEffect, useMemo } from "react";
import { Color, DoubleSide, Quaternion, Vector3 } from "three";
import { useClient } from "../contexts/client";
import { useContractFiles } from "../contexts/contractFiles";
import { ContractFileView } from "./ContractFileView";
import { LeftSider } from "./LeftSider";
import { RightSider } from "./RightSider";

export type ViewerProps = {
  constructionId: number;
  contractId: number;
};

const Viewer: FC<ViewerProps> = (props) => {
  const { load, containers } = useContractFiles();
  const { constructionId, contractId } = props;
  const { client, setProject } = useClient();

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

  return (
    <Box width={1} height={1} display="flex">
      <LeftSider constructionId={constructionId} contractId={contractId} />
      <Box width={1} height={1} flex={1} position="relative" overflow="hidden">
        <Canvas camera={camera}
        >
          <MapControls makeDefault screenSpacePanning />
          <ambientLight intensity={0.5} />
          {
            containers?.filter((file) => file.visible).map(({ file }) => {
              return <ContractFileView key={file.id} file={file} />;
            })
          }
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
      </Box>
      <RightSider />
    </Box>
  );
};

export { Viewer };
