import { useEffect, useState } from "react";
import "./App.css";
import { RCDEClient } from '@rcde/api-sdk';
import axios from "axios";

function App() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const f = async () => {
      const clientId = 'VbATMQpPvL4u1CunoH07d5X5NZLrDHgO';
      const clientSecret = 'xCoz4aLSvp8IDAal';
      const baseUrl = 'http://localhost:8000';
      const client = new RCDEClient({
        clientId,
        clientSecret,
        baseUrl,
      });
      
      await client.authenticate();
      const list = await client.getConstructionList();
      console.log(list);
    };
    f();
  }, []);

  return (
    <>
      <div></div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;
