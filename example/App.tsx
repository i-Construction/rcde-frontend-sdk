import { ClientProvider } from "../src/contexts/client";
import "./App.css";
import { Root } from "./components/Root";

function App() {
  return (
    <ClientProvider>
      <Root />
    </ClientProvider>
  );
}

export default App;
