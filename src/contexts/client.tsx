import { RCDEClient } from "../lib/rcde-client";
import { RCDEAppConfig } from "../components/Viewer";
import {
  createContext,
  Dispatch,
  FC,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
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

  const initialize = useCallback(
    (app: RCDEAppConfig) => {
      const client = new RCDEClient({
        accessToken: app.token,
        baseUrl: app.baseUrl,
        authType: app.authType,
      });
      setClient(client);
    },
    []
  );

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
