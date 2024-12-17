import { Container } from "@mui/material";
import { Root } from "./components/Root";
import { ClientProvider } from "./contexts/client";
import "./App.css";

function App() {
  return (
    <ClientProvider>
      <Root />
    </ClientProvider>
  );
}

export default App;
