import { createContext, FC, ReactNode, useCallback, useContext, useState } from "react";
import { Vector3 } from "three";

type ReferencePointContextType = {
  point: Vector3;
  onChange: (point: Vector3) => void;
  onSave: (point: Vector3) => void;
};

const ReferencePointContext = createContext<ReferencePointContextType | undefined>(undefined);

export const ReferencePointProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [point, setPoint] = useState(new Vector3());

  const onChange = useCallback((point: Vector3) => {
    setPoint(point);
  }, [setPoint]);

  const onSave = useCallback((point: Vector3) => {
    setPoint(point);
  }, [setPoint]);

  return (
    <ReferencePointContext.Provider value={{ point, onChange, onSave }}>
      {children}
    </ReferencePointContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useReferencePoint = (): ReferencePointContextType => {
  const context = useContext(ReferencePointContext);
  if (!context) {
    throw new Error("useReferencePoint must be used within a ReferencePointProvider");
  }
  return context;
};
