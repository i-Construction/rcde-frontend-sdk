import { Dispatch, FC, ReactNode, SetStateAction, createContext, useContext, useState } from 'react';
import { Plane } from 'three';

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

  return (
    <ClippingPlanesContext.Provider
      value={{
        clippingPlanes,
        setClippingPlanes,
      }}
    >
      {children}
    </ClippingPlanesContext.Provider>
  );
};

export const useClippingPlanes = (): ClippingPlanesContextProps => {
  const context = useContext(ClippingPlanesContext);
  if (!context) {
    throw new Error('useClippingPlanes must be used within a ClippingPlanesProvider');
  }
  return context;
};

