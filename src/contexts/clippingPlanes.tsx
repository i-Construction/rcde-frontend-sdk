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
import { Plane } from "three";

export type ClippingPlanesContextProps = {
  clippingPlanes: Plane[];
  setClippingPlanes: Dispatch<SetStateAction<Plane[]>>;
};

export const ClippingPlanesContext = createContext<ClippingPlanesContextProps>({
  clippingPlanes: [],
  setClippingPlanes: () => {},
});

export const ClippingPlanesProvider: FC<{
  children?: ReactNode;
}> = ({ children }) => {
  const [clippingPlanes, setClippingPlanes] = useState<Plane[]>([]);

  const value = useMemo(() => ({ clippingPlanes, setClippingPlanes }), [clippingPlanes]);

  return <ClippingPlanesContext.Provider value={value}>{children}</ClippingPlanesContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useClippingPlanes = (): ClippingPlanesContextProps => {
  return useContext(ClippingPlanesContext);
};
