import "./App.css";
import { Root } from "./components/Root";
import { ClientProvider } from "./contexts/client";
import { ContractFilesProvider } from "./contexts/contractFiles";
import { ReferencePointProvider } from "./contexts/referencePoint";
import { GlobalStateContext } from "./contexts/state";

function App() {
  return (
    <GlobalStateContext.Provider>
      <ClientProvider>
        <ContractFilesProvider>
          <ReferencePointProvider>
            <Root />
          </ReferencePointProvider>
        </ContractFilesProvider>
      </ClientProvider>
    </GlobalStateContext.Provider>
  );
}

export default App;
