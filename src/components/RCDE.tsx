import { FC } from "react";
import { ClientProvider } from "../contexts/client";
import { ContractFilesProvider } from "../contexts/contractFiles";
import { ReferencePointProvider } from "../contexts/referencePoint";
import { GlobalStateContext } from "../contexts/state";
import { Viewer, ViewerProps } from "./Viewer";

/**
 * Root component for RCDE
 * 
 * @example
 * ```tsx
 * <RCDE constructionId={1} contractId={1} app={app}>
 *   <YourR3FComponentInTheViewerScene />
 * </RCDE>
 * ```
 */
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
