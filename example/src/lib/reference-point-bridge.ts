export type ReferencePointCoordinates = {
  x: number;
  y: number;
  z: number;
};

type ApplyListener = (coordinates: ReferencePointCoordinates) => void;
type CurrentPointProvider = () => ReferencePointCoordinates;

let applyListener: ApplyListener | null = null;
let currentPointProvider: CurrentPointProvider | null = null;

/**
 * Canvas 外（Dialog）と RCDE 内（useReferencePoint）をつなぐ example 専用ブリッジ。
 * DB 保存は行わず、change() のみ呼び出す。
 */
export const referencePointBridge = {
  apply(coordinates: ReferencePointCoordinates): void {
    if (applyListener) {
      applyListener(coordinates);
    }
  },

  getCurrentPoint(): ReferencePointCoordinates {
    if (currentPointProvider) {
      return currentPointProvider();
    }
    return { x: 0, y: 0, z: 0 };
  },

  registerApplyHandler(handler: ApplyListener): () => void {
    applyListener = handler;
    return () => {
      if (applyListener === handler) {
        applyListener = null;
      }
    };
  },

  registerCurrentPointProvider(provider: CurrentPointProvider): () => void {
    currentPointProvider = provider;
    return () => {
      if (currentPointProvider === provider) {
        currentPointProvider = null;
      }
    };
  },
};
