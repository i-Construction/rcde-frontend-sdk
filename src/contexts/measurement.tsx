import {
  Dispatch,
  FC,
  ReactNode,
  SetStateAction,
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";
import { Vector3 } from "three";

export type MeasurementContextProps = {
  points: Vector3[];
  setPoints: Dispatch<SetStateAction<Vector3[]>>;
  isActive: boolean;
  setIsActive: Dispatch<SetStateAction<boolean>>;
};

export const MeasurementContext = createContext<MeasurementContextProps>({
  points: [],
  setPoints: () => {},
  isActive: true,
  setIsActive: () => {},
});

const MeasurementProviderPresent = createContext(false);

export const MeasurementProvider: FC<{ children?: ReactNode }> = ({ children }) => {
  const [points, setPoints] = useState<Vector3[]>([]);
  const [isActive, setIsActive] = useState(true);

  const value = useMemo(() => ({ points, setPoints, isActive, setIsActive }), [points, isActive]);

  return (
    <MeasurementProviderPresent.Provider value={true}>
      <MeasurementContext.Provider value={value}>{children}</MeasurementContext.Provider>
    </MeasurementProviderPresent.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useMeasurement = (): MeasurementContextProps => {
  return useContext(MeasurementContext);
};

/**
 * Provider 外でも安全に呼べる内部ユーティリティ。
 * Provider が存在しなければ `null` を返す。
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useMeasurementOptional = (): MeasurementContextProps | null => {
  const isPresent = useContext(MeasurementProviderPresent);
  const ctx = useContext(MeasurementContext);
  return isPresent ? ctx : null;
};
