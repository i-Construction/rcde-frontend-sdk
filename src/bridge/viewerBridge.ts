export type UpAxis = 'Y' | 'Z';

export type ViewerTransform = {
  translation: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number }; // degree
};

export type ViewerAppearance = {
  pointSize: number;
  opacity: number;
  upAxis: UpAxis;
};

const CHANNEL = 'RCDE_VIEWER_CMD';

type Command =
  | { type: 'SET_TRANSFORM'; payload: ViewerTransform }
  | { type: 'SET_APPEARANCE'; payload: ViewerAppearance }
  | { type: 'RESET' };

function post(cmd: Command) {
  if (typeof window === 'undefined') return;
  window.postMessage({ channel: CHANNEL, cmd }, '*');
}

export const ViewerBridge = {
  setTransform(tx: ViewerTransform) {
    post({ type: 'SET_TRANSFORM', payload: tx });
  },
  setAppearance(app: ViewerAppearance) {
    post({ type: 'SET_APPEARANCE', payload: app });
  },
  reset() {
    post({ type: 'RESET' });
  },
  addListener(handler: (cmd: Command) => void) {
    if (typeof window === 'undefined') return () => {};
    const listener = (e: MessageEvent) => {
      if (!e?.data || e.data.channel !== CHANNEL) return;
      handler(e.data.cmd as Command);
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  },
};

export type { Command };
