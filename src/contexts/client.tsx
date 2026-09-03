import { RCDEClient } from "../lib/rcde-client";
import type { RCDEAppConfig } from "../types/viewerConfig";
import {
  createContext,
  Dispatch,
  FC,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

export type ClientContextType = {
  client?: RCDEClient;
  initialize: (app: RCDEAppConfig) => void;
  project?: {
    constructionId: number;
    contractId: number;
  };
  setProject: Dispatch<SetStateAction<ClientContextType["project"]>>;
};

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const ClientProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [client, setClient] = useState<RCDEClient | undefined>();
  const [project, setProject] = useState<ClientContextType["project"]>();
  // 呼び出し元（Viewer）が app オブジェクトを毎レンダーで新規生成しても、
  // 実質的な設定値が変わっていなければ client を再生成しない。
  // client 参照の変化はファイル一覧再取得・表示状態リセットの引き金になるため。
  const lastConfigRef = useRef<string | undefined>(undefined);

  const initialize = useCallback((app: RCDEAppConfig) => {
    const configKey = JSON.stringify({
      token: app.token,
      baseUrl: app.baseUrl,
      authType: app.authType,
    });
    if (configKey === lastConfigRef.current) {
      return;
    }
    lastConfigRef.current = configKey;

    const client = new RCDEClient({
      accessToken: app.token,
      baseUrl: app.baseUrl,
      authType: app.authType,
    });
    setClient(client);
  }, []);

  return (
    <ClientContext.Provider value={{ client, initialize, project, setProject }}>
      {children}
    </ClientContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useClient = (): ClientContextType => {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error("useClient must be used within a ClientProvider");
  }
  return context;
};
