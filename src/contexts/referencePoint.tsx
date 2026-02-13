import { createContext, FC, ReactNode, useCallback, useContext, useState } from "react";
import { Box3, Vector3 } from "three";
import { PointCloudMeta } from "pcd-viewer";
import { useClient } from "./client";
import { useContractFiles } from "./contractFiles";

/**
 * Context provider props for reference point.
 * `Reference point` is the positional offset to the center of the selected point cloud.
 */
export type ReferencePointContextType = {
  point: Vector3;
  change: (point: Vector3) => void;
  save: (point: Vector3) => void;
  focusFileById: (fileId: number) => Promise<void>;
};

const ReferencePointContext = createContext<ReferencePointContextType | undefined>(undefined);

export const ReferencePointProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [point, setPoint] = useState<Vector3>(new Vector3(0, 0, 0));
  const { client, project } = useClient();
  const { containers } = useContractFiles();

  const change = useCallback((point: Vector3) => {
    setPoint(point);
  }, [setPoint]);

  const save = useCallback((point: Vector3) => {
    setPoint(point);
  }, [setPoint]);

  const focusFileById = useCallback(async (fileId: number) => {
    if (!client || !project) return;

    // Find the container with the matching file ID
    const container = containers.find((c) => c.file.id === fileId);
    if (!container) return;

    try {
      // Get file metadata to calculate bounding box
      const metaData = await client.getContractFileMetadata({
        ...project,
        contractFileId: fileId,
      });
      const meta = metaData as unknown as PointCloudMeta;
      const { min, max } = meta.bounds;
      const boundingBox = new Box3(
        new Vector3().fromArray(min),
        new Vector3().fromArray(max)
      );
      const center = boundingBox.getCenter(new Vector3());
      change(center.negate());
    } catch (err) {
      console.error("[useReferencePoint] Failed to focus file:", err);
    }
  }, [client, project, containers, change]);

  return (
    <ReferencePointContext.Provider value={{ point, change, save, focusFileById }}>
      {children}
    </ReferencePointContext.Provider>
  );
};

/**
 * Hooks to use reference point
 *
 * @example
 * ```tsx
 * const { point, change, save, focusFileById } = useReferencePoint();
 * ```
 *
 * @returns Reference point context
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useReferencePoint = (): ReferencePointContextType => {
  const context = useContext(ReferencePointContext);
  if (!context) {
    throw new Error("useReferencePoint must be used within a ReferencePointProvider");
  }
  return context;
};
