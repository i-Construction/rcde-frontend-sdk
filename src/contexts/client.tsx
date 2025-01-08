import { RCDEClient } from "@i-con/api-sdk";
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

type ClientContextType = {
  client?: RCDEClient;
  initialize: (props: ConstructorParameters<typeof RCDEClient>[0]) => void;
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
    (props: Parameters<ClientContextType["initialize"]>[0]) => {
      const client = new RCDEClient(props);
      client
        .authenticate()
        .then(() => setClient(client))
        .catch((e) => {
          throw e;
        });
    },
    []
  );

  return (
    <ClientContext.Provider value={{ client, initialize, project, setProject }}>
      {children}
    </ClientContext.Provider>
  );
};

export const useClient = (): ClientContextType => {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error("useClient must be used within a ClientProvider");
  }
  return context;
};
