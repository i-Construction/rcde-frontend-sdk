import { Container } from "@mui/material";
import { Root } from "./components/Root";
import { ClientProvider } from "./contexts/client";

function App() {
  return (
    <ClientProvider>
      <Container>
        <Root />
      </Container>
    </ClientProvider>
  );
}

export default App;
