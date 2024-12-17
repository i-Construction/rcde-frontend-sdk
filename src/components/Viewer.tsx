import { Box } from "@mui/material";
import {
  GizmoHelper,
  GizmoViewport,
  Grid,
  MapControls,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { FC, useMemo } from "react";
import { Color, DoubleSide, Quaternion, Vector3 } from "three";
import { useClient } from "../contexts/client";
import { LeftSider } from "./LeftSider";

export type ViewerProps = {
  constructionId: number;
  contractId: number;
};

const Viewer: FC<ViewerProps> = (props) => {
  const { client } = useClient();

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
    <Box width={1} height={1} flexGrow={1} display="flex">
      <LeftSider />
      <Box width={1} height={1}>
        <Canvas camera={camera}>
          <MapControls makeDefault screenSpacePanning />
          <ambientLight intensity={0.5} />
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
    </Box>
  );
};

export { Viewer };
