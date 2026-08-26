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
import { Plane } from "three";

export type ClippingPlanesContextProps = {
  clippingPlanes: Plane[];
  setClippingPlanes: Dispatch<SetStateAction<Plane[]>>;
};

const ClippingPlanesContextInternal = createContext<ClippingPlanesContextProps | null>(null);

/**
 * 後方互換のため非 null 型として export する。
 * Provider 外で直接 useContext する場合は useClippingPlanes() フックの利用を推奨。
 */
export const ClippingPlanesContext =
  ClippingPlanesContextInternal as unknown as Context<ClippingPlanesContextProps>;

export const ClippingPlanesProvider: FC<{
  children?: ReactNode;
}> = ({ children }) => {
  const [clippingPlanes, setClippingPlanes] = useState<Plane[]>([]);

  const value = useMemo(() => ({ clippingPlanes, setClippingPlanes }), [clippingPlanes]);

  return (
    <ClippingPlanesContextInternal.Provider value={value}>
      {children}
    </ClippingPlanesContextInternal.Provider>
  );
};

export const useClippingPlanes = (): ClippingPlanesContextProps => {
  const context = useContext(ClippingPlanesContextInternal);
  if (!context) {
    throw new Error("useClippingPlanes must be used within a ClippingPlanesProvider");
  }
  return context;
};
