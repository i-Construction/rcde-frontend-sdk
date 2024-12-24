import "./App.css";
import { Root } from "./components/Root";
import { ClientProvider } from "./contexts/client";
import { ContractFilesProvider } from "./contexts/contractFiles";
import { GlobalStateContext } from "./contexts/state";

function App() {
  return (
    <GlobalStateContext.Provider>
      <ClientProvider>
        <ContractFilesProvider>
          <Root />
        </ContractFilesProvider>
      </ClientProvider>
    </GlobalStateContext.Provider>
  );
}

export default App;
