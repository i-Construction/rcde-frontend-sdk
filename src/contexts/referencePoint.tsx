import { createContext, FC, ReactNode, useCallback, useContext, useState } from "react";
import { Vector3 } from "three";

/**
 * Context provider props for reference point.
 * `Reference point` is the positional offset to the center of the selected point cloud.
 */
type ReferencePointContextType = {
  point: Vector3;
  change: (point: Vector3) => void;
  save: (point: Vector3) => void;
};

const ReferencePointContext = createContext<ReferencePointContextType | undefined>(undefined);

export const ReferencePointProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [point, setPoint] = useState(new Vector3());

  const change = useCallback((point: Vector3) => {
    setPoint(point);
  }, [setPoint]);

  const save = useCallback((point: Vector3) => {
    setPoint(point);
  }, [setPoint]);

  return (
    <ReferencePointContext.Provider value={{ point, change, save }}>
      {children}
    </ReferencePointContext.Provider>
  );
};

/**
 * Hooks to use reference point
 * 
 * @example
 * ```tsx
 * const { point, change, save } = useReferencePoint();
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
