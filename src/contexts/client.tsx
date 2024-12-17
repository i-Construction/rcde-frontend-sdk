import { RCDEClient } from "@rcde/api-sdk";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  FC,
  useCallback,
} from "react";
import { GlobalStateContext } from "./state";

type ClientContextType = {
  client?: RCDEClient;
  initialize: (props: ConstructorParameters<typeof RCDEClient>[0]) => void;
};

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const ClientProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [client, setClient] = useState<RCDEClient | undefined>();

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
    <ClientContext.Provider value={{ client, initialize }}>
      <GlobalStateContext.Provider>
        {children}
      </GlobalStateContext.Provider>
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
