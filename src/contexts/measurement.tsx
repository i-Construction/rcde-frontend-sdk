import {
  Context,
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

const MeasurementContextInternal = createContext<MeasurementContextProps | null>(null);

/**
 * 後方互換のため非 null 型として export する。
 * Provider 外で直接 useContext する場合は useMeasurement() フックの利用を推奨。
 */
export const MeasurementContext =
  MeasurementContextInternal as unknown as Context<MeasurementContextProps>;

export const MeasurementProvider: FC<{ children?: ReactNode }> = ({ children }) => {
  const [points, setPoints] = useState<Vector3[]>([]);
  const [isActive, setIsActive] = useState(false);

  const value = useMemo(
    () => ({ points, setPoints, isActive, setIsActive }),
    [points, isActive]
  );

  return (
    <MeasurementContextInternal.Provider value={value}>
      {children}
    </MeasurementContextInternal.Provider>
  );
};

export const useMeasurement = (): MeasurementContextProps => {
  const context = useContext(MeasurementContextInternal);
  if (!context) {
    throw new Error("useMeasurement must be used within a MeasurementProvider");
  }
  return context;
};

/**
 * Provider 外でも安全に呼べる内部ユーティリティ。
 * Provider が存在しなければ `null` を返す。
 */
export const useMeasurementOptional = (): MeasurementContextProps | null => {
  return useContext(MeasurementContextInternal);
};
