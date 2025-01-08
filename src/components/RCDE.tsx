import { FC } from "react";
import { GlobalStateContext } from "../contexts/state";
import { ContractFilesProvider } from "../contexts/contractFiles";
import { ReferencePointProvider } from "../contexts/referencePoint";
import { ClientProvider } from "../contexts/client";
import { Viewer, ViewerProps } from "./Viewer";

const RCDE: FC<ViewerProps> = (props) => {
  return (
    <GlobalStateContext.Provider>
      <ClientProvider>
        <ContractFilesProvider>
          <ReferencePointProvider>
            <Viewer {...props} />
          </ReferencePointProvider>
        </ContractFilesProvider>
      </ClientProvider>
    </GlobalStateContext.Provider>
  );
};

export type RCDEProps = Parameters<typeof RCDE>[0];

export { RCDE };
