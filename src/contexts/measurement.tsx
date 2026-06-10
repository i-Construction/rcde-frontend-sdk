import { Dispatch, FC, ReactNode, SetStateAction, createContext, useContext, useState } from 'react';
import { Vector3 } from 'three';

export type MeasurementContextProps = {
  points: Vector3[];
  setPoints: Dispatch<SetStateAction<Vector3[]>>;
  isActive: boolean;
  setIsActive: Dispatch<SetStateAction<boolean>>;
};

export const MeasurementContext = createContext<MeasurementContextProps>({
  points: [],
  setPoints: () => {},
  isActive: false,
  setIsActive: () => {},
});

export const MeasurementProvider: FC<{ children?: ReactNode }> = ({ children }) => {
  const [points, setPoints] = useState<Vector3[]>([]);
  const [isActive, setIsActive] = useState(false);

  return (
    <MeasurementContext.Provider
      value={{
        points,
        setPoints,
        isActive,
        setIsActive,
      }}
    >
      {children}
    </MeasurementContext.Provider>
  );
};

export const useMeasurement = (): MeasurementContextProps => {
  const context = useContext(MeasurementContext);
  if (!context) {
    throw new Error('useMeasurement must be used within a MeasurementProvider');
  }
  return context;
};
